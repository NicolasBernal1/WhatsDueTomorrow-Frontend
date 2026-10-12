import { defineParameterType } from '@cucumber/cucumber';
import { actorCalled, actorInTheSpotlight } from '@serenity-js/core';

import { toWeekday, Weekday } from '../../test/support/weekdays';

defineParameterType({
  name: 'actor',
  regexp: /[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/,
  transformer: (name: string) => actorCalled(name),
});

defineParameterType({
  name: 'pronoun',
  regexp: /el|ella|ellos|ellas/,
  transformer: () => actorInTheSpotlight(),
});

defineParameterType({
  name: 'dia',
  regexp: /(?:el )?(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo)|hoy|mañana|pasado mañana/,
  transformer: (expression: string): Weekday => toWeekday(expression.replace(/^el /, '')),
});

defineParameterType({
  name: 'hora',
  regexp: /\d{2}:\d{2}/,
  transformer: (time: string) => time,
});
