import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Banknote, 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  PieChart, 
  DollarSign, 
  Zap,
  ChevronRight,
  ShieldCheck,
  Plus,
  Settings,
  X,
  Target,
  Calendar,
  CreditCard,
  Check
} from 'lucide-react';
import { useFinance, CATEGORIES } from '@/hooks/useFinance';

export default function FinancePage() {
  const { config, transactions, loading, updateConfig, addTransaction, calculations } = useFinance();
  
  const [showLogModal, setShowLogModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');

  const [salaryInput, setSalaryInput] = useState('');
  const [savingsInput, setSavingsInput] = useState('');

  const handleLogTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isSubmitting) return;
    setIsSubmitting(true);
    await addTransaction({
      amount: Number(amount),
      category,
      description,
      type
    });
    setIsSubmitting(false);
    setShowLogModal(false);
    setAmount('');
    setDescription('');
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await updateConfig({
      monthly_salary: Number(salaryInput) || config.monthly_salary,
      savings_goal: Number(savingsInput) || config.savings_goal
    });
    setIsSubmitting(false);
    setShowConfigModal(false);
  };


  // Group transactions by category for stats
  const categoryStats = CATEGORIES.map(cat => {
    const total = transactions
      .filter(t => t.category === cat.id && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { ...cat, total };
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  return (
    <div className="min-h-screen bg-[#04060e] text-white p-6 pb-24 md:pb-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-blue-400 mb-1">
            <Zap size={14} className="fill-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Financial Matrix</span>
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase">Prime Finance</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setSalaryInput(config.monthly_salary.toString());
              setSavingsInput(config.savings_goal.toString());
              setShowConfigModal(true);
            }}
            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <Settings size={18} className="text-white/60" />
          </button>
          <button 
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-95"
          >
            <Plus size={18} />
            <span className="text-xs font-black uppercase tracking-wider">Log Entry</span>
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Stats & Chart Placeholder */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] relative overflow-hidden group">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Wallet size={12} className="text-blue-400" />
                </div>
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Monthly Salary</span>
              </div>
              <div className="text-xl font-black mb-1">₹{config.monthly_salary.toLocaleString()}</div>
              <div className="text-[8px] font-bold text-white/10 uppercase tracking-wider">NET INCOME</div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] relative overflow-hidden group">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Target size={12} className="text-emerald-400" />
                </div>
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Savings Goal</span>
              </div>
              <div className="text-xl font-black mb-1">₹{config.savings_goal.toLocaleString()}</div>
              <div className="text-[8px] font-bold text-emerald-400/40 uppercase tracking-wider">TARGET PROTOCOL</div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 relative overflow-hidden group">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/20">
                  <TrendingUp size={12} className="text-indigo-400" />
                </div>
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Total Invested</span>
              </div>
              <div className="text-xl font-black mb-1">₹{calculations.totalInvested.toLocaleString()}</div>
              <div className="text-[8px] font-bold text-indigo-400/60 uppercase tracking-wider">ASSET ACCUMULATION</div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="p-4 rounded-2xl bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.2)] relative overflow-hidden">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-white/20">
                  <Zap size={12} className="text-white" />
                </div>
                <span className="text-[9px] font-black text-blue-100 uppercase tracking-widest">Remaining</span>
              </div>
              <div className="text-xl font-black mb-1">₹{Math.round(calculations.remainingBudget).toLocaleString()}</div>
              <div className="text-[8px] font-black text-blue-100/60 uppercase tracking-wider">SAFE TO SPEND</div>
            </motion.div>
          </div>

          {/* Daily Allowance / Main Chart Area */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-600/15 to-indigo-600/5 border border-white/[0.08] relative overflow-hidden">
            <div className="relative z-10">
              <div className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-4 flex items-center gap-2">
                <ShieldCheck size={12} /> Daily Safe Spend Limit
              </div>
              <div className="flex flex-col md:flex-row md:items-end gap-6">
                <div>
                  <div className="text-7xl font-black italic tracking-tighter leading-none text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                    ₹{Math.floor(calculations.dailyAllowance)}
                    <span className="text-3xl opacity-30">.{(calculations.dailyAllowance % 1).toFixed(2).split('.')[1]}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
                      <Calendar size={12} className="text-blue-400" />
                      <span className="text-[10px] font-bold text-white/60 uppercase">{calculations.daysRemaining} Days Left</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
                      <CreditCard size={12} className="text-emerald-400" />
                      <span className="text-[10px] font-bold text-white/60 uppercase">Spent Today: ₹{calculations.spentToday}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 md:text-right">
                  <p className="text-[11px] text-white/30 uppercase font-black leading-relaxed max-w-[200px] ml-auto">
                    Your daily allowance is calculated based on remaining salary after savings goals and expenses.
                  </p>
                </div>
              </div>
            </div>

            {/* Subtle background decoration */}
            <div className="absolute -right-20 -bottom-20 opacity-[0.03] rotate-12 pointer-events-none">
              <TrendingUp size={400} />
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-6">Allocation Matrix</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {categoryStats.length === 0 ? (
                <p className="text-[10px] text-white/20 italic uppercase tracking-widest py-4">No allocation data detected for this month.</p>
              ) : (
                categoryStats.map(stat => (
                  <div key={stat.id}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{stat.icon}</span>
                        <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{stat.label}</span>
                      </div>
                      <span className="text-[10px] font-black tabular-nums text-blue-400">₹{stat.total.toLocaleString()}</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(stat.total / calculations.totalSpentMonth) * 100}%` }}
                        className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity */}
        <div className="space-y-6">
          <div className="flex flex-col h-[calc(100vh-200px)] lg:h-[calc(100vh-180px)] p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30">Transaction Log</h3>
              <div className="text-[9px] font-black px-2 py-1 rounded bg-white/5 text-white/40 uppercase tracking-widest">REAL-TIME</div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10">
              {transactions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                  <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center mb-4">
                    <PieChart size={24} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest">No entries found</p>
                </div>
              ) : (
                transactions.map((tx, i) => {
                  const cat = CATEGORIES.find(c => c.id === tx.category);
                  return (
                    <motion.div 
                      key={tx.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer group"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${tx.type === 'income' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                        {cat?.icon || '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold truncate text-white/90">{tx.description || cat?.label}</div>
                        <div className="text-[8px] text-white/20 uppercase font-black mt-0.5">{tx.category} • {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-[11px] font-black ${tx.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                          {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Log Modal */}
      <AnimatePresence>
        {showLogModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md px-4"
            onClick={() => setShowLogModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="bg-[#0a0a12] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)]"
              onClick={e => e.stopPropagation()}>
              
              <form onSubmit={handleLogTransaction}>
                <div className="p-6 border-b border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-blue-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <Banknote size={12} /> New Matrix Entry
                    </div>
                    <button type="button" onClick={() => setShowLogModal(false)} className="text-white/20 hover:text-white transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="flex gap-2 mb-6">
                    {(['expense', 'income', 'investment'] as const).map(t => (
                      <button key={t} type="button" 
                        onClick={() => {
                          setType(t === 'investment' ? 'expense' : t);
                          if (t === 'investment') setCategory('investment');
                          else if (category === 'investment') setCategory('food');
                        }}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          (t === 'investment' && category === 'investment') || (type === t && category !== 'investment')
                            ? (t === 'income' ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : t === 'investment' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]') 
                            : 'bg-white/5 text-white/30 border border-white/5'
                        }`}>{t}</button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-white/20">₹</span>
                    <input autoFocus type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                      placeholder="0.00" className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-10 pr-6 text-4xl font-black italic tracking-tighter text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-white/5" />
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {category !== 'investment' && (
                    <div>
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 block">Category</label>
                      <div className="grid grid-cols-3 gap-2">
                        {CATEGORIES.filter(c => type === 'income' ? c.id === 'income' : c.id !== 'income' && c.id !== 'investment').map(cat => (
                          <button key={cat.id} type="button" onClick={() => setCategory(cat.id)}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                              category === cat.id ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                            }`}>
                            <span className="text-xl">{cat.icon}</span>
                            <span className="text-[8px] font-bold uppercase truncate w-full text-center">{cat.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 block">Description</label>
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                      placeholder="Optional details..." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-all" />
                  </div>
                </div>

                <div className="p-6 bg-white/[0.02] flex gap-3">
                  <button type="submit" disabled={!amount || isSubmitting}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black uppercase tracking-tight transition-all active:scale-95 ${
                      amount ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-white/5 text-white/20 cursor-not-allowed'
                    }`}>
                    {isSubmitting ? 'Processing...' : <><Zap size={16} /> Finalise Protocol</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Config Modal */}
      <AnimatePresence>
        {showConfigModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md px-4"
            onClick={() => setShowConfigModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="bg-[#0a0a12] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden"
              onClick={e => e.stopPropagation()}>
              
              <form onSubmit={handleUpdateConfig}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter">System Config</h2>
                    <button type="button" onClick={() => setShowConfigModal(false)} className="text-white/20 hover:text-white transition-colors">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 block">Monthly Salary (₹)</label>
                      <input type="number" value={salaryInput} onChange={e => setSalaryInput(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xl font-black text-white focus:outline-none focus:border-blue-500/50 transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 block">Monthly Savings Goal (₹)</label>
                      <input type="number" value={savingsInput} onChange={e => setSavingsInput(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xl font-black text-emerald-400 focus:outline-none focus:border-emerald-500/50 transition-all" />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white/[0.02]">
                  <button type="submit" disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-tight hover:bg-blue-400 hover:text-white transition-all active:scale-95">
                    {isSubmitting ? 'Syncing...' : <><Check size={16} /> Update Matrix</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
