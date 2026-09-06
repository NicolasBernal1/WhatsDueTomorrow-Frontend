import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BaseResponseDto } from '../models/base-response.dto';
import {
  ApprovalStatus,
  CreateEvaluationDto,
  Evaluation,
  EvaluationListResponse,
  GradeSummary,
  SimulateGradeDto,
  SimulationResult,
  UpdateEvaluationDto,
} from '../models/evaluation.model';

const PASSING_GRADE = 3.0;
const MAX_GRADE = 5.0;

export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

@Injectable({ providedIn: 'root' })
export class EvaluationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getEvaluationsBySubject(
    subjectId: number,
  ): Observable<BaseResponseDto<EvaluationListResponse>> {
    return this.http.get<BaseResponseDto<EvaluationListResponse>>(
      `${this.apiUrl}/subjects/${subjectId}/evaluations`,
    );
  }

  createEvaluation(
    subjectId: number,
    dto: CreateEvaluationDto,
  ): Observable<BaseResponseDto<EvaluationListResponse>> {
    return this.http.post<BaseResponseDto<EvaluationListResponse>>(
      `${this.apiUrl}/subjects/${subjectId}/evaluations`,
      dto,
    );
  }

  updateEvaluation(
    subjectId: number,
    evaluationId: number,
    dto: UpdateEvaluationDto,
  ): Observable<BaseResponseDto<EvaluationListResponse>> {
    return this.http.patch<BaseResponseDto<EvaluationListResponse>>(
      `${this.apiUrl}/subjects/${subjectId}/evaluations/${evaluationId}`,
      dto,
    );
  }

  deleteEvaluation(
    subjectId: number,
    evaluationId: number,
  ): Observable<BaseResponseDto<EvaluationListResponse>> {
    return this.http.delete<BaseResponseDto<EvaluationListResponse>>(
      `${this.apiUrl}/subjects/${subjectId}/evaluations/${evaluationId}`,
    );
  }

  simulateGrade(
    subjectId: number,
    dto: SimulateGradeDto,
  ): Observable<BaseResponseDto<SimulationResult>> {
    return this.http.post<BaseResponseDto<SimulationResult>>(
      `${this.apiUrl}/subjects/${subjectId}/evaluations/simulate`,
      dto,
    );
  }

  // Reactive calculation executed in client in < 5 ms for real-time responsiveness (RNF09)
  calculateSummaryLocally(evaluations: Evaluation[]): GradeSummary {
    let totalWeight = 0;
    let currentContribution = 0;

    for (const ev of evaluations) {
      const weight = Number(ev.weight);
      const score = Number(ev.score);
      totalWeight += weight;
      currentContribution += (score * weight) / 100;
    }

    totalWeight = round2(totalWeight);
    currentContribution = round2(currentContribution);

    const remainingWeight = round2(100 - totalWeight);
    const weightExceeded = totalWeight > 100;

    const currentAverage =
      totalWeight > 0 ? round2((currentContribution * 100) / totalWeight) : 0;

    let requiredGrade: number | null = null;
    let isAttainable = true;

    if (evaluations.length === 0) {
      requiredGrade = PASSING_GRADE;
      isAttainable = true;
    } else if (currentContribution >= PASSING_GRADE) {
      requiredGrade = 0.0;
      isAttainable = true;
    } else if (remainingWeight <= 0) {
      requiredGrade = null;
      isAttainable = false;
    } else {
      const rawRequired =
        ((PASSING_GRADE - currentContribution) * 100) / remainingWeight;
      requiredGrade = round2(rawRequired);
      isAttainable = requiredGrade <= MAX_GRADE;
    }

    let status: ApprovalStatus = 'Sin calificaciones';

    if (evaluations.length > 0) {
      if (currentContribution >= PASSING_GRADE) {
        status = 'Aprobado';
      } else if (isAttainable && currentAverage >= PASSING_GRADE) {
        status = 'Aprobando';
      } else {
        status = 'En riesgo';
      }
    }

    const isPassing =
      evaluations.length > 0 &&
      (currentContribution >= PASSING_GRADE ||
        (currentAverage >= PASSING_GRADE && isAttainable));

    return {
      totalWeight,
      remainingWeight,
      currentContribution,
      currentAverage,
      requiredGrade,
      isPassing,
      isAttainable,
      status,
      weightExceeded,
      passingGrade: PASSING_GRADE,
      maxGrade: MAX_GRADE,
    };
  }

  simulateLocally(
    summary: GradeSummary,
    hypotheticalScore?: number | null,
    targetGrade: number = PASSING_GRADE,
  ): {
    requiredForTarget: number | null;
    isTargetAttainable: boolean;
    hypotheticalFinalGrade: number | null;
    hypotheticalStatus: ApprovalStatus | null;
  } {
    const target = round2(targetGrade);
    let requiredForTarget: number | null = null;
    let isTargetAttainable = false;

    if (summary.remainingWeight > 0) {
      if (summary.currentContribution >= target) {
        requiredForTarget = 0.0;
        isTargetAttainable = true;
      } else {
        const rawRequired =
          ((target - summary.currentContribution) * 100) /
          summary.remainingWeight;
        requiredForTarget = round2(rawRequired);
        isTargetAttainable = requiredForTarget <= MAX_GRADE;
      }
    }

    let hypotheticalFinalGrade: number | null = null;
    let hypotheticalStatus: ApprovalStatus | null = null;

    if (
      hypotheticalScore !== undefined &&
      hypotheticalScore !== null &&
      summary.remainingWeight > 0
    ) {
      const hyp = round2(hypotheticalScore);
      const simulatedContribution =
        summary.currentContribution + (hyp * summary.remainingWeight) / 100;
      hypotheticalFinalGrade = round2(simulatedContribution);
      hypotheticalStatus =
        hypotheticalFinalGrade >= PASSING_GRADE ? 'Aprobando' : 'En riesgo';
    }

    return {
      requiredForTarget,
      isTargetAttainable,
      hypotheticalFinalGrade,
      hypotheticalStatus,
    };
  }
}
