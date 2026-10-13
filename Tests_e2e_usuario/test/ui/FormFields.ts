import { By, PageElement } from '@serenity-js/web';

export type Campo = 'nombre' | 'correo' | 'contraseña';

const LABELS: Record<Campo, string> = {
  nombre: 'Name',
  correo: 'Email',
  contraseña: 'Password',
};

export const FormFields = {
  field: (campo: Campo) =>
    PageElement.located(By.xpath(`//mat-card//mat-form-field[.//mat-label[normalize-space(.)="${ LABELS[campo] }"]]//input`))
      .describedAs(`campo ${ campo }`),
  title: () => PageElement.located(By.css('mat-card h2.title')).describedAs('titulo del formulario'),
  submit: () => PageElement.located(By.css('mat-card button[type="submit"]')).describedAs('boton de envio'),
  error: () => PageElement.located(By.css('mat-card mat-error')).describedAs('mensaje de error del formulario'),
};