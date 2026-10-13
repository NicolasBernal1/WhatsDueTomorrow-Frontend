import { Task } from '@serenity-js/core';
import { Click } from '@serenity-js/web';

import { Navbar } from '../ui/Navbar';

export const OpenTheNotifications = {
  now: () => Task.where(`#actor abre la campana de notificaciones`, Click.on(Navbar.bellButton())),
};