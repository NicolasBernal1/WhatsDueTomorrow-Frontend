export type ApprovalStatus =
  | 'Aprobando'
  | 'En riesgo'
  | 'Aprobado'
  | 'Sin calificaciones';

export interface Evaluation {
  id: number;
  name: string;
  weight: number;
  score: number;
  createdAt: string;
  updatedAt: string;
  subjectId?: number;
}

export interface GradeSummary {
  totalWeight: number;
  remainingWeight: number;
  currentContribution: number;
  currentAverage: number;
  requiredGrade: number | null;
  isPassing: boolean;
  isAttainable: boolean;
  status: ApprovalStatus;
  weightExceeded: boolean;
  passingGrade: number;
  maxGrade: number;
}

export interface EvaluationListResponse {
  evaluations: Evaluation[];
  summary: GradeSummary;
}

export interface CreateEvaluationDto {
  name: string;
  weight: number;
  score: number;
}

export interface UpdateEvaluationDto {
  name?: string;
  weight?: number;
  score?: number;
}

export interface SimulateGradeDto {
  targetGrade?: number;
  hypotheticalScore?: number;
}

export interface SimulationResult {
  summary: GradeSummary;
  targetGrade: number;
  requiredForTarget: number | null;
  isTargetAttainable: boolean;
  hypotheticalScore: number | null;
  hypotheticalFinalGrade: number | null;
  hypotheticalStatus: ApprovalStatus | null;
}
