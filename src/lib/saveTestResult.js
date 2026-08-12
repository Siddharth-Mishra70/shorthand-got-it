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
 *   mistakes_data  – jsonb  { attempted_text: string, ...section fields }
 *   created_at     – timestamptz
 */
export async function saveTestResult(supabase, params) {
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

  // Determine Naming and UUID sanity
  const userId = params.userId || currentUser.id || '00000000-0000-0000-0000-000000000000';
  const studentName = params.studentName || currentUser.name || 'Student';

  const isValidUuid = (id) => {
    if (!id || typeof id !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  };

  const exerciseTitle = params.exerciseTitle || params.exercise_title || (!isValidUuid(params.exerciseId) ? params.exerciseId : 'Unknown Practice');
  const exerciseId = params.exerciseId && isValidUuid(params.exerciseId) ? params.exerciseId : null;

  // ── Section Metrics (enriched for section-wise result tracking) ──────────
  const refText = params.originalText || '';
  const typedText = params.attemptedText || '';
  const refWords = refText.trim().split(/\s+/).filter(w => w !== '');
  const typedWords = typedText.trim().split(/\s+/).filter(w => w !== '');

  let correctWords = 0;
  let incorrectWords = 0;
  let missedWords = 0;

  refWords.forEach((refWord, i) => {
    const typedWord = typedWords[i];
    if (!typedWord) { missedWords++; return; }
    if (typedWord === refWord) { correctWords++; }
    else { incorrectWords++; }
  });
  if (typedWords.length > refWords.length) {
    incorrectWords += typedWords.length - refWords.length;
  }

  // Time taken
  const timeTakenSeconds = params.timeTakenSeconds ?? 0;
  const timeTakenDisplay = timeTakenSeconds > 0
    ? `${Math.floor(timeTakenSeconds / 60)}m ${timeTakenSeconds % 60}s`
    : (params.timeTakenDisplay || '');

  const totalMistakesCalc = params.totalMistakes ?? params.mistakesCount ?? (incorrectWords + missedWords);
  const scorePercent = params.score ?? parseFloat((params.accuracy || 0).toFixed(2));

  const row = {
    user_id:        userId,
    exercise_id:    exerciseId,
    wpm:            Math.round(params.wpm || 0),
    accuracy:       parseFloat((params.accuracy || 0).toFixed(2)),
    total_mistakes: totalMistakesCalc,
    mistakes_data: {
      attempted_text:   typedText,
      original_text:    refText,
      student_name:     studentName,
      category:         params.exerciseCategory || 'General',
      exercise_title:   exerciseTitle,
      // ── Section-wise performance fields ─────────────────────────
      section_name:     params.sectionName || params.exerciseCategory || 'General',
      test_name:        params.testName || exerciseTitle,
      total_words:      refWords.length,
      correct_words:    correctWords,
      incorrect_words:  incorrectWords,
      missed_words:     missedWords,
      time_taken:       timeTakenDisplay,
      time_taken_sec:   timeTakenSeconds,
      score:            scorePercent,
      result_status:    params.resultStatus || (scorePercent >= 80 ? 'Passed' : scorePercent >= 50 ? 'Completed' : 'Failed'),
      ...(params.extraMistakesData || {})
    }
  };

  // 2. Log the Payload for Debugging
  console.log("Submitting Payload:", row);

  let resultPayload = null;
  try {
    if (supabase && !supabase.supabaseUrl.includes('placeholder')) {
      let { data, error } = await supabase
        .from('test_results')
        .insert(row)
        .select()
        .single();

      if (error && error.code === '23503' && row.exercise_id !== null) {
        console.warn("[saveTestResult] Foreign key constraint violation on exercise_id. Retrying insert with exercise_id = null");
        row.exercise_id = null;
        const retryResult = await supabase
          .from('test_results')
          .insert(row)
          .select()
          .single();
        data = retryResult.data;
        error = retryResult.error;
      }

      if (error) {
        console.error("SUPABASE ASLI ERROR:", JSON.stringify(error, null, 2));
        throw new Error(error.message || "Database insert error");
      }

      // 4. Success Catch
      console.log("[saveTestResult] SUCCESS:", data);
      resultPayload = { attemptId: data.id, ...data };
    } else {
      throw new Error('Supabase client not initialized or using placeholders');
    }
  } catch (error) {
    console.warn('[saveTestResult] Falling back to local storage due to error:', error?.message);
    
    /* ── LocalStorage Fallback ────────────────────────────────── */
    const localKey = LOCAL_STORAGE_KEY;
    const attemptId = 'local_' + Date.now();
    const localData = JSON.parse(localStorage.getItem(localKey) || '[]');
    const localEntry = { ...row, id: attemptId, created_at: new Date().toISOString() };
    localData.push(localEntry);
    localStorage.setItem(localKey, JSON.stringify(localData.slice(-50)));
    resultPayload = { attemptId, localOnly: true };
  }
  
  // ── Track Free Trial Usage ──────────────────────────────────
  const courseCategory = params.exerciseCategory || 'General';
  const enrolled = currentUser.enrolled_courses || [];
  
  if (currentUser.role !== 'admin' && !enrolled.includes(courseCategory)) {
    const usedTrials = currentUser.used_trials || [];
    if (!usedTrials.includes(courseCategory)) {
      usedTrials.push(courseCategory);
      currentUser.used_trials = usedTrials;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      
      if (supabase && !supabase.supabaseUrl.includes('placeholder')) {
        supabase.from('users').update({ used_trials: usedTrials }).eq('id', currentUser.id)
          .then(() => console.log(`[saveTestResult] updated free trial for ${courseCategory}`))
          .catch(err => console.error("Failed to update used_trials in DB", err));
      }
    }
  }

  return resultPayload;
}

/**
 * fetchTestResult
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches a single result by attemptId from Supabase OR LocalStorage.
 * SECURITY: currentUserId enforces student-level result isolation.
 */
export async function fetchTestResult(supabase, attemptId, currentUserId = null) {
  if (!attemptId) throw new Error('fetchTestResult: attemptId is required.');

  const isLocal = String(attemptId).startsWith('local_');

  if (!isLocal) {
    try {
      if (supabase && !supabase.supabaseUrl.includes('placeholder')) {
        let query = supabase
          .from('test_results')
          .select('*')
          .eq('id', attemptId);

        // ── SECURITY: Enforce student-level result isolation ──────
        if (currentUserId) {
          const { data: userRecord } = await supabase
            .from('users')
            .select('role')
            .eq('id', currentUserId)
            .maybeSingle();
          
          if (!userRecord || userRecord.role !== 'admin') {
            query = query.eq('user_id', currentUserId);
          }
        }

        const { data, error } = await query.single();
        if (!error && data) return data;
      }
    } catch (err) {
      console.warn('[fetchTestResult] Supabase lookup failed, checking local storage.');
    }
  }

  // Local lookup
  const localKeys = ['stn_local_results', 'shorthandians_local_results'];
  for (const key of localKeys) {
    const local = JSON.parse(localStorage.getItem(key) || '[]');
    const match = local.find(r => r.id === attemptId);
    if (match) {
      if (currentUserId && match.user_id && match.user_id !== currentUserId) {
        const cu = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (cu.role !== 'admin') {
          throw new Error('Access denied: You do not have permission to view this result.');
        }
      }
      return match;
    }
  }

  throw new Error('Result not found in Database or LocalStorage.');
}

/**
 * fetchAllResults
 * ─────────────────────────────────────────────────────────────────────────────
 * Combines results from Supabase and LocalStorage, sorted newest-first.
 * SECURITY: userId filter is always applied on Supabase query.
 */
export async function fetchAllResults(supabase, userId) {
  let results = [];

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

  const local1 = JSON.parse(localStorage.getItem('shorthandians_local_results') || '[]');
  const local2 = JSON.parse(localStorage.getItem('stn_local_results') || '[]');
  const local = [...local1, ...local2];
  const filteredLocal = local.filter(r => r.user_id === userId);

  // Sort combined results newest-first
  const combined = [...results, ...filteredLocal].sort((a, b) =>
    new Date(b.created_at) - new Date(a.created_at)
  );

  return combined;
}

/**
 * verifyTestAccess
 * ─────────────────────────────────────────────────────────────────────────────
 * Subscription access control helper.
 * Determines if a user has access to a specific course/module.
 */
export const verifyTestAccess = (user, courseId) => {
  if (user?.role === 'admin') return { allowed: true };
  
  const enrolled = user?.enrolled_courses || [];
  if (enrolled.includes(courseId)) {
    return { allowed: true };
  }
  
  const usedTrials = user?.used_trials || [];
  if (usedTrials.includes(courseId)) {
    return { 
      allowed: false, 
      reason: 'Free Trial Exhausted', 
      message: 'You have used your one-time free trial for this module. Please purchase a subscription to continue.' 
    };
  }

  return { allowed: true };
};
