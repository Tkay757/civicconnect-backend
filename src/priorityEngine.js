/**
 * Priority Scoring Engine (Slide 7):
 * Priority = severity category + community support + optional time waiting.
 * "Safety severity should outweigh popularity"
 */
export function calculatePriority(severity = 'MEDIUM', upvotesCount = 0, createdAt = new Date()) {
  const baseScores = {
    HIGH: 50,
    MEDIUM: 30,
    LOW: 10,
  };

  const severityScore = baseScores[severity] || 30;

  // Upvotes contribute 2 pts per vote, capped at 30 pts
  const upvoteScore = Math.min(upvotesCount * 2, 30);

  // Time waiting: +2 pts per day reported, capped at 20 pts
  const reportedDate = new Date(createdAt);
  const now = new Date();
  const daysWaiting = Math.max(0, Math.floor((now - reportedDate) / (1000 * 60 * 60 * 24)));
  const timeScore = Math.min(daysWaiting * 2, 20);

  const totalScore = severityScore + upvoteScore + timeScore;

  let priorityLevel = 'LOW';
  if (totalScore >= 60 || severity === 'HIGH') {
    priorityLevel = 'HIGH';
  } else if (totalScore >= 35) {
    priorityLevel = 'MEDIUM';
  } else {
    priorityLevel = 'LOW';
  }

  return {
    totalScore,
    priorityLevel,
    severityScore,
    upvoteScore,
    timeScore,
    daysWaiting,
  };
}
