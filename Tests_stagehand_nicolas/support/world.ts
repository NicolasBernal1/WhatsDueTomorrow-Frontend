import { Page, Stagehand } from '@browserbasehq/stagehand';

import { Student } from './api';
import { launchStagehand } from './stagehand';

export interface World {
  stagehand: Stagehand;
  page: Page;
  student: Student;
  close(): Promise<void>;
}

export async function openWorld(studentName = 'Alicia'): Promise<World> {
  const student = await Student.register(studentName);
  const stagehand = await launchStagehand();

  return {
    stagehand,
    page: stagehand.page,
    student,
    close: async () => {
      await student.cleanUp().catch(() => undefined);
      await stagehand.close().catch(() => undefined);
    },
  };
}
