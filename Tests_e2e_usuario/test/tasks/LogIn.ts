import { Task } from '@serenity-js/core';
import { Click, Enter, Navigate } from '@serenity-js/web';

import { environment } from '../support/environment';
import { LoginPage } from '../ui/LoginPage';

export const LogIn = {
  with: (email: string, password: string) =>
    Task.where(`#actor inicia sesion con ${ email }`,
      Navigate.to(`${ environment.baseUrl }/login`),
      Enter.theValue(email).into(LoginPage.email()),
      Enter.theValue(password).into(LoginPage.password()),
      Click.on(LoginPage.submit()),
    ),
};