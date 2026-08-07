import { PamCliApp } from './PamCliApp';

async function main(): Promise<void> {
  const app = new PamCliApp();
  try {
    await app.run(process.argv);
  } catch (error) {
    console.error(await app.formatCliError(error));
    process.exitCode = 1;
  }
}

void main();
