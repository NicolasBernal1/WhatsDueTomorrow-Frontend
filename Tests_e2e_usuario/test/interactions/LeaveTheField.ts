import { Task } from '@serenity-js/core';
import { Click } from '@serenity-js/web';

import { FormFields } from '../ui/FormFields';

export const LeaveTheField = {
  after: (field: ReturnType<typeof FormFields.field>, title: ReturnType<typeof FormFields.title>) =>
    Task.where(`#actor sale del campo`, Click.on(field), Click.on(title)),
};