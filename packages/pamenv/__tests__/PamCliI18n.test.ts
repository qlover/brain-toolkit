import { PamCliI18n } from '../src/i18n/PamCliI18n';
import { PAMENV_CLI_LOGIN_WAITING } from '../src/i18n/identifier/pamenv_cli';

describe('PamCliI18n', () => {
  it('loads dist/locales and translates by constant key', async () => {
    PamCliI18n.setLocale('zh');
    await PamCliI18n.ensureLoaded('zh');
    await PamCliI18n.ensureLoaded('en');
    expect(PamCliI18n.t(PAMENV_CLI_LOGIN_WAITING)).toContain('授权');
    PamCliI18n.setLocale('en');
    expect(PamCliI18n.t(PAMENV_CLI_LOGIN_WAITING)).toBe(
      'Waiting for authorization...'
    );
  });
});
