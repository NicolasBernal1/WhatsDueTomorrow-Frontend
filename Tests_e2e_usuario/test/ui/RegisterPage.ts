import { By, PageElement } from '@serenity-js/web';

export const RegisterPage = {
  title: () => PageElement.located(By.css('mat-card.register-card h2.title')).describedAs('titulo Register'),
  name: () => PageElement.located(By.css('mat-card.register-card input[type="text"]')).describedAs('campo de nombre'),
  email: () => PageElement.located(By.css('mat-card.register-card input[type="email"]')).describedAs('campo de correo'),
  password: () => PageElement.located(By.css('mat-card.register-card input[type="password"]')).describedAs('campo de contraseña'),
  submit: () => PageElement.located(By.css('mat-card.register-card button[type="submit"]')).describedAs('boton Register'),
  loginLink: () => PageElement.located(By.css('mat-card.register-card a[href="/login"]')).describedAs('enlace Log in'),
  error: () => PageElement.located(By.css('mat-card.register-card mat-error')).describedAs('mensaje de error del formulario'),
};