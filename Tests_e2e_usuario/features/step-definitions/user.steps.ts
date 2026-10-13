import { Then, When } from '@cucumber/cucumber';
import { Actor, actorInTheSpotlight, Duration, Wait } from '@serenity-js/core';
import { Ensure, contain, equals, includes, not } from '@serenity-js/assertions';
import { By, Click, Enter, isEnabled, isVisible, PageElements, Text } from '@serenity-js/web';

import { LeaveTheField } from '../../test/interactions/LeaveTheField';
import { BackendQuestions } from '../../test/questions/BackendQuestions';
import { CurrentPath } from '../../test/questions/CurrentPath';
import { StoredToken } from '../../test/questions/StoredToken';
import { LogIn } from '../../test/tasks/LogIn';
import { OpenThePage } from '../../test/tasks/OpenThePage';
import { OpenTheNotifications } from '../../test/tasks/OpenTheNotifications';
import { ChangePassword, LogOut, OpenTheProfileMenu, VerifyCurrentPassword } from '../../test/tasks/ProfileTasks';
import { Register } from '../../test/tasks/Register';
import { Campo, FormFields } from '../../test/ui/FormFields';
import { LoginPage } from '../../test/ui/LoginPage';
import { Navbar } from '../../test/ui/Navbar';
import { ProfileMenu } from '../../test/ui/ProfileMenu';
import { Snackbar } from '../../test/ui/Snackbar';

const wait = Duration.ofSeconds(10);

// ---------------------------------------------------------------- acciones

When('{pronoun} se registra con nombre {string}, correo {string} y contraseña {string}',
  async (actor: Actor, name: string, email: string, password: string) => {
    await actor.attemptsTo(Register.withTheirData(name, email, password));
  });

When('{pronoun} inicia sesión con correo {string} y contraseña {string}',
  async (actor: Actor, email: string, password: string) => {
    await actor.attemptsTo(LogIn.with(email, password));
  });

When('{pronoun} abre la ruta {string}', async (actor: Actor, path: string) => {
  await actor.attemptsTo(OpenThePage.at(path));
});

When('{pronoun} escribe {string} en el campo {campo}', async (actor: Actor, value: string, campo: Campo) => {
  await actor.attemptsTo(Enter.theValue(value).into(FormFields.field(campo)));
});

When('{pronoun} sale del campo {campo}', async (actor: Actor, campo: Campo) => {
  await actor.attemptsTo(LeaveTheField.after(FormFields.field(campo), FormFields.title()));
});

When('{pronoun} pulsa el enlace para ir al registro', async (actor: Actor) => {
  await actor.attemptsTo(Click.on(LoginPage.registerLink()));
});

When('{pronoun} cierra sesión', async (actor: Actor) => {
  await actor.attemptsTo(LogOut.now());
});

When('{pronoun} abre el menú de perfil', async (actor: Actor) => {
  await actor.attemptsTo(OpenTheProfileMenu.now());
});

When('{pronoun} verifica su contraseña actual {string}', async (actor: Actor, password: string) => {
  await actor.attemptsTo(VerifyCurrentPassword.as(password));
});

When('{pronoun} cambia su contraseña de {string} a {string}', async (actor: Actor, current: string, next: string) => {
  await actor.attemptsTo(ChangePassword.from(current, next));
});

When('{pronoun} escribe la nueva contraseña {string}', async (actor: Actor, next: string) => {
  await actor.attemptsTo(Enter.theValue(next).into(ProfileMenu.newPassword()));
});

When('{pronoun} abre la campana de notificaciones', async (actor: Actor) => {
  await actor.attemptsTo(OpenTheNotifications.now());
});

// ------------------------------------------------------------ verificaciones

Then('{pronoun} llega a la ruta {string}', async (actor: Actor, path: string) => {
  await actor.attemptsTo(Wait.upTo(wait).until(CurrentPath.ofThePage(), equals(path)));
});

Then('{pronoun} sigue en la ruta {string}', async (actor: Actor, path: string) => {
  await actor.attemptsTo(Ensure.that(CurrentPath.ofThePage(), equals(path)));
});

Then('la sesión guardada es {string}', async (token: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.that(StoredToken.inTheBrowser(), equals(token)));
});

Then('no hay ninguna sesión guardada', async () => {
  await actorInTheSpotlight().attemptsTo(Ensure.that(StoredToken.inTheBrowser(), equals(null)));
});

Then('{pronoun} ve la alerta {string}', async (actor: Actor, message: string) => {
  await actor.attemptsTo(Wait.upTo(wait).until(BackendQuestions.alertsShown(), contain(message)));
});

Then('{pronoun} ve el aviso {string}', async (actor: Actor, message: string) => {
  await actor.attemptsTo(Wait.upTo(wait).until(Text.of(Snackbar.message()), includes(message)));
});

Then('{pronoun} ve el error de validación {string}', async (actor: Actor, message: string) => {
  await actor.attemptsTo(Wait.upTo(wait).until(Text.of(FormFields.error()), equals(message)));
});

Then('el botón de envío del formulario está bloqueado', async () => {
  await actorInTheSpotlight().attemptsTo(Ensure.that(FormFields.submit(), not(isEnabled())));
});

Then('el servidor recibió {int} peticiones {word} a {string}', async (count: number, method: string, path: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.that(BackendQuestions.requestsSent(method, path), equals(count)));
});

Then('el servidor recibió en {word} {string} el cuerpo {string}', async (method: string, path: string, json: string) => {
  await actorInTheSpotlight().attemptsTo(
    Ensure.that(BackendQuestions.lastBodySent(method, path), equals(JSON.parse(json))),
  );
});

Then('{pronoun} ve en el perfil el nombre {string} y el correo {string}', async (actor: Actor, name: string, email: string) => {
  await actor.attemptsTo(
    Wait.upTo(wait).until(Text.of(ProfileMenu.userName()), equals(name)),
    Ensure.that(Text.of(ProfileMenu.userEmail()), equals(email)),
  );
});

Then('{pronoun} no ve los datos del perfil', async (actor: Actor) => {
  await actor.attemptsTo(Ensure.that(ProfileMenu.userName(), not(isVisible())));
});

Then('{pronoun} ve el mensaje {string} en el menú de perfil', async (actor: Actor, message: string) => {
  const target = message === 'Incorrect password' ? ProfileMenu.incorrectMessage() : ProfileMenu.verifiedMessage();
  await actor.attemptsTo(Wait.upTo(wait).until(Text.of(target), includes(message === 'Incorrect password' ? message : 'Current password verified')));
});

Then('{pronoun} no puede escribir una nueva contraseña', async (actor: Actor) => {
  await actor.attemptsTo(Ensure.that(ProfileMenu.verifiedMessage(), not(isVisible())));
});

Then('{pronoun} ve el botón {string} bloqueado', async (actor: Actor, label: string) => {
  const button = label === 'Verify Password' ? ProfileMenu.verifyButton() : ProfileMenu.changeButton();
  await actor.attemptsTo(
    Wait.upTo(wait).until(Text.of(button), includes(label)),
    Ensure.that(button, not(isEnabled())),
  );
});

Then('{pronoun} ve el botón {string} habilitado', async (actor: Actor, label: string) => {
  const button = label === 'Verify Password' ? ProfileMenu.verifyButton() : ProfileMenu.changeButton();
  await actor.attemptsTo(Wait.upTo(wait).until(button, isEnabled()));
});

Then('{pronoun} ve {int} en la insignia de la campana', async (actor: Actor, count: number) => {
  await actor.attemptsTo(Wait.upTo(wait).until(Text.of(Navbar.badge()), equals(String(count))));
});

Then('{pronoun} no ve insignia en la campana', async (actor: Actor) => {
  await actor.attemptsTo(Ensure.that(Navbar.badge(), not(isVisible())));
});

Then('{pronoun} ve {int} tareas próximas en la lista', async (actor: Actor, count: number) => {
  await actor.attemptsTo(
    Wait.upTo(wait).until(Text.of(Navbar.upcomingTitle()), equals('Due soon')),
    Ensure.that(PageElements.located(By.css('.upcoming-item')).count(), equals(count)),
  );
});

Then('{pronoun} ve la tarea {int} con título {string} y materia {string}',
  async (actor: Actor, position: number, title: string, subject: string) => {
    const item = Navbar.upcomingItems().nth(position - 1);
    await actor.attemptsTo(
      Ensure.that(Text.of(item), includes(title)),
      Ensure.that(Text.of(item), includes(subject)),
    );
  });

Then('{pronoun} ve el mensaje de que no hay tareas próximas', async (actor: Actor) => {
  await actor.attemptsTo(Wait.upTo(wait).until(Text.of(Navbar.upcomingEmpty()), includes('Nothing due in the next 48 hours')));
});