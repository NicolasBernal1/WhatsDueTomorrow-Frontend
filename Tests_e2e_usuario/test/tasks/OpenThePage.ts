import { Task } from '@serenity-js/core';
import { Navigate } from '@serenity-js/web';

import { environment } from '../support/environment';

export const OpenThePage = {
  at: (path: string) =>
    Task.where(`#actor abre la ruta ${ path }`, Navigate.to(`${ environment.baseUrl }${ path }`)),
};