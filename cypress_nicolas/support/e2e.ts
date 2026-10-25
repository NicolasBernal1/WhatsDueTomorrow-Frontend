import "./commands";
import "cypress-axe";
import { slowCypressDown } from "cypress-slow-down";

const delay = Number(Cypress.env("commandDelay") ?? 0);
if (delay > 0) slowCypressDown(delay);
