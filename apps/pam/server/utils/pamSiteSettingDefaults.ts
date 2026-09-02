import type {
  PamSiteSettingDefinition,
  PamSiteSettingPrimitive
} from '@config/pamSiteSettings';
import { PAM_SITE_SETTING_DEFINITIONS } from '@config/pamSiteSettings';
import type { PamSiteSettingUpsertInput } from '@server/repositorys/SiteSettingsRepo';

export function resolvePamSiteSettingDefaultValue(
  definition: PamSiteSettingDefinition
): PamSiteSettingPrimitive {
  if (definition.defaultValue !== undefined) {
    return definition.defaultValue;
  }
  if (definition.isSensitive) {
    return '';
  }
  return '';
}

export function buildPamSiteSettingSeedRows(): PamSiteSettingUpsertInput[] {
  return PAM_SITE_SETTING_DEFINITIONS.map((definition) => ({
    key: definition.key,
    value: resolvePamSiteSettingDefaultValue(definition),
    description: definition.description,
    isSensitive: definition.isSensitive
  }));
}
