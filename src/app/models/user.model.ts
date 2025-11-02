import { Assignment } from "./assignment.model";
import { SubjectClass } from "./subject-class.model";
import { Subject } from "./subject.model";

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  subjects: Subject[];
  assignments: Assignment[];
  subjectClasses: SubjectClass[];
}