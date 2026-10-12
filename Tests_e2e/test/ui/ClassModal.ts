import { By, PageElement, PageElements } from '@serenity-js/web';

const dropdownLabelled = (label: string) => PageElement.located(
  By.xpath(`//mat-card[contains(@class,"modal")]//mat-form-field[.//mat-label[normalize-space(.)="${ label }"]]//mat-select`),
);

export const ClassModal = {
  title: () => PageElement.located(By.css('mat-card.modal h2')).describedAs('titulo del modal de clase'),

  dayDropdown: () => dropdownLabelled('Day').describedAs('selector de dia'),
  startTimeDropdown: () => dropdownLabelled('Start time').describedAs('selector de hora de inicio'),
  endTimeDropdown: () => dropdownLabelled('End time').describedAs('selector de hora de fin'),

  option: (label: string) => PageElement.located(
    By.xpath(`//div[contains(@class,"cdk-overlay-container")]//mat-option[normalize-space(.)="${ label }"]`),
  ).describedAs(`opcion "${ label }"`),

  saveButton: () => PageElement.located(By.css('mat-card.modal button[type="submit"]')).describedAs('boton Save del modal'),
  cancelButton: () => PageElement.located(By.xpath('//mat-card[contains(@class,"modal")]//button[normalize-space(.)="Cancel"]')).describedAs('boton Cancel del modal'),

  errors: () => PageElements.located(By.css('mat-card.modal mat-error')).describedAs('mensajes de error del modal'),
};
