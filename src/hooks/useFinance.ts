import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface FinanceConfig {
  monthly_salary: number;
  savings_goal: number;
}

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  type: 'income' | 'expense';
  date: string;
}

export const CATEGORIES = [
  { id: 'food', label: 'Food & Drink', icon: '🍔' },
  { id: 'transport', label: 'Transport', icon: '🚗' },
  { id: 'tech', label: 'Tech & Gear', icon: '💻' },
  { id: 'health', label: 'Health', icon: '🏥' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { id: 'utilities', label: 'Utilities', icon: '⚡' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'investment', label: 'Investment', icon: '📈' },
  { id: 'other', label: 'Other', icon: '📦' },
  { id: 'income', label: 'Income', icon: '💰' },
];

export const useFinance = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<FinanceConfig>({ monthly_salary: 0, savings_goal: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Fetch config
    const { data: configData, error: configError } = await supabase
      .from('user_finance_config')
      .select('monthly_salary, savings_goal')
      .eq('user_id', user.id)
      .single();

    if (configData) {
      setConfig({
        monthly_salary: Number(configData.monthly_salary),
        savings_goal: Number(configData.savings_goal)
      });
    }

    // Fetch transactions for the current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    
    const { data: transData, error: transError } = await supabase
      .from('finance_transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', firstDay)
      .order('date', { ascending: false });

    if (transData) {
      setTransactions(transData.map(t => ({
        ...t,
        amount: Number(t.amount)
      })));
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateConfig = async (newConfig: Partial<FinanceConfig>) => {
    if (!user) return;
    const { error } = await supabase
      .from('user_finance_config')
      .upsert({
        user_id: user.id,
        ...config,
        ...newConfig,
        updated_at: new Date().toISOString()
      });

    if (!error) {
      setConfig(prev => ({ ...prev, ...newConfig }));
      fetchData(); // Sync with DB
    }
    return error;
  };

  const addTransaction = async (tx: Omit<Transaction, 'id' | 'date'> & { date?: string }) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('finance_transactions')
      .insert({
        user_id: user.id,
        ...tx,
        date: tx.date || new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (!error && data) {
      setTransactions(prev => [{ ...data, amount: Number(data.amount) }, ...prev]);
      fetchData(); // Sync with DB to ensure all derived stats are perfect
    }
    return error;
  };

  // Calculations
  const now = new Date();
  // Get YYYY-MM-DD in local time
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - now.getDate() + 1;

  const totalSpentMonth = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const spentToday = transactions
    .filter(t => t.date === todayStr && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncomeMonth = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalInvested = transactions
    .filter(t => t.category === 'investment')
    .reduce((sum, t) => sum + t.amount, 0);

  // Total budget = Salary + other income - Savings Goal
  const totalBudget = config.monthly_salary + totalIncomeMonth - config.savings_goal;
  const remainingBudget = totalBudget - totalSpentMonth;
  
  // Daily allowance: Remaining budget / days left
  const dailyAllowance = Math.max(0, remainingBudget / daysRemaining);

  return {
    config,
    transactions,
    loading,
    updateConfig,
    addTransaction,
    calculations: {
      spentToday,
      totalSpentMonth,
      totalInvested,
      remainingBudget,
      dailyAllowance,
      daysRemaining,
      totalBudget
    },
    refresh: fetchData
  };
};
