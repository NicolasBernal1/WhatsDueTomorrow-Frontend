import { AfterAll, BeforeAll, setDefaultTimeout } from '@cucumber/cucumber';
import { Cast, configure, TakeNotes } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';
import { CallAnApi } from '@serenity-js/rest';
import { Browser, chromium } from 'playwright';

import { environment } from '../../test/support/environment';

let browser: Browser;

setDefaultTimeout(120_000);

BeforeAll(async () => {
  browser = await chromium.launch({
    headless: environment.headless,
    executablePath: environment.chromePath,
  });

  configure({
    actors: Cast.where(actor => actor.whoCan(
      BrowseTheWebWithPlaywright.using(browser, undefined, {
        defaultNavigationTimeout: 30_000,
        defaultTimeout: 20_000,
      }),
      CallAnApi.at(environment.apiUrl),
      TakeNotes.usingAnEmptyNotepad(),
    )),
    crew: [
      '@serenity-js/console-reporter',
      ['@serenity-js/html-reporter', { specDirectory: './features' }],
    ],
  });
});

AfterAll(async () => {
  await browser?.close();
});
