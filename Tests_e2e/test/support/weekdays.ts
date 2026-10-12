export const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export type Weekday = typeof WEEKDAYS[number];

const SPANISH_TO_WEEKDAY: Record<string, Weekday> = {
  'lunes': 'monday',
  'martes': 'tuesday',
  'miércoles': 'wednesday',
  'jueves': 'thursday',
  'viernes': 'friday',
  'sábado': 'saturday',
  'domingo': 'sunday',
};

function weekdayOffsetFromToday(offsetDays: number): Weekday {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return WEEKDAYS[(date.getDay() + 6) % 7];
}

export function toWeekday(expression: string): Weekday {
  const text = expression.trim().toLowerCase();
  if (text === 'hoy') return weekdayOffsetFromToday(0);
  if (text === 'mañana') return weekdayOffsetFromToday(1);
  if (text === 'pasado mañana') return weekdayOffsetFromToday(2);

  const weekday = SPANISH_TO_WEEKDAY[text];
  if (!weekday) throw new Error(`Día no reconocido: "${ expression }"`);
  return weekday;
}

export function toOptionLabel(weekday: Weekday): string {
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}
