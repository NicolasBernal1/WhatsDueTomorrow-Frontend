import { By, PageElement } from '@serenity-js/web';

export const LoginPage = {
  email: () => PageElement.located(By.css('mat-card.login-card input[type="email"]')).describedAs('campo de correo'),
  password: () => PageElement.located(By.css('mat-card.login-card input[type="password"]')).describedAs('campo de contraseña'),
  submit: () => PageElement.located(By.css('mat-card.login-card button[type="submit"]')).describedAs('boton Log In'),
};
