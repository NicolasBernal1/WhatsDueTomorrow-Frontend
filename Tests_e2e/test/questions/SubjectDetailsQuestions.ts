import { Text } from '@serenity-js/web';

import { SubjectDetailsPage } from '../ui/SubjectDetailsPage';

export const SubjectDetailsQuestions = {
  title: () => Text.of(SubjectDetailsPage.title()),
  professor: () => Text.of(SubjectDetailsPage.professor()),
};
