export type Gender = 'male' | 'female';
export type MasteryStage = 'learning' | 'practice' | 'independence_check' | 'graduated';
export type AssistanceLevel = 'independent' | 'reminder' | 'together' | 'needs_help' | 'not_completed';
export type Outcome = 'success' | 'needs_help' | 'not_completed';

export interface TaskTemplate {
  id: string;
  title: string;
  icon: string;
  baseXp: number;
  steps: readonly string[];
  supervision: 'none' | 'nearby' | 'direct';
  timeStart?: string;
  timeEnd?: string;
}

export interface Occurrence {
  id: string;
  template: TaskTemplate;
  stage: MasteryStage;
  priority: number;
  preferredTime?: string;
  status: 'planned' | 'started' | 'completed' | 'skipped';
}
