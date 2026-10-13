import { By, PageElement, PageElements } from '@serenity-js/web';

export const Navbar = {
  profileButton: () => PageElement.located(By.xpath('//mat-toolbar/button[contains(normalize-space(.), "Profile")]')).describedAs('boton Profile'),
  logOutItem: () => PageElement.located(By.xpath('//button[contains(@class, "mat-mdc-menu-item")][contains(normalize-space(.), "Log Out")]')).describedAs('opcion Log Out'),
  bellButton: () => PageElement.located(By.css('button[aria-label="Upcoming assignments"]')).describedAs('campana de notificaciones'),
  badge: () => PageElement.located(By.css('button[aria-label="Upcoming assignments"] .mat-badge-content')).describedAs('insignia de la campana'),
  upcomingTitle: () => PageElement.located(By.css('.upcoming-content h4')).describedAs('titulo Due soon'),
  upcomingItems: () => PageElements.located(By.css('.upcoming-item')).describedAs('tareas proximas'),
  upcomingEmpty: () => PageElement.located(By.css('.upcoming-content .empty-message')).describedAs('mensaje de lista vacia'),
};