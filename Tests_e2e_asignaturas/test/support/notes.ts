import { notes } from '@serenity-js/core';

export interface E2ENotes {
  email: string;
  password: string;
  token: string;
  [key: string]: any;
}

export const e2eNotes = () => notes<E2ENotes>();

export const subjectKey = (subjectName: string) => `subject:${ subjectName }`;
