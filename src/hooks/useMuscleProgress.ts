import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { XP_GAIN_PER_SESSION } from '../lib/muscle-logic';

export const useMuscleProgress = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchProgress = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_muscle_progress')
      .select('muscle_id, total_xp')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching progress:', error);
    } else {
      const mapping = data.reduce((acc: any, curr) => {
        acc[curr.muscle_id] = curr.total_xp;
        return acc;
      }, {});
      setProgress(mapping);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProgress();
  }, [user]);

  const [isLogging, setIsLogging] = useState(false);

  const logWorkout = async (muscleId: string) => {
    if (!user) return;
    setIsLogging(true);

    try {
      // 1. Get current XP
      const currentXp = progress[muscleId] || 0;
      const newXp = currentXp + XP_GAIN_PER_SESSION;

      // 2. Update DB (Upsert)
      const { error } = await supabase
        .from('user_muscle_progress')
        .upsert({
          user_id: user.id,
          muscle_id: muscleId,
          total_xp: newXp,
          last_trained: new Date().toISOString()
        }, { onConflict: 'user_id, muscle_id' });

      if (error) {
        console.error('Error logging workout:', error);
      } else {
        // 3. Update local state
        setProgress(prev => ({ ...prev, [muscleId]: newXp }));
        
        // 4. Log to history
        await supabase.from('workout_logs').insert({
          user_id: user.id,
          muscle_id: muscleId,
          xp_earned: XP_GAIN_PER_SESSION
        });
      }
    } finally {
      setIsLogging(false);
    }
  };

  return { progress, loading, logWorkout, isLogging, refresh: fetchProgress };
};
