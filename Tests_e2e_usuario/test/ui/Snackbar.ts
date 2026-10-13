import { By, PageElement } from '@serenity-js/web';

export const Snackbar = {
  message: () => PageElement.located(By.css('.mat-mdc-snack-bar-container')).describedAs('notificacion emergente'),
};