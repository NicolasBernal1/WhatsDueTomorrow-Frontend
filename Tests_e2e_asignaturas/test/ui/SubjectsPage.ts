import { By, PageElement, PageElements } from '@serenity-js/web';

export const SubjectsPage = {
  heading: () => PageElement.located(By.css('.subjects-container h2')).describedAs('titulo Your Subjects'),
  searchBox: () => PageElement.located(By.id('subject-search')).describedAs('buscador de asignaturas'),
  addSubjectButton: () => PageElement.located(By.xpath('//button[contains(normalize-space(.),"+ Add Subject")]')).describedAs('boton + Add Subject'),
  emptyMessage: () => PageElement.located(By.css('.subjects-container p.empty')).describedAs('mensaje de lista vacia'),
  cards: () => PageElements.located(By.css('mat-card.subject-card')).describedAs('tarjetas de asignaturas'),
  cardNames: () => PageElements.located(By.css('mat-card.subject-card h3')).describedAs('nombres de las asignaturas'),

  cardXPath: (subjectName: string) =>
    `//mat-card[contains(@class,"subject-card")][.//h3[normalize-space(.)="${ subjectName }"]]`,

  cardOf: (subjectName: string) => PageElement.located(
    By.xpath(SubjectsPage.cardXPath(subjectName)),
  ).describedAs(`tarjeta de la asignatura "${ subjectName }"`),
  professorOf: (subjectName: string) => PageElement.located(
    By.xpath(`${ SubjectsPage.cardXPath(subjectName) }//p`),
  ).describedAs(`profesor de "${ subjectName }"`),
  creditsOf: (subjectName: string) => PageElement.located(
    By.xpath(`${ SubjectsPage.cardXPath(subjectName) }//span[contains(@class,"credit-badge")]`),
  ).describedAs(`creditos de "${ subjectName }"`),

  contextMenuEdit: () => PageElement.located(By.xpath('//div[contains(@class,"context-menu")]//button[normalize-space(.)="Edit"]')).describedAs('opcion Edit del menu'),
  contextMenuDelete: () => PageElement.located(By.xpath('//div[contains(@class,"context-menu")]//button[normalize-space(.)="Delete"]')).describedAs('opcion Delete del menu'),
};
