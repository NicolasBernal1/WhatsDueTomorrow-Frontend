import { By, PageElement } from '@serenity-js/web';

export const LoginPage = {
  title: () => PageElement.located(By.css('mat-card.login-card h2.title')).describedAs('titulo Log In'),
  email: () => PageElement.located(By.css('mat-card.login-card input[type="email"]')).describedAs('campo de correo'),
  password: () => PageElement.located(By.css('mat-card.login-card input[type="password"]')).describedAs('campo de contraseña'),
  submit: () => PageElement.located(By.css('mat-card.login-card button[type="submit"]')).describedAs('boton Log In'),
  registerLink: () => PageElement.located(By.css('mat-card.login-card a[href="/register"]')).describedAs('enlace Register now!'),
  error: () => PageElement.located(By.css('mat-card.login-card mat-error')).describedAs('mensaje de error del formulario'),
};