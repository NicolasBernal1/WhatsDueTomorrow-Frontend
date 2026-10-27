import { BACKEND_BASE_URL } from './config.js';
import type { UserContext } from './auth-helper.js';

export interface TestFixtures {
  subjectId: number;
  subjectName: string;
  assignmentId: number;
  assignmentTitle: string;
}

export async function ensureTestFixtures(context: UserContext): Promise<TestFixtures> {
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${context.token}`,
  };

  let subjectId = 0;
  const subjectName = 'Validación de Software Stagehand';

  // 1. Obtener o crear asignatura
  try {
    const listRes = await fetch(`${BACKEND_BASE_URL}/subjects`, { headers: authHeaders });
    const listData = await listRes.json();
    if (listData.data && listData.data.length > 0) {
      subjectId = listData.data[0].id;
    } else {
      await fetch(`${BACKEND_BASE_URL}/subjects`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ name: subjectName, professor: 'Profesor Stagehand', credits: 4 }),
      });
      // El backend retorna null en data al crear, consultamos la lista para obtener el ID asignado
      const refreshedListRes = await fetch(`${BACKEND_BASE_URL}/subjects`, { headers: authHeaders });
      const refreshedListData = await refreshedListRes.json();
      if (refreshedListData.data && refreshedListData.data.length > 0) {
        subjectId = refreshedListData.data[refreshedListData.data.length - 1].id;
      }
    }
  } catch (err) {
    console.warn(`⚠️ [Fixtures] Error al gestionar asignatura: ${(err as Error).message}`);
  }

  // 2. Obtener o crear entrega
  let assignmentId = 0;
  const assignmentTitle = 'Taller E2E con Stagehand';
  try {
    const assignListRes = await fetch(`${BACKEND_BASE_URL}/assignments/subject/${subjectId}`, {
      headers: authHeaders,
    });
    const assignListData = await assignListRes.json();
    if (assignListData.data && assignListData.data.length > 0) {
      assignmentId = assignListData.data[0].id;
    } else {
      // Vence en 12 horas (dentro de las próximas 24h para radar urgente)
      const dueDate = new Date(Date.now() + 12 * 3600 * 1000).toISOString();
      await fetch(`${BACKEND_BASE_URL}/assignments/subject/${subjectId}`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          title: assignmentTitle,
          description: 'Entrega para verificación de avance porcentual y radar de urgencias',
          dueDate,
        }),
      });
      // Consultar la entrega creada para obtener su ID real
      const refreshedAssignRes = await fetch(`${BACKEND_BASE_URL}/assignments/subject/${subjectId}`, {
        headers: authHeaders,
      });
      const refreshedAssignData = await refreshedAssignRes.json();
      if (refreshedAssignData.data && refreshedAssignData.data.length > 0) {
        assignmentId = refreshedAssignData.data[refreshedAssignData.data.length - 1].id;
      }
    }
  } catch (err) {
    console.warn(`⚠️ [Fixtures] Error al gestionar entrega: ${(err as Error).message}`);
  }

  const fixtures = { subjectId, subjectName, assignmentId, assignmentTitle };
  console.log(`📦 [Fixtures] Datos de prueba listos: Asignatura #${subjectId}, Entrega #${assignmentId}`);
  return fixtures;
}
