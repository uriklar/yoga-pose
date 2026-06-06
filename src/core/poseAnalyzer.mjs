import { POSE_RULES } from './yogaRules.mjs';

export function analyzePose({ pose, landmarks }) {
  const rule = POSE_RULES[pose];
  if (!rule) {
    return {
      pose,
      confidence: 0,
      score: 0,
      feedback: [{ id: 'unknown-pose', severity: 'high', message: `Unsupported pose: ${pose}` }],
    };
  }
  return rule(landmarks ?? {});
}

export function summarizeAnalysis(result, maxItems = 3) {
  const tips = result.feedback
    .filter((item) => item.severity !== 'info')
    .slice(0, maxItems);
  const fallback = result.feedback.filter((item) => item.severity === 'info').slice(0, maxItems);
  return (tips.length ? tips : fallback).map((item) => item.message);
}
