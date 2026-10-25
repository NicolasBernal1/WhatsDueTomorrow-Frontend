import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { createOutputSpy } from 'cypress/angular';
import { AddClassModalComponent } from '../../src/app/components/add-class-modal/add-class-modal.component';
import { ClassResponseDto } from '../../src/app/models/class-response.dto';

const materia = { id: 1, name: 'Cálculo', professor: 'Gómez', color: '#3f51b5', credits: 3 };
const clase = (id: number, dia: string, inicio: string, fin: string): ClassResponseDto =>
  ({ id, dayOfWeek: dia, startTime: `${inicio}:00`, endTime: `${fin}:00`, subject: materia });
const ok = (data: unknown) => ({ statusCode: 200, body: { status: 200, message: 'OK', data } });

const montar = (existentes: ClassResponseDto[] = [], classToEdit: ClassResponseDto | null = null) => {
  cy.intercept('GET', '**/subjects/classes', ok(existentes)).as('classes');
  cy.intercept('POST', '**/subjects/classes', { statusCode: 201, body: { status: 201, message: 'Class created successfully' } }).as('addClass');
  cy.intercept('PATCH', '**/subjects/classes/*', { statusCode: 200, body: { status: 200, message: 'Class updated successfully' } }).as('editClass');
  cy.mount(AddClassModalComponent, {
    componentProperties: { subjectId: 1, classToEdit, save: createOutputSpy<void>('guardado'), close: createOutputSpy<void>('cerrado') },
    providers: [provideNoopAnimations(), provideHttpClient()],
  }).as('montado');
  cy.wait('@classes');
  return cy.get<{ component: AddClassModalComponent }>('@montado').then(({ component }) => component);
};
const formulario = (c: AddClassModalComponent, dia: string, inicio: string, fin: string) =>
  c.addClassForm.setValue({ dayOfWeek: dia, startTime: inicio, endTime: fin });

describe('AddClassModal aislado: agregar', () => {
  it('muestra el título y los valores por defecto', () => {
    montar().then((c) => expect(c.addClassForm.value).to.deep.equal({ dayOfWeek: 'monday', startTime: '06:00', endTime: '08:00' }));
    cy.get('[data-cy=class-modal-title]').should('have.text', 'Add Class Schedule');
  });
  it('rechaza una hora de fin que no es mayor que la de inicio', () => {
    montar().then((c) => formulario(c, 'tuesday', '15:00', '14:00'));
    cy.get('[data-cy=class-save]').click();
    cy.get('[data-cy=class-error]').should('contain.text', 'End time must be greater than start time.');
    cy.get('@addClass.all').should('have.length', 0);
  });
  it('rechaza una clase que se cruza con otra del mismo día', () => {
    montar([clase(1, 'monday', '09:00', '10:00')]).then((c) => formulario(c, 'monday', '08:00', '10:00'));
    cy.get('[data-cy=class-save]').click();
    cy.get('[data-cy=class-error]').should('contain.text', 'This class overlaps with another class in your schedule.');
    cy.get('@addClass.all').should('have.length', 0);
  });
  it('no considera cruce un día distinto ni una clase adyacente', () => {
    montar([clase(1, 'monday', '09:00', '10:00')]).then((c) => formulario(c, 'tuesday', '09:00', '10:00'));
    cy.get('[data-cy=class-save]').click();
    cy.wait('@addClass').its('response.statusCode').should('eq', 201);
  });
  it('envía el DTO correcto y emite save y close', () => {
    montar().then((c) => formulario(c, 'wednesday', '14:00', '16:00'));
    cy.get('[data-cy=class-save]').click();
    cy.wait('@addClass').its('request.body').should('deep.equal', { dayOfWeek: 'wednesday', startTime: '14:00', endTime: '16:00', subjectId: 1 });
    cy.get('@guardado').should('have.been.calledOnce');
    cy.get('@cerrado').should('have.been.calledOnce');
  });
  it('no emite save ni close cuando la API responde 500', () => {
    montar().then((c) => formulario(c, 'friday', '10:00', '11:00'));
    cy.intercept('POST', '**/subjects/classes', { statusCode: 500, body: { message: 'Internal server error' } }).as('addClassError');
    cy.get('[data-cy=class-save]').click();
    cy.wait('@addClassError');
    cy.get('@guardado').should('not.have.been.called');
    cy.get('@cerrado').should('not.have.been.called');
  });
  it('Cancel emite close sin llamar a la API', () => {
    montar();
    cy.get('[data-cy=class-cancel]').click();
    cy.get('@cerrado').should('have.been.calledOnce');
    cy.get('@addClass.all').should('have.length', 0);
  });
  it('detecta el cruce en menos de 100 ms con 5000 clases', () => {
    const muchas = Array.from({ length: 5000 }, (_, i) => clase(i + 1, 'sunday', '06:00', '07:00'));
    montar(muchas).then((c) => {
      formulario(c, 'monday', '10:00', '11:00');
      const inicio = performance.now();
      c.onSave();
      expect(performance.now() - inicio).to.be.lessThan(100);
    });
    cy.wait('@addClass');
  });
});

describe('AddClassModal aislado: editar', () => {
  const editar = clase(7, 'monday', '08:00', '09:00');
  it('muestra el título y precarga día y horas en HH:mm', () => {
    montar([editar], editar).then((c) => expect(c.addClassForm.value).to.deep.equal({ dayOfWeek: 'monday', startTime: '08:00', endTime: '09:00' }));
    cy.get('[data-cy=class-modal-title]').should('have.text', 'Edit Class Schedule');
  });
  it('guarda con PATCH al id de la clase y no con POST', () => {
    montar([editar], editar).then((c) => formulario(c, 'thursday', '14:00', '15:00'));
    cy.get('[data-cy=class-save]').click();
    cy.wait('@editClass').then(({ request }) => {
      expect(request.url).to.match(/\/subjects\/classes\/7$/);
      expect(request.body).to.deep.equal({ dayOfWeek: 'thursday', startTime: '14:00', endTime: '15:00' });
    });
    cy.get('@addClass.all').should('have.length', 0);
    cy.get('@guardado').should('have.been.calledOnce');
  });
  it('excluye a la propia clase del cruce al guardar sin cambios', () => {
    montar([editar], editar);
    cy.get('[data-cy=class-save]').click();
    cy.get('[data-cy=class-error]').should('not.exist');
    cy.wait('@editClass').its('response.statusCode').should('eq', 200);
  });
  it('rechaza el cruce con una clase distinta', () => {
    montar([editar, clase(8, 'tuesday', '10:00', '12:00')], editar).then((c) => formulario(c, 'tuesday', '11:00', '13:00'));
    cy.get('[data-cy=class-save]').click();
    cy.get('[data-cy=class-error]').should('contain.text', 'overlaps');
    cy.get('@editClass.all').should('have.length', 0);
  });
  it('rechaza una hora de fin menor o igual a la de inicio', () => {
    montar([editar], editar).then((c) => formulario(c, 'monday', '09:00', '08:00'));
    cy.get('[data-cy=class-save]').click();
    cy.get('[data-cy=class-error]').should('contain.text', 'End time must be greater');
    cy.get('@editClass.all').should('have.length', 0);
  });
});
