# Guía Operativa de Revisión y Aprobación de Regresiones Visuales con Argos CI

**Proyecto:** Whats Due Tomorrow (Frontend)  
**Plataforma de Regresión Visual:** [Argos CI](https://argos-ci.com) + [Playwright Test](https://playwright.dev)  
**Destinatarios:** Desarrolladores, Líderes de QA, Diseñadores de UI/UX y Revisores de Código (Code Reviewers).

---

## 1. Ciclo de Vida de un Cambio Visual

Cada vez que se modifica código de maquetación, estilos SCSS o componentes de Angular en [`WhatsDueTomorrow-Frontend`](file:///home/dsanabriag/Universidad/VyV/proyecto-aula/repositorios/WhatsDueTomorrow-Frontend), el sistema de aseguramiento visual opera bajo el siguiente flujo:

```
[Desarrollador]                    [GitHub Actions / Jenkins]                  [Argos CI]
       │                                       │                                   │
       ├── 1. Código modificado / Rama PR ────►│                                   │
       │                                       ├── 2. Ejecuta 'npm run test:visual'│
       │                                       │      (Captura 17 vistas clave)    │
       │                                       │                                   │
       │                                       ├── 3. Sube capturas a Argos ──────►│
       │                                       │                                   ├── 4. Compara contra
       │                                       │                                   │      Baseline de 'main'
       │                                       │◄── 5. Notifica Status Check ──────┤
       │                                       │      (Aprobado o Acción Requerida)│
       │◄── 6. Revisa diff en Dashboard ───────┴───────────────────────────────────┤
       │                                                                           │
       ├── 7. Decisión: ¿Defecto o Cambio Intencional?                             │
       │      • Si es Defecto: Corrige código y empuja nuevo commit                │
       │      • Si es Intencional: Aprueba en Dashboard ──────────────────────────►│
       │                                                                           │
       ├── 8. Merge a 'main' ─────────────────────────────────────────────────────►│
       │                                                                           └── 9. Actualiza Baseline oficial
```

---

## 2. Interpretación de Estados en el Pull Request de GitHub

Al abrir un Pull Request hacia la rama `main`, el status check de Argos reportará uno de los siguientes estados:

| Estado en GitHub | Significado | Acción Requerida |
| :--- | :--- | :--- |
| **🟢 `argos/visual-testing — Approved`** | Las capturas son idénticas a la línea base o las diferencias ya fueron aprobadas. | El Pull Request está habilitado para merge (sujeto a las demás verificaciones). |
| **🟡 `argos/visual-testing — Review required`** | Se detectaron discrepancias en uno o más casos de uso respecto a la línea base. | **El botón de Merge queda bloqueado.** Hacer clic en el enlace **"Details"** para auditar los cambios en Argos CI. |
| **🔴 `argos/visual-testing — Build failed`** | Ocurrió un error en la ejecución de la suite Playwright o fallo en la carga de imágenes. | Inspeccionar los logs de GitHub Actions o Jenkins. |

---

## 3. Protocolo de Inspección en el Dashboard de Argos CI

Al acceder al dashboard interactivo de Argos a través del enlace del PR, el revisor dispone de 3 modalidades de inspección visual:

1. **Modo Superposición de Diferencias (*Diff Overlay*):**
   * Destaca en color magenta/rojo fluorescente los píxeles modificados o desplazados.
   * Permite identificar saltos de margen (*padding/margin*), desbordamientos de fuentes o colores incorrectos.
2. **Modo Dividido (*Side-by-Side*):**
   * Presenta a la izquierda la captura de referencia (*Baseline actual en `main`*) y a la derecha la captura de la rama (*Branch build*).
3. **Modo Deslizador Interactivo (*Swipe / Slider*):**
   * Permite desplazar una barra divisoria interactiva sobre la misma coordenada de pantalla para contrastar microalineaciones.

---

## 4. Toma de Decisiones y Gobernanza

### Escenario A: El cambio visual es un DEFECTO (Regresión No Deseada)
* **Causa común:** Una regla CSS global afectó accidentalmente los modales, el espaciado de la grilla horaria o el semáforo.
* **Acción:**
  1. En el dashboard de Argos, marcar la captura como rechazada o dejar el comentario en el PR de GitHub.
  2. El desarrollador reproduce el defecto localmente:
     ```bash
     npm run test:visual:headed
     ```
  3. Corregir los estilos en SCSS/HTML y subir un nuevo commit al PR.
  4. GitHub Actions reejecuta la suite y refresca el estado en Argos automáticamente.

### Escenario B: El cambio visual es INTENCIONAL (Evolución de Diseño Aprobada)
* **Causa común:** Se rediseñó el banner de notas, se cambió el tema de color o se añadió un nuevo campo a un modal.
* **Acción:**
  1. El revisor autorizado hace clic en el botón verde **"Approve changes"** en el panel superior derecho de Argos.
  2. El check en el Pull Request de GitHub pasa inmediatamente a estado verde (`Approved`).
  3. Se realiza el merge a `main`.
  4. Al consolidarse en `main`, **Argos promueve automáticamente las nuevas capturas como la nueva Línea Base inmutable** para futuros desarrollos.

---

## 5. Comandos de Referencia Rápida para Desarrolladores

```bash
# 1. Ejecución de la suite visual en modo headless (segundo plano)
npm run test:visual

# 2. Ejecución interactiva con navegador Chromium visible
npm run test:visual:headed

# 3. Inspección inteligente y Análisis de Causa Raíz (RCA) con Agente de IA
npm run test:visual:ai-inspect

# 4. Verificación de conectividad con el servidor MCP de Argos CI
npm run test:visual:mcp-check

# 5. Subida manual de capturas locales a Argos CI
npm run test:visual:upload

# 6. Inspección de capturas físicas locales generadas
ls -la screenshots/
```

---

## 6. Agente de IA para Inspección Visual Autónoma y Protocolo MCP

Siguiendo la directriz del curso de Validación y Verificación: **"Comparación determinista con integración para que agentes de IA inspeccionen diferencias (ir a lo seguro)"**, la inteligencia artificial se implementa como un agente auditor de segundo nivel y no como juez directo del píxel.

### 6.1. Filosofía de "Ir a lo Seguro"
1. **La IA NO compara píxeles a ojo ciego:** Delegar la comparación visual directa a modelos generativos de lenguaje introduce no-determinismo, latencia y alucinaciones (falsos positivos o falsos negativos).
2. **Determinismo Absoluto en Fase 1:** Playwright y Argos CI calculan la diferencia exacta de píxeles mediante algoritmos matemáticos deterministas. Si la diferencia es 0%, la prueba pasa de forma instantánea y confiable.
3. **Agente de IA como Diagnosticador Experto en Fase 2:** Cuando el motor determinista detecta una discrepancia (>0% de píxeles mutados), el **Agente Inspector de IA** interviene automáticamente para:
   * Extraer las coordenadas exactas de la alteración (*Bounding Box*: `minX, minY, maxX, maxY`).
   * Mapear la región gráfica al componente Angular responsable (ej. `ScheduleComponent`, `LoginComponent`, `UrgentRadarComponent`).
   * Inspeccionar las hojas de estilo SCSS y plantillas HTML del componente para identificar la causa raíz (*Root Cause Analysis - RCA*).
   * Clasificar la severidad del impacto: `CRITICAL` (UI rota, texto solapado, desbordamiento), `MODERATE` (desfase de espaciado o color), o `COSMETIC` (antialiasing o variación de 1px).
   * Emitir un veredicto estructurado (`APPROVE` si es un rediseño legítimo vs `REJECT_REGRESSION_DETECTED` si es un defecto no deseado) y sugerir el parche correctivo de código.

### 6.2. Integración con el Servidor MCP de Argos CI (`https://mcp.argos-ci.com/`)
Argos CI cuenta con un servidor oficial bajo el estándar abierto **Model Context Protocol (MCP)** para dotar a agentes de IA (como Antigravity, Cursor, Claude Code, Windsurf) de herramientas interactivas:

* **Herramientas MCP Clave:**
  * `listBuildDiffs`: Obtiene las discrepancias visuales de un build con URLs de imágenes y métricas de flakiness.
  * `createReview`: Envía revisiones automáticas (`APPROVE` o `REJECT`) con el reporte RCA adjunto.
  * `createBuildComment`: Publica comentarios técnicos anclados a builds.
  * `getAccount` / `listProjects`: Monitorea el consumo del plan y cuotas de capturas.

* **Tipos de Token en Argos CI:**
  * **Personal Access Token (PAT) (`arp_...`):** Credencial a nivel de usuario utilizada para la autenticación en el servidor MCP y las APIs de revisión/inspección de agentes de IA. Se configura en `.env.visual` como `ARGOS_PAT`.
  * **Project Token (`...`):** Token específico del proyecto generado en la web de Argos para autorizar la subida de capturas (`argos upload`). Se configura en `.env.visual` y en secrets de CI/CD como `ARGOS_TOKEN`.

### 6.3. Reportes Generados
Cada ejecución del agente (`npm run test:visual:ai-inspect`) genera dos entregables en [`test-results-visual/`](file:///home/dsanabriag/Universidad/VyV/proyecto-aula/repositorios/WhatsDueTomorrow-Frontend/test-results-visual):
* `ai-inspection-report.md`: Reporte ejecutivo en Markdown con formato GitHub Flavored Markdown, tablas de severidad, diagnóstico técnico y parches SCSS recomendados.
* `ai-inspection-report.json`: Archivo de telemetría con métricas de área mutada, coordenadas de caja delimitadora y veredictos para compuertas automáticas en pipelines.

