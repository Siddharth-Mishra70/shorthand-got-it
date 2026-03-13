const LOCAL_STORAGE_KEY = 'shorthandians_local_results';

/**
 * saveTestResult
 * ─────────────────────────────────────────────────────────────────────────────
 * Saves a completed typing test attempt. Falls back to LocalStorage if Supabase fails.
 */
export async function saveTestResult(supabase, params) {
  const { userId, exerciseId, wpm, accuracy, attemptedText, originalText, mistakesCount } = params;

  /* ── Input validation ──────────────────────────────────────── */
  if (!userId)        throw new Error('saveTestResult: userId is required.');
  if (!exerciseId)    throw new Error('saveTestResult: exerciseId is required.');
  
  const row = {
    id:              crypto.randomUUID(),
    user_id:        userId,
    exercise_id:    exerciseId,
    wpm:            Math.round(wpm),
    accuracy:       parseFloat(accuracy.toFixed(2)),
    mistakes_count: mistakesCount ?? 0,
    attempted_text: attemptedText,
    original_text:  originalText,
    created_at:     new Date().toISOString()
  };

  try {
    /* ── Attempt Supabase Insert ────────────────────────────── */
    if (supabase && !supabase.supabaseUrl.includes('placeholder')) {
        const { data, error } = await supabase
          .from('TestAttempts')
          .insert(row)
          .select('id')
          .single();
          
        if (!error && data) return { attemptId: data.id };
        console.warn("[saveTestResult] Supabase failed, falling back to LocalStorage:", error?.message);
    }
  } catch (err) {
    console.warn("[saveTestResult] Network error, falling back to LocalStorage.");
  }

  /* ── LocalStorage Fallback ────────────────────────────────── */
  const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  existing.push(row);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));

  return { attemptId: row.id };
}

/**
 * fetchTestResult
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches result from Supabase OR LocalStorage.
 */
export async function fetchTestResult(supabase, attemptId) {
  if (!attemptId) throw new Error('fetchTestResult: attemptId is required.');

  try {
    if (supabase && !supabase.supabaseUrl.includes('placeholder')) {
        const { data, error } = await supabase
          .from('TestAttempts')
          .select('*')
          .eq('id', attemptId)
          .single();
        if (!error && data) return data;
    }
  } catch (err) {}

  // Local lookup
  const local = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  const match = local.find(r => r.id === attemptId);
  if (match) return match;

  throw new Error('Result not found in Database or LocalStorage.');
}

/**
 * fetchAllResults
 * ─────────────────────────────────────────────────────────────────────────────
 * Combines results from Supabase and LocalStorage.
 */
export async function fetchAllResults(supabase, userId) {
  let results = [];

  // 1. Try Supabase
  try {
    if (supabase && !supabase.supabaseUrl.includes('placeholder')) {
        const { data, error } = await supabase
          .from('TestAttempts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (!error && data) results = data;
    }
  } catch (err) {
    console.warn("[fetchAllResults] Supabase unreachable.");
  }

  // 2. Add Local Results
  const local = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  const filteredLocal = local.filter(r => r.user_id === userId);
  
  // Merge and sort
  const combined = [...results, ...filteredLocal].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );

  return combined;
}
