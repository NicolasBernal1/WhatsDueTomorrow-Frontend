// Support file for Cypress in Frontend
import './commands';
import 'cypress-axe';
import { slowCypressDown } from 'cypress-slow-down';

// Ralentiza la ejecución de cada comando para que el flujo sea visible en Chrome
slowCypressDown();
