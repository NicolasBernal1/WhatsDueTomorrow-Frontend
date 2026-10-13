import { Task } from '@serenity-js/core';
import { Click, Enter, Navigate } from '@serenity-js/web';

import { environment } from '../support/environment';
import { RegisterPage } from '../ui/RegisterPage';

export const Register = {
  withTheirData: (name: string, email: string, password: string) =>
    Task.where(`#actor se registra con ${ email }`,
      Navigate.to(`${ environment.baseUrl }/register`),
      Enter.theValue(name).into(RegisterPage.name()),
      Enter.theValue(email).into(RegisterPage.email()),
      Enter.theValue(password).into(RegisterPage.password()),
      Click.on(RegisterPage.submit()),
    ),
};