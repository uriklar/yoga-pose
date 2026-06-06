/**
 * @typedef {{x:number,y:number,z?:number,score?:number}} Landmark
 * @typedef {Record<string, Landmark>} LandmarkMap
 * @typedef {{id:string,severity:'info'|'low'|'medium'|'high',message:string,metric?:string,value?:number,target?:string}} FeedbackItem
 * @typedef {{pose:string, confidence:number, score:number, feedback: FeedbackItem[]}} AnalysisResult
 */
export const REQUIRED = true;
