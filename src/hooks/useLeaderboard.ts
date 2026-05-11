import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface LeaderboardEntry {
  userId: string;
  username: string;
  gymXp: number;
  goalsXp: number;
  level: number;
  isCurrentUser: boolean;
}

export const useLeaderboard = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      // 1. All profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, email, total_points, level');

      // 2. All muscle progress rows
      const { data: muscleRows } = await supabase
        .from('user_muscle_progress')
        .select('user_id, total_xp');

      // 3. Aggregate gym XP per user
      const gymXpMap: Record<string, number> = {};
      muscleRows?.forEach(r => {
        gymXpMap[r.user_id] = (gymXpMap[r.user_id] || 0) + r.total_xp;
      });

      // 4. Combine
      const combined: LeaderboardEntry[] = (profiles ?? []).map(p => ({
        userId: p.id,
        username: p.username || p.email?.split('@')[0] || 'Warrior',
        gymXp: gymXpMap[p.id] || 0,
        goalsXp: p.total_points || 0,
        level: p.level || 1,
        isCurrentUser: p.id === user?.id,
      }));

      setEntries(combined);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchLeaderboard(); }, [user]);

  return { entries, loading, refresh: fetchLeaderboard };
};
