import { containAtLeastOneItemThat, matches } from '@serenity-js/assertions';

export const hasTimeRange = (startTime: string, endTime: string) => new RegExp(`${ startTime }(:00)? - ${ endTime }(:00)?$`);

export const includeAClassScheduledFrom = (startTime: string, endTime: string) =>
  containAtLeastOneItemThat(matches(hasTimeRange(startTime, endTime)));
