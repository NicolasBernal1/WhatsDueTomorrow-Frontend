import { Assignment } from "./assignment.model";
import { SubjectClass } from "./subject-class.model";
import { User } from "./user.model";

export interface Subject {
  id: number;
  name: string;
  professor: string;
  color: string;
  user: User;
  assignments: Assignment[];
  subjectClasses: SubjectClass[];
}