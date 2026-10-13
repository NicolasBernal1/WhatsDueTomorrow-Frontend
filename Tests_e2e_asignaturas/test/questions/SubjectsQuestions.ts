import { Attribute, Text } from '@serenity-js/web';

import { SubjectDetailsPage } from '../ui/SubjectDetailsPage';
import { SubjectModal } from '../ui/SubjectModal';
import { SubjectsPage } from '../ui/SubjectsPage';

export const SubjectsQuestions = {
  names: () => Text.ofAll(SubjectsPage.cardNames()),
  professorOf: (subject: string) => Text.of(SubjectsPage.professorOf(subject)),
  creditsOf: (subject: string) => Text.of(SubjectsPage.creditsOf(subject)),
  emptyMessage: () => Text.of(SubjectsPage.emptyMessage()),
};

export const SubjectModalQuestions = {
  nameValue: () => Attribute.called('value').of(SubjectModal.name()),
  professorValue: () => Attribute.called('value').of(SubjectModal.professor()),
  creditsValue: () => Attribute.called('value').of(SubjectModal.credits()),
  errors: () => Text.ofAll(SubjectModal.errors()),
  title: () => Text.of(SubjectModal.title()),
};

export const SubjectDetailsQuestions = {
  title: () => Text.of(SubjectDetailsPage.title()),
  professor: () => Text.of(SubjectDetailsPage.professor()),
};
