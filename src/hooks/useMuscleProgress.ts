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
    // We still want to show loading on first load, but don't block subsequent fetches
    if (!isInitialized) setLoading(true);

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

  const logWorkoutSession = async (muscleIds: string[]) => {
    if (!user || muscleIds.length === 0) return;
    setIsLogging(true);

    try {
      const now = new Date();
      const isToday = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
      };

      // 1. Identify all muscles trained today (excluding those in the new session)
      const existingMusclesToday = Object.keys(lastTrained).filter(id => isToday(lastTrained[id]) && !muscleIds.includes(id));
      
      const newProgress = { ...progress };
      const newLastTrained = { ...lastTrained };
      const updates: any[] = [];
      const logs: any[] = [];

      // Total count of muscles trained today will be: existing + new
      const N = existingMusclesToday.length + muscleIds.length;
      const sharePerMuscle = 100 / N;

      // Adjust existing muscles from today
      const K = existingMusclesToday.length;
      const oldShare = K > 0 ? 100 / K : 0; // This is actually not quite right if we want to be perfectly fair, 
      // but the logic seems to be: total daily budget is 100 XP, split equally among all muscles trained today.
      
      for (const id of existingMusclesToday) {
        // If we previously had K muscles, each had 100/K. Now we have N, each gets 100/N.
        // The difference to apply is (100/N) - (100/K).
        const oldIndividualShare = 100 / (K); // assuming they were the only ones
        // Wait, the logic in the original code was: (progress[id] - oldShare + newShare)
        // where oldShare = 100/K and newShare = 100/(K+1).
        // For multiple additions, it's simpler: 
        // Total XP for a muscle = (XP from other days) + (100 / TotalMusclesToday)
        
        // Let's calculate the "base XP" (XP earned before today)
        const baseXp = (progress[id] || 0) - (K > 0 ? 100/K : 0);
        const adjustedXp = baseXp + sharePerMuscle;
        
        newProgress[id] = adjustedXp;
        updates.push({
          user_id: user.id,
          muscle_id: id,
          total_xp: adjustedXp,
          last_trained: lastTrained[id]
        });
      }

      // Add the new muscles
      for (const muscleId of muscleIds) {
        const baseXp = progress[muscleId] || 0;
        // If it was already trained today, we don't add full share, we just re-calculate it?
        // Actually, the UI prevents double logging usually, but let's be safe.
        // If it WAS trained today, it's already in the "existingMusclesToday" if we didn't filter it out.
        // But I filtered it out.
        
        const newMuscleXp = baseXp + sharePerMuscle;
        newProgress[muscleId] = newMuscleXp;
        newLastTrained[muscleId] = now.toISOString();
        
        updates.push({
          user_id: user.id,
          muscle_id: muscleId,
          total_xp: newMuscleXp,
          last_trained: now.toISOString()
        });

        logs.push({
          user_id: user.id,
          muscle_id: muscleId,
          xp_earned: sharePerMuscle
        });
      }

      // 3. Perform bulk updates
      const { error: upsertError } = await supabase
        .from('user_muscle_progress')
        .upsert(updates, { onConflict: 'user_id, muscle_id' });

      if (upsertError) throw upsertError;

      const { error: logError } = await supabase
        .from('workout_logs')
        .insert(logs);

      if (logError) throw logError;

      setProgress(newProgress);
      setLastTrained(newLastTrained);

    } catch (error) {
      console.error('Error during bulk logging:', error);
    } finally {
      setIsLogging(false);
    }
  };

  const logWorkout = async (muscleId: string) => {
    await logWorkoutSession([muscleId]);
  };

  return { progress, lastTrained, loading, logWorkout, logWorkoutSession, isLogging, refresh: () => fetchProgress(true) };
};
