export interface UpdateAssignmentDto {
  title?: string;
  description?: string;
  dueDate?: string;
  reminderMinutes?: number | null;
}
