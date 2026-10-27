import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';
import { AddSubjectModalComponent } from '../../src/app/components/add-subject-modal/add-subject-modal.component';


describe('AddSubjectModalComponent', () => {
  beforeEach(() => {
    cy.mount(AddSubjectModalComponent, {
      providers: [provideHttpClient(), provideAnimations()],
    });
  });

  it('muestra el título y el botón Guardar deshabilitado al inicio', () => {
    cy.contains('h2', 'Add New Subject');
    cy.get('button[type=submit]').should('be.disabled');
  });

  it('valida nombre/profesor sin letras y créditos fuera de rango', () => {
    cy.get('input[formcontrolname=name]').type('431251351').blur();
    cy.get('input[formcontrolname=professor]').type('14515').blur();
    cy.get('input[formcontrolname=credits]').clear().type('33145135').blur();
    cy.contains('Name must contain at least one letter');
    cy.contains('Professor must contain at least one letter');
    cy.contains(/Credits must be a whole number between 1 and 12|Los créditos deben ser un entero entre 1 y 12/);
    cy.get('button[type=submit]').should('be.disabled');
  });

  it('habilita Guardar con datos válidos', () => {
    cy.get('input[formcontrolname=name]').type('Ciencias');
    cy.get('input[formcontrolname=professor]').type('Marco');
    cy.get('input[formcontrolname=credits]').clear().type('4');
    cy.get('button[type=submit]').should('not.be.disabled');
  });

  it('ofrece 6 colores seleccionables', () => {
    cy.get('[class*="color"]').should('have.length.at.least', 6);
  });
});
