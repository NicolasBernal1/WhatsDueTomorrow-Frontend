import { Duration, Task, Wait } from '@serenity-js/core';
import { isPresent } from '@serenity-js/assertions';
import { Click } from '@serenity-js/web';

import { WaitForNetworkIdle } from '../interactions/WaitForNetworkIdle';
import { Navbar } from '../ui/Navbar';
import { SchedulePage } from '../ui/SchedulePage';

export const GoToSchedule = {
  fromTheNavbar: () => Task.where(`#actor va al horario desde la barra de navegacion`,
    Click.on(Navbar.scheduleLink()),
    Wait.upTo(Duration.ofSeconds(20)).until(SchedulePage.dayHeaders().first(), isPresent()),
    WaitForNetworkIdle.toSettle(),
  ),
};
