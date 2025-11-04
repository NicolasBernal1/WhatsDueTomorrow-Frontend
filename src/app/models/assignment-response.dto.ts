export interface AssignmentResponseDto {
  id: number;
  title: string;
  description?: string;
  dueDate: string;
  subjectId: number;
}