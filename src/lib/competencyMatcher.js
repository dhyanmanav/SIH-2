const STOP_WORDS = new Set([
  'and', 'the', 'for', 'with', 'from', 'into', 'course', 'fundamentals',
  'training', 'basics', 'advanced', 'of', 'in', 'to', 'a', 'an',
])

export function competencyTokens(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s,-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
}

export function matchCompetencyScore(competencies, course) {
  const goals = [...new Set((competencies ?? []).flatMap(competencyTokens))]
  const courseTokens = new Set(competencyTokens(`${course.title} ${course.category} ${course.description}`))
  const matched = goals.filter((goal) => [...courseTokens].some((token) => token.includes(goal) || goal.includes(token)))
  const score = goals.length ? Math.min(100, Math.round((matched.length / goals.length) * 100)) : 0
  return { score, matched }
}

export function matchTrainerScore(competencies, trainer) {
  const goals = [...new Set((competencies ?? []).flatMap(competencyTokens))]
  const expertise = new Set(competencyTokens(`${trainer?.skills?.join(' ')} ${trainer?.designation} ${trainer?.bio}`))
  const matched = goals.filter((goal) => [...expertise].some((token) => token.includes(goal) || goal.includes(token)))
  return {
    score: goals.length ? Math.min(100, Math.round((matched.length / goals.length) * 100)) : 0,
    matched,
  }
}

export function getBestTrainer(competencies, trainers) {
  return [...(trainers ?? [])]
    .map((trainer) => ({ trainer, ...matchTrainerScore(competencies, trainer) }))
    .sort((a, b) => b.score - a.score)[0] ?? null
}
