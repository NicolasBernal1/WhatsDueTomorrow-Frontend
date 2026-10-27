export function run(main: () => Promise<void>): void {
  main().catch((error: unknown) => {
    console.error('❌ La prueba con Stagehand falló:', error);
    process.exitCode = 1;
  });
}
