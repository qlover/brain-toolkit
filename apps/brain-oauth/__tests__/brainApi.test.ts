import { describe, expect, it } from 'vitest';
import {
  BRAIN_API_DEFAULT_ENDPOINTS,
  brainApiFormToSettings,
  parseBrainApiSettings,
  resolveBrainApiEnv,
  resolveBrainApiTarget,
  settingsToBrainApiForm
} from '@config/brainApi';

const proxySettings = {
  domains: { proxy: 'https://xx.top' },
  userlyDomains: { proxy: 'https://xx.top/userly' },
  envEndpoints: { proxy: { login: 'POST /api/brain/login' } }
};

describe('brainApi per-env config', () => {
  it('merges env endpoints over the shared ones for that env only', () => {
    const { config } = resolveBrainApiTarget(proxySettings);

    const proxy = resolveBrainApiEnv(config, 'proxy');
    expect(proxy.baseURL).toBe('https://xx.top');
    expect(proxy.userlyBaseURL).toBe('https://xx.top/userly');
    expect(proxy.endpoints.login).toBe('POST /api/brain/login');
    expect(proxy.endpoints.getUserInfo).toBe(
      BRAIN_API_DEFAULT_ENDPOINTS.getUserInfo
    );

    const dev = resolveBrainApiEnv(config, 'development');
    expect(dev.endpoints.login).toBe(BRAIN_API_DEFAULT_ENDPOINTS.login);
    expect(dev.userlyBaseURL).toBe(dev.baseURL);
  });

  it('round-trips through the admin form', () => {
    const form = settingsToBrainApiForm(proxySettings);
    const row = form.domains.find((domain) => domain.name === 'proxy');
    expect(row).toMatchObject({
      userlyUrl: 'https://xx.top/userly',
      paths: { login: '/api/brain/login' }
    });

    const settings = brainApiFormToSettings(form);
    expect(settings).toEqual(proxySettings);
    expect(parseBrainApiSettings(JSON.stringify(settings)).success).toBe(true);
  });
});
