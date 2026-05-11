import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useMuscleStore } from '../lib/store';
import { XP_GAIN_PER_SESSION } from '../lib/muscle-logic';

export const useMuscleProgress = () => {
  const { user } = useAuth();
  const { progress, lastTrained, loading, setProgress, setLastTrained, setLoading, isInitialized } = useMuscleStore();

  const fetchProgress = useCallback(async (force = false) => {
    if (!user) return;
    if (isInitialized && !force) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_muscle_progress')
      .select('muscle_id, total_xp, last_trained')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching progress:', error);
    } else {
      const xpMap = data.reduce((acc: any, curr) => {
        acc[curr.muscle_id] = curr.total_xp;
        return acc;
      }, {});
      const ltMap = data.reduce((acc: any, curr) => {
        if (curr.last_trained) acc[curr.muscle_id] = curr.last_trained;
        return acc;
      }, {});
      setProgress(xpMap);
      setLastTrained(ltMap);
    }
    setLoading(false);
  }, [user, isInitialized, setProgress, setLastTrained, setLoading]);

  useEffect(() => {
    if (user) {
      fetchProgress();
    }
  }, [user, fetchProgress]);

  const [isLogging, setIsLogging] = useState(false);

  const logWorkout = async (muscleId: string) => {
    if (!user) return;
    setIsLogging(true);

    try {
      // 1. Identify all muscles trained today
      const now = new Date();
      const isToday = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
      };

      const musclesToday = Object.keys(lastTrained).filter(id => isToday(lastTrained[id]));
      const isNewMuscleToday = !musclesToday.includes(muscleId);

      if (!isNewMuscleToday) {
        // Already part of today's budget, just update the timestamp
        await supabase.from('user_muscle_progress').upsert({
          user_id: user.id,
          muscle_id: muscleId,
          total_xp: progress[muscleId] || 0,
          last_trained: now.toISOString()
        }, { onConflict: 'user_id, muscle_id' });
        setLastTrained({ ...lastTrained, [muscleId]: now.toISOString() });
        setIsLogging(false);
        return;
      }

      // 2. Calculate redistribution
      const K = musclesToday.length; // Number of muscles already in today's budget
      const N = K + 1;               // New total count
      const newShare = 100 / N;
      const oldShare = K > 0 ? 100 / K : 0;

      const updates: any[] = [];
      const newProgress = { ...progress };
      const newLastTrained = { ...lastTrained };

      // Update existing muscles from today
      for (const id of musclesToday) {
        const adjustedXp = (progress[id] || 0) - oldShare + newShare;
        newProgress[id] = adjustedXp;
        updates.push({
          user_id: user.id,
          muscle_id: id,
          total_xp: adjustedXp,
          last_trained: lastTrained[id]
        });
      }

      // Add the new muscle
      const newMuscleXp = (progress[muscleId] || 0) + newShare;
      newProgress[muscleId] = newMuscleXp;
      newLastTrained[muscleId] = now.toISOString();
      updates.push({
        user_id: user.id,
        muscle_id: muscleId,
        total_xp: newMuscleXp,
        last_trained: now.toISOString()
      });

      // 3. Perform bulk update
      const { error } = await supabase
        .from('user_muscle_progress')
        .upsert(updates, { onConflict: 'user_id, muscle_id' });

      if (error) {
        console.error('Error during redistribution:', error);
      } else {
        setProgress(newProgress);
        setLastTrained(newLastTrained);
        
        // Log to history (optional: we log the actual share earned)
        await supabase.from('workout_logs').insert({
          user_id: user.id,
          muscle_id: muscleId,
          xp_earned: newShare
        });
      }
    } finally {
      setIsLogging(false);
    }
  };

  return { progress, lastTrained, loading, logWorkout, isLogging, refresh: () => fetchProgress(true) };
};
