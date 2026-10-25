import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { ClassResponseDto } from '../../src/app/models/class-response.dto';
import { ScheduleComponent } from '../../src/app/pages/schedule/schedule.component';

const calculo = { id: 1, name: 'Cálculo', professor: 'Gómez', color: '#3f51b5', credits: 3 };
const fisica = { id: 2, name: 'Física', professor: 'Pérez', color: '#009688', credits: 4 };
const clase = (id: number, materia: typeof calculo, dia: string, inicio: string, fin: string): ClassResponseDto =>
  ({ id, dayOfWeek: dia, startTime: `${inicio}:00`, endTime: `${fin}:00`, subject: materia });
const miercoles1030 = () => new Date(2026, 9, 21, 10, 30).getTime();

const montar = (clases: ClassResponseDto[] = []) => {
  cy.intercept('GET', '**/subjects/classes', { statusCode: 200, body: { status: 200, message: 'OK', data: clases } }).as('classes');
  cy.intercept('DELETE', '**/subjects/classes/*', { statusCode: 200, body: { status: 200, message: 'Class deleted successfully' } }).as('deleteClass');
  cy.mount(ScheduleComponent, {
    providers: [provideNoopAnimations(), provideHttpClient(), provideRouter([{ path: 'subjects/:id', children: [] }])],
  }).as('montado');
  cy.wait('@classes');
  return cy.get<{ component: ScheduleComponent; fixture: any }>('@montado')
    .then(({ component, fixture }) => ({ component, router: fixture.debugElement.injector.get(Router) as Router }));
};

describe('Schedule aislado: ver horario y clase en curso', () => {
  it('pide las clases una sola vez y pinta los siete días', () => {
    montar([clase(1, calculo, 'monday', '08:00', '09:00')]);
    cy.get('@classes.all').should('have.length', 1);
    cy.get('[data-cy=day-header]').should('have.length', 7);
    cy.get('[data-cy=class-card]').should('have.length', 1);
  });
  it('getClassesFor usa el rango [inicio, fin)', () => {
    montar([clase(1, calculo, 'monday', '08:00', '10:00')]).then(({ component }) => {
      expect(component.getClassesFor('monday', '09:00')?.id).to.eq(1);
      expect(component.getClassesFor('monday', '10:00')).to.eq(undefined);
      expect(component.getClassesFor('tuesday', '08:00')).to.eq(undefined);
    });
  });
  it('ignora un día desconocido sin lanzar excepción', () => {
    montar([clase(1, calculo, 'funday', '08:00', '09:00')]).then(({ component }) => {
      expect(() => component.getClassesFor('monday', '08:00')).not.to.throw();
    });
    cy.get('[data-cy=class-card]').should('not.exist');
  });
  it('avisa con una alerta cuando la API falla', () => {
    cy.window().then((win) => cy.stub(win, 'alert').as('alerta'));
    cy.intercept('GET', '**/subjects/classes', { statusCode: 500, body: { message: 'Internal server error' } }).as('error');
    cy.mount(ScheduleComponent, { providers: [provideNoopAnimations(), provideHttpClient(), provideRouter([])] });
    cy.wait('@error');
    cy.get('@alerta').should('have.been.calledWith', 'Error getting classes');
  });
  it('isCurrentClass respeta inicio inclusivo y fin exclusivo', () => {
    cy.clock(miercoles1030(), ['Date']);
    montar().then(({ component }) => {
      expect(component.isCurrentClass(clase(1, calculo, 'wednesday', '10:00', '11:00'))).to.eq(true);
      expect(component.isCurrentClass(clase(2, calculo, 'wednesday', '10:30', '11:30'))).to.eq(true);
      expect(component.isCurrentClass(clase(3, calculo, 'wednesday', '09:00', '10:30'))).to.eq(false);
      expect(component.isCurrentClass(clase(4, calculo, 'monday', '10:00', '11:00'))).to.eq(false);
    });
  });
  it('muestra la insignia Now solo en la clase en curso', () => {
    cy.clock(miercoles1030(), ['Date']);
    montar([clase(1, calculo, 'wednesday', '10:00', '11:00'), clase(2, fisica, 'wednesday', '14:00', '15:00')]);
    cy.get('[data-cy=now-badge]').should('have.length', 1);
  });
});

describe('Schedule aislado: próxima clase', () => {
  beforeEach(() => cy.clock(miercoles1030(), ['Date']));
  it('muestra el aviso cuando no hay clases', () => {
    montar().then(({ component }) => expect(component.getNextClass()).to.eq(null));
    cy.get('[data-cy=next-class-empty]').should('have.text', 'You do not have more classes.');
  });
  it('elige la más temprana de hoy que aún no empieza', () => {
    montar([clase(1, fisica, 'wednesday', '16:00', '17:00'), clase(2, calculo, 'wednesday', '12:00', '13:00')])
      .then(({ component }) => expect(component.getNextClass()?.id).to.eq(2));
  });
  it('no toma como próxima la clase en curso ni la que empieza ahora', () => {
    montar([clase(1, calculo, 'wednesday', '09:00', '11:00'), clase(2, fisica, 'wednesday', '10:30', '11:30'), clase(3, fisica, 'thursday', '08:00', '09:00')])
      .then(({ component }) => expect(component.getNextClass()?.id).to.eq(3));
  });
  it('vuelve a la primera de la semana siguiente cuando no quedan clases', () => {
    montar([clase(1, calculo, 'monday', '08:00', '09:00')]).then(({ component }) => expect(component.getNextClass()?.id).to.eq(1));
  });
  it('getNextClassDayLabel devuelve Today, Tomorrow o el nombre del día', () => {
    montar().then(({ component }) => {
      expect(component.getNextClassDayLabel(clase(1, calculo, 'wednesday', '14:00', '15:00'))).to.eq('Today');
      expect(component.getNextClassDayLabel(clase(2, calculo, 'thursday', '14:00', '15:00'))).to.eq('Tomorrow');
      expect(component.getNextClassDayLabel(clase(3, calculo, 'saturday', '14:00', '15:00'))).to.eq('Saturday');
    });
  });
  it('ignora una clase con día inválido', () => {
    montar([clase(1, calculo, 'funday', '14:00', '15:00')]).then(({ component }) => expect(component.getNextClass()).to.eq(null));
  });
  it('Details navega a /subjects/:id de la próxima clase', () => {
    montar([clase(1, fisica, 'thursday', '08:00', '09:00')]).then(({ router }) => {
      cy.get('[data-cy=next-class-details]').click();
      cy.wrap(router).its('url').should('eq', '/subjects/2');
    });
  });
  it('resuelve la próxima clase en menos de 100 ms con 5000 clases', () => {
    const muchas = Array.from({ length: 5000 }, (_, i) => clase(i + 1, calculo, 'tuesday', '06:00', '07:00'));
    montar(muchas).then(({ component }) => {
      const inicio = performance.now();
      component.getNextClass();
      expect(performance.now() - inicio).to.be.lessThan(100);
    });
  });
});

describe('Schedule aislado: navegar, eliminar y editar', () => {
  it('hacer clic en una clase navega al id de SU asignatura', () => {
    montar([clase(1, calculo, 'monday', '08:00', '09:00'), clase(2, fisica, 'tuesday', '10:00', '11:00')]).then(({ router }) => {
      cy.contains('[data-cy=class-card]', 'Física').click();
      cy.wrap(router).its('url').should('eq', '/subjects/2');
    });
  });
  it('elimina con confirmación: DELETE al id exacto y quita solo esa clase', () => {
    cy.window().then((win) => cy.stub(win, 'confirm').returns(true).as('confirmar'));
    montar([clase(7, calculo, 'monday', '08:00', '09:00'), clase(8, fisica, 'tuesday', '10:00', '11:00')]).then(({ component }) => {
      component.selectedClass = component.classes[0];
      component.deleteClass();
      cy.wait('@deleteClass').its('request.url').should('match', /\/subjects\/classes\/7$/);
      cy.wrap(component).its('classes').should('have.length', 1);
      cy.wrap(component).its('classes.0.id').should('eq', 8);
    });
    cy.get('@confirmar').should('have.been.calledWith', 'Delete Class?');
  });
  it('sin confirmación no llama a la API', () => {
    cy.window().then((win) => cy.stub(win, 'confirm').returns(false));
    montar([clase(7, calculo, 'monday', '08:00', '09:00')]).then(({ component }) => {
      component.selectedClass = component.classes[0];
      component.deleteClass();
    });
    cy.get('@deleteClass.all').should('have.length', 0);
    cy.get('[data-cy=class-card]').should('have.length', 1);
  });
  it('el clic derecho abre el menú con Edit y Delete', () => {
    montar([clase(7, calculo, 'monday', '08:00', '09:00')]);
    cy.get('[data-cy=class-card]').trigger('contextmenu', { clientX: 300, clientY: 300 });
    cy.get('[data-cy=menu-edit]').should('have.text', 'Edit');
    cy.get('[data-cy=menu-delete]').should('have.text', 'Delete');
  });
  it('Edit abre el modal de edición con el scroll bloqueado y Cancel lo restaura', () => {
    montar([clase(7, calculo, 'monday', '08:00', '09:00')]);
    cy.get('[data-cy=class-card]').trigger('contextmenu', { clientX: 300, clientY: 300 });
    cy.get('[data-cy=menu-edit]').click();
    cy.get('[data-cy=class-modal-title]').should('have.text', 'Edit Class Schedule');
    cy.get('body').should('have.css', 'overflow', 'hidden');
    cy.get('[data-cy=class-cancel]').click();
    cy.get('[data-cy=class-modal]').should('not.exist');
    cy.get('body').should('not.have.css', 'overflow', 'hidden');
  });
});
