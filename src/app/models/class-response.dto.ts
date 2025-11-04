import { SubjectResponseDto } from "./subject-response.dto";

export interface ClassResponseDto {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subject: SubjectResponseDto;
}