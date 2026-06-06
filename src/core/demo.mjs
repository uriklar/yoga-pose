import { analyzePose, summarizeAnalysis } from './poseAnalyzer.mjs';

const samplePlank = {
  leftShoulder: { x: 0.25, y: 0.30, score: 0.9 },
  rightShoulder: { x: 0.35, y: 0.31, score: 0.9 },
  leftHip: { x: 0.55, y: 0.47, score: 0.9 },
  rightHip: { x: 0.65, y: 0.48, score: 0.9 },
  leftAnkle: { x: 0.88, y: 0.66, score: 0.9 },
  rightAnkle: { x: 0.92, y: 0.67, score: 0.9 },
  leftWrist: { x: 0.24, y: 0.62, score: 0.9 },
  rightWrist: { x: 0.35, y: 0.62, score: 0.9 },
};

const result = analyzePose({ pose: 'plank', landmarks: samplePlank });
console.log(JSON.stringify({ result, summary: summarizeAnalysis(result) }, null, 2));
