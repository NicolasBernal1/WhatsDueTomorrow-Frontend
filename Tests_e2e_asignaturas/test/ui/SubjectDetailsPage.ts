import { By, PageElement } from '@serenity-js/web';

export const SubjectDetailsPage = {
  title: () => PageElement.located(By.css('mat-card.subject-header mat-card-title')).describedAs('nombre de la asignatura'),
  professor: () => PageElement.located(By.css('mat-card.subject-header mat-card-subtitle')).describedAs('profesor de la asignatura'),
  addClassButton: () => PageElement.located(By.xpath('//button[contains(normalize-space(.),"+ Add Class")]')).describedAs('boton + Add Class'),
};
