export interface Note {
  id: number;
  title: string;
  content: string;
  linkUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  subjectId?: number;
}

export interface CreateNoteDto {
  title: string;
  content: string;
  linkUrl?: string | null;
}

export interface UpdateNoteDto {
  title?: string;
  content?: string;
  linkUrl?: string | null;
}
