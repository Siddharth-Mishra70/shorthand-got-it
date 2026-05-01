const LOCAL_STORAGE_KEY = 'shorthandians_local_results';

/**
 * saveTestResult
 * ─────────────────────────────────────────────────────────────────────────────
 * Saves a completed typing test attempt. Falls back to LocalStorage if Supabase fails.
 *
 * Supabase schema (test_results table):
 *   id             – uuid  (generated client-side)
 *   user_id        – uuid
 *   exercise_id    – uuid  (links to exercises table which stores original_text)
 *   wpm            – integer
 *   accuracy       – float
 *   total_mistakes – integer
 *   mistakes_data  – jsonb  { attempted_text: string, ...future fields }
 *   created_at     – timestamptz
 */
export async function saveTestResult(supabase, params) {
  const { wpm, accuracy, attemptedText, mistakesCount } = params;

  // 1. Auth Check - Safely get user from localStorage
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  } catch (e) {
    console.error('Failed to parse currentUser:', e);
  }

  if (!currentUser || !currentUser.id) {
    alert('Please login first to save results!');
    console.error('[saveTestResult] AUTH_ERROR: No valid user in localStorage');
    return { error: 'Not Logged In' };
  }

  // Determine Naming
  const userId = params.userId || currentUser.id || '00000000-0000-0000-0000-000000000000';
  const studentName = params.studentName || currentUser.name || 'Student';

  const row = {
    user_id:        userId,
    exercise_id:    params.exerciseId || null,
    wpm:            Math.round(params.wpm || 0),
    accuracy:       parseFloat((params.accuracy || 0).toFixed(2)),
    total_mistakes: params.totalMistakes ?? params.mistakesCount ?? 0,
    mistakes_data: {
      attempted_text: attemptedText ?? '',
      original_text: params.originalText ?? '',
      student_name: studentName,
      category: params.exerciseCategory || 'General', // Store category here for safely
      ...(params.extraMistakesData || {})
    }
  };

  // 2. Log the Payload for Debugging
  console.log("Submitting Payload:", row);

  try {
    if (supabase && !supabase.supabaseUrl.includes('placeholder')) {
      const { data, error } = await supabase
        .from('test_results')
        .insert(row)
        .select()
        .single();

      if (error) {
        console.error("SUPABASE ASLI ERROR:", JSON.stringify(error, null, 2));
        throw new Error(error.message || "Database insert error");
      }

      // 4. Success Catch
      console.log("[saveTestResult] SUCCESS:", data);
      return { attemptId: data.id, ...data };
    } else {
      throw new Error('Supabase client not initialized or using placeholders');
    }
  } catch (error) {
    console.warn('[saveTestResult] Falling back to local storage due to error:', error?.message);
    
    /* ── LocalStorage Fallback ────────────────────────────────── */
    const localKey = 'stn_local_results';
    const attemptId = 'local_' + Date.now();
    const localData = JSON.parse(localStorage.getItem(localKey) || '[]');
    const localEntry = { ...row, id: attemptId, created_at: new Date().toISOString() };
    localData.push(localEntry);
    localStorage.setItem(localKey, JSON.stringify(localData.slice(-50)));
    return { attemptId, localOnly: true };
  }
}

/**
 * fetchTestResult
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches a single result by attemptId from Supabase OR LocalStorage.
 */
export async function fetchTestResult(supabase, attemptId) {
  if (!attemptId) throw new Error('fetchTestResult: attemptId is required.');

  // If it's a locally-saved result, skip Supabase entirely
  const isLocal = String(attemptId).startsWith('local_');

  if (!isLocal) {
    try {
      if (supabase && !supabase.supabaseUrl.includes('placeholder')) {
        const { data, error } = await supabase
          .from('test_results')
          .select('*')
          .eq('id', attemptId)
          .single();
        if (!error && data) return data;
      }
    } catch (err) {
      console.warn('[fetchTestResult] Supabase lookup failed, checking local storage.');
    }
  }

  // Local lookup — check both keys for compatibility
  const localKeys = ['stn_local_results', 'shorthandians_local_results'];
  for (const key of localKeys) {
    const local = JSON.parse(localStorage.getItem(key) || '[]');
    const match = local.find(r => r.id === attemptId);
    if (match) return match;
  }

  throw new Error('Result not found in Database or LocalStorage.');
}

/**
 * fetchAllResults
 * ─────────────────────────────────────────────────────────────────────────────
 * Combines results from Supabase and LocalStorage, sorted newest-first.
 */
export async function fetchAllResults(supabase, userId) {
  let results = [];

  // 1. Try Supabase
  try {
    if (supabase && !supabase.supabaseUrl.includes('placeholder')) {
      const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) results = data;
    }
  } catch (err) {
    console.warn('[fetchAllResults] Supabase unreachable.');
  }

  // 2. Merge with Local Results
  const local = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  const filteredLocal = local.filter(r => r.user_id === userId);

  // Sort combined results newest-first
  const combined = [...results, ...filteredLocal].sort((a, b) =>
    new Date(b.created_at) - new Date(a.created_at)
  );

  return combined;
}
