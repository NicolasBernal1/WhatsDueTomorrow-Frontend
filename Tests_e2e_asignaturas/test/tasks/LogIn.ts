import { Duration, Task, Wait } from '@serenity-js/core';
import { equals } from '@serenity-js/assertions';
import { Click, Enter, Navigate } from '@serenity-js/web';

import { CurrentPath } from '../questions/CurrentPath';
import { environment } from '../support/environment';
import { e2eNotes } from '../support/notes';
import { LoginPage } from '../ui/LoginPage';

export const LogIn = {
  withTheirAccount: () => Task.where(`#actor inicia sesion en la aplicacion`,
    Navigate.to(`${ environment.baseUrl }/login`),
    Enter.theValue(e2eNotes().get('email')).into(LoginPage.email()),
    Enter.theValue(e2eNotes().get('password')).into(LoginPage.password()),
    Click.on(LoginPage.submit()),
    Wait.upTo(Duration.ofSeconds(20)).until(CurrentPath.ofThePage(), equals('/schedule')),
  ),
};
