import { Subject } from "./subject.model";
import { User } from "./user.model";

export interface SubjectClass {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subject: Subject;
  user: User;
}