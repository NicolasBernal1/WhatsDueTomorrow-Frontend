export const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export type Weekday = typeof WEEKDAYS[number];

export function weekdayFromToday(offsetDays: number): Weekday {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return WEEKDAYS[(date.getDay() + 6) % 7];
}

export const optionLabel = (weekday: Weekday) => weekday.charAt(0).toUpperCase() + weekday.slice(1);
