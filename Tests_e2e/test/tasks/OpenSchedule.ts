import { Duration, Task, Wait } from '@serenity-js/core';
import { isPresent } from '@serenity-js/assertions';
import { Navigate } from '@serenity-js/web';

import { WaitForNetworkIdle } from '../interactions/WaitForNetworkIdle';
import { environment } from '../support/environment';
import { SchedulePage } from '../ui/SchedulePage';

export const OpenSchedule = {
  afresh: () => Task.where(`#actor abre el horario`,
    Navigate.to(`${ environment.baseUrl }/schedule`),
    Wait.upTo(Duration.ofSeconds(20)).until(SchedulePage.dayHeaders().first(), isPresent()),
    WaitForNetworkIdle.toSettle(),
  ),
};
