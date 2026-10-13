import { By, PageElement } from '@serenity-js/web';

export const Navbar = {
  scheduleLink: () => PageElement.located(By.xpath('//mat-toolbar//a[normalize-space(.)="Schedule"]')).describedAs('enlace Schedule de la barra'),
  subjectsLink: () => PageElement.located(By.xpath('//mat-toolbar//a[normalize-space(.)="Subjects"]')).describedAs('enlace Subjects de la barra'),
};
