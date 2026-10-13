import { Task } from '@serenity-js/core';
import { Click, Enter } from '@serenity-js/web';

import { SubjectModal } from '../ui/SubjectModal';

export interface SubjectData {
  name: string;
  professor: string;
  credits: number | string;
}

export const FillSubjectForm = {
  with: (data: SubjectData) => Task.where(`#actor llena el formulario con "${ data.name }", "${ data.professor }" y ${ data.credits } creditos`,
    Enter.theValue(data.name).into(SubjectModal.name()),
    Enter.theValue(data.professor).into(SubjectModal.professor()),
    Enter.theValue(String(data.credits)).into(SubjectModal.credits()),
    // Quita el foco del ultimo campo para que Angular muestre sus errores de validacion
    Click.on(SubjectModal.title()),
  ),

  replacingWith: (data: Partial<SubjectData>) => Task.where(`#actor reemplaza los datos del formulario`,
    ...(data.name !== undefined ? [Enter.theValue(data.name).into(SubjectModal.name())] : []),
    ...(data.professor !== undefined ? [Enter.theValue(data.professor).into(SubjectModal.professor())] : []),
    ...(data.credits !== undefined ? [Enter.theValue(String(data.credits)).into(SubjectModal.credits())] : []),
    Click.on(SubjectModal.title()),
  ),
};
