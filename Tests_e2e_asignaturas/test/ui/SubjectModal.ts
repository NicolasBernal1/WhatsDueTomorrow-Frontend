import { By, PageElement, PageElements } from '@serenity-js/web';

const MODAL = 'app-add-subject-modal';

export const SubjectModal = {
  modal: () => PageElement.located(By.css(MODAL)).describedAs('formulario de asignatura'),
  title: () => PageElement.located(By.css(`${ MODAL } h2`)).describedAs('titulo del formulario'),
  name: () => PageElement.located(By.css(`${ MODAL } input[formcontrolname="name"]`)).describedAs('campo nombre'),
  professor: () => PageElement.located(By.css(`${ MODAL } input[formcontrolname="professor"]`)).describedAs('campo profesor'),
  credits: () => PageElement.located(By.css(`${ MODAL } input[formcontrolname="credits"]`)).describedAs('campo creditos'),
  submit: () => PageElement.located(By.css(`${ MODAL } button[type="submit"]`)).describedAs('boton Save/Update'),
  cancel: () => PageElement.located(By.xpath(`//${ MODAL }//button[normalize-space(.)="Cancel"]`)).describedAs('boton Cancel'),
  errors: () => PageElements.located(By.css(`${ MODAL } mat-error`)).describedAs('mensajes de error del formulario'),
};
