import { By, PageElement, PageElements } from '@serenity-js/web';

export const SchedulePage = {
  dayHeaders: () => PageElements.located(By.css('.schedule-grid .header')).describedAs('encabezados de dia del horario'),

  classNames: () => PageElements.located(By.css('.schedule-grid .class-card .class-name')).describedAs('nombres de las clases en el horario'),
  classTimes: () => PageElements.located(By.css('.schedule-grid .class-card .class-time')).describedAs('horas de las clases en el horario'),

  cardOf: (subjectName: string) => PageElement.located(
    By.xpath(`(//div[contains(@class,"class-card")][.//div[contains(@class,"class-name")][normalize-space(.)="${ subjectName }"]])[1]`),
  ).describedAs(`tarjeta de la clase "${ subjectName }" en el horario`),

  contextMenuOption: (label: 'Edit' | 'Delete') => PageElement.located(
    By.xpath(`//div[contains(@class,"context-menu")]//button[normalize-space(.)="${ label }"]`),
  ).describedAs(`opcion ${ label } del menu contextual`),

  nextClassSubject: () => PageElement.located(By.css('section.next-class .next-class-subject')).describedAs('asignatura de la proxima clase'),
  nextClassProfessor: () => PageElement.located(By.css('section.next-class .next-class-professor')).describedAs('profesor de la proxima clase'),
  nextClassTime: () => PageElement.located(By.css('section.next-class .next-class-time')).describedAs('dia y hora de la proxima clase'),
  nextClassEmptyMessage: () => PageElement.located(By.css('section.next-class .next-class-empty')).describedAs('mensaje sin proxima clase'),
  nextClassDetailsButton: () => PageElement.located(By.css('section.next-class .next-class-card button')).describedAs('boton Ver detalles de la proxima clase'),
};
