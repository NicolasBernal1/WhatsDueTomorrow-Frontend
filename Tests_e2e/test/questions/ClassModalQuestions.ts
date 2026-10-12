import { Text } from '@serenity-js/web';

import { ClassModal } from '../ui/ClassModal';

export const ClassModalQuestions = {
  title: () => Text.of(ClassModal.title()),
  errors: () => Text.ofAll(ClassModal.errors()),
};
