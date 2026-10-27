import { test, expect } from '@playwright/test';
import { setupMockAuth, mockApiRoute, takeArgosScreenshot } from './support/visual-helpers';
import { MOCK_ACADEMIC_LOAD, MOCK_SUBJECTS, MOCK_USER } from './support/mock-data';

test.describe('CU-05: Modales de Formulario, Diálogos y Menús Superpuestos', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAuth(page);

    await mockApiRoute(page, '**/users/profile', { data: MOCK_USER });
    await mockApiRoute(page, '**/assignments/upcoming', { data: [] });
    await mockApiRoute(page, '**/subjects', { data: MOCK_SUBJECTS });
    await mockApiRoute(page, '**/subjects/academic-load', { data: MOCK_ACADEMIC_LOAD.balanceada });
  });

  test('debe renderizar el modal de añadir asignatura con su backdrop y estructura limpia', async ({ page }) => {
    await page.goto('/subjects');

    const addBtn = page.locator('button:has-text("+ Add Subject")');
    await expect(addBtn).toBeVisible({ timeout: 15_000 });
    await addBtn.click();

    const modal = page.locator('app-add-subject-modal .modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h2')).toHaveText('Add New Subject');

    await takeArgosScreenshot(page, 'modal-add-subject-clean');
  });

  test('debe renderizar los mensajes de error de validación en tiempo real dentro del modal', async ({ page }) => {
    await page.goto('/subjects');

    const addBtn = page.locator('button:has-text("+ Add Subject")');
    await expect(addBtn).toBeVisible({ timeout: 15_000 });
    await addBtn.click();

    const nameInput = page.locator('input[formControlName="name"]');
    await expect(nameInput).toBeVisible();

    // Tocar y desenfocar los campos para activar los mensajes de validación
    await nameInput.focus();
    await nameInput.blur();

    const professorInput = page.locator('input[formControlName="professor"]');
    await professorInput.focus();
    await professorInput.blur();

    const creditsInput = page.locator('input[formControlName="credits"]');
    await creditsInput.focus();
    await creditsInput.blur();

    // Validar que los mensajes de error sean visibles
    const errors = page.locator('app-add-subject-modal mat-error');
    await expect(errors.first()).toBeVisible();

    await takeArgosScreenshot(page, 'modal-add-subject-errors');
  });

  test('debe renderizar el modal de nueva evaluación con la caja de cálculo y previsualización en vivo', async ({ page }) => {
    const subjectId = 10;
    await mockApiRoute(page, `**/subjects/${subjectId}`, { data: MOCK_SUBJECTS[0] });
    await mockApiRoute(page, `**/assignments/subject/${subjectId}`, { data: [] });
    await mockApiRoute(page, `**/subjects/${subjectId}/notes`, { data: [] });
    await mockApiRoute(page, `**/subjects/${subjectId}/evaluations`, {
      data: { evaluations: [], summary: null },
    });

    await page.goto(`/subjects/${subjectId}`);

    const newEvalBtn = page.locator('button:has-text("+ New Evaluation")');
    await expect(newEvalBtn).toBeVisible({ timeout: 15_000 });
    await newEvalBtn.click();

    const evalModal = page.locator('app-evaluation-modal mat-card.modal');
    await expect(evalModal).toBeVisible();
    await expect(evalModal.locator('.live-preview-box')).toBeVisible();

    await takeArgosScreenshot(page, 'modal-evaluation-live-preview');
  });
});
