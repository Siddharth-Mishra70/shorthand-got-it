import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { saveTestResult } from './saveTestResult';

/**
 * useTestResultSaver
 * ─────────────────────────────────────────────────────────────────────────────
 * React hook that wraps `saveTestResult` with UI-friendly loading / error state
 * and triggers navigation to the result page on success.
 *
 * Usage (inside a component):
 * ─────────────────────────────
 *   const { save, saving, error } = useTestResultSaver({
 *     onSuccess: (attemptId) => setCurrentView(`results:${attemptId}`),
 *   });
 *
 *   // Call when the test finishes:
 *   await save({
 *     userId:        currentUser.id,
 *     exerciseId:    'kailash-vol1-ex3',
 *     wpm:           85,
 *     accuracy:      91.5,
 *     attemptedText: typedText,
 *     originalText:  referenceText,
 *     mistakesCount: 12,
 *   });
 *
 * @param {{ onSuccess: (attemptId: string) => void }} options
 */
export function useTestResultSaver({ onSuccess } = {}) {
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);
  const [savedId, setSavedId] = useState(null);

  const save = useCallback(async (params) => {
    setSaving(true);
    setError(null);
    try {
      const { attemptId } = await saveTestResult(supabase, params);
      setSavedId(attemptId);
      onSuccess?.(attemptId);          // ← triggers navigation in the caller
      return attemptId;
    } catch (err) {
      setError(err.message);
      console.error('[useTestResultSaver]', err);
      return null;
    } finally {
      setSaving(false);
    }
  }, [onSuccess]);

  return { save, saving, error, savedId };
}

export default useTestResultSaver;
