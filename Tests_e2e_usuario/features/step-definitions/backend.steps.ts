import { DataTable, Given } from '@cucumber/cucumber';
import { Actor, actorInTheSpotlight, Interaction } from '@serenity-js/core';

import { SimulateTheBackend } from '../../test/interactions/SimulateTheBackend';
import { StoreTheSession } from '../../test/interactions/StoreTheSession';
import { simulationOf } from '../../test/support/backend';

const ANA = { id: 1, name: 'Ana', email: 'ana@test.com' };
const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 3_600_000).toISOString();

Given('{actor} usa la aplicación con un servidor simulado', async (actor: Actor) => {
  await actor.attemptsTo(
    Interaction.where(`#actor prepara el servidor simulado`, async a => { await simulationOf(a); }),
  );
});

Given('{actor} tiene una sesión iniciada', async (actor: Actor) => {
  await actor.attemptsTo(StoreTheSession.withToken('jwt-ana'));
});

Given('el servidor acepta el registro', async () => {
  await actorInTheSpotlight().attemptsTo(
    SimulateTheBackend.respondsTo('POST', '/auth/register').with(201, ANA),
    SimulateTheBackend.respondsTo('POST', '/auth/login').with(200, { token: 'jwt-ana', user: ANA }),
  );
});

Given('el servidor rechaza el registro con el código {int}', async (status: number) => {
  await actorInTheSpotlight().attemptsTo(SimulateTheBackend.respondsTo('POST', '/auth/register').with(status));
});

Given('el servidor acepta las credenciales', async () => {
  await actorInTheSpotlight().attemptsTo(
    SimulateTheBackend.respondsTo('POST', '/auth/login').with(200, { token: 'jwt-ana', user: ANA }),
  );
});

Given('el servidor rechaza las credenciales con el código {int}', async (status: number) => {
  await actorInTheSpotlight().attemptsTo(SimulateTheBackend.respondsTo('POST', '/auth/login').with(status));
});

Given('el servidor devuelve el perfil de {string} con correo {string}', async (name: string, email: string) => {
  await actorInTheSpotlight().attemptsTo(
    SimulateTheBackend.respondsTo('GET', '/users/profile').with(200, { id: 1, name, email }),
  );
});

Given('el servidor falla al devolver el perfil', async () => {
  await actorInTheSpotlight().attemptsTo(SimulateTheBackend.respondsTo('GET', '/users/profile').with(500));
});

Given('el servidor confirma la contraseña actual', async () => {
  await actorInTheSpotlight().attemptsTo(SimulateTheBackend.respondsTo('PATCH', '/auth/verify-password').with(200));
});

Given('el servidor rechaza la contraseña actual', async () => {
  await actorInTheSpotlight().attemptsTo(SimulateTheBackend.respondsTo('PATCH', '/auth/verify-password').with(401));
});

Given('el servidor acepta el cambio de contraseña', async () => {
  await actorInTheSpotlight().attemptsTo(SimulateTheBackend.respondsTo('PATCH', '/auth/change-password').with(200));
});

Given('el servidor rechaza el cambio de contraseña con el código {int}', async (status: number) => {
  await actorInTheSpotlight().attemptsTo(SimulateTheBackend.respondsTo('PATCH', '/auth/change-password').with(status));
});

Given('el servidor tiene estas tareas próximas a vencer:', async (table: DataTable) => {
  const tasks = table.hashes().map((row, index) => ({
    id: index + 1,
    title: row.titulo,
    description: '',
    dueDate: hoursFromNow(Number(row.horas)),
    subjectName: row.materia,
    subjectId: index + 1,
  }));
  await actorInTheSpotlight().attemptsTo(SimulateTheBackend.respondsTo('GET', '/assignments/upcoming').with(200, tasks));
});

Given('el servidor no tiene tareas próximas a vencer', async () => {
  await actorInTheSpotlight().attemptsTo(SimulateTheBackend.respondsTo('GET', '/assignments/upcoming').with(200, []));
});

Given('el servidor falla al listar las tareas próximas', async () => {
  await actorInTheSpotlight().attemptsTo(SimulateTheBackend.respondsTo('GET', '/assignments/upcoming').with(500));
});