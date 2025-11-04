import { Subject } from "./subject.model";
import { User } from "./user.model";

export interface Assignment {
  id: number;
  title: string;
  description?: string;
  dueDate: string;
  user: User;
  subject: Subject;
}