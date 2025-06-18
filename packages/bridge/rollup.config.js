import { createBaseRollup } from '../../make/createBaseRollup.js';

export default createBaseRollup({
  input: 'src/index.ts',
  formats: [
    {
      format: 'umd',
      ext: 'umd.js',
      name: 'brainBridge'
    }
  ],
  clean: false,
  excludeDependencies: true,
  isProduction: false
});
