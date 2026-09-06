export interface AddAssignmentDto {
  title: string;
  description?: string;
  dueDate: string;
  reminderMinutes?: number | null;
}
