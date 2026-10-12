import { By, PageElement } from '@serenity-js/web';

export const SubjectsPage = {
  cardOf: (subjectName: string) => PageElement.located(
    By.xpath(`//mat-card[contains(@class,"subject-card")][.//h3[normalize-space(.)="${ subjectName }"]]`),
  ).describedAs(`tarjeta de la asignatura "${ subjectName }"`),
};
