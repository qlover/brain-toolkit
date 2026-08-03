import { PamCliApp } from './PamCliApp';

async function main(): Promise<void> {
  try {
    await new PamCliApp().run(process.argv);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  }
}

void main();
