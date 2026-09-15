export interface Subtask {
  id: number;
  title: string;
  completed: boolean;
  position: number;
}

export interface SubtaskListResponse {
  subtasks: Subtask[];
  progress: number;
}
