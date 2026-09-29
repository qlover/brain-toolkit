/**
 * Brain OAuth admin — site settings page identifiers (`admin_settings` namespace).
 */

/**
 * @description Brain OAuth admin — site settings page title
 * @localZh 站点设置
 * @localEn Site settings
 */
export const ADMIN_SETTINGS_TITLE = 'admin_settings:title';

/**
 * @description Brain OAuth admin — site settings page description
 * @localZh 管理运行时参数（优先于 .env，保存后立即生效）。
 * @localEn Manage runtime options (overrides .env; effective immediately).
 */
export const ADMIN_SETTINGS_DESCRIPTION = 'admin_settings:description';

/**
 * @description Brain OAuth admin — site settings page keywords
 * @localZh 站点设置,配置,CORS
 * @localEn site settings,config,CORS
 */
export const ADMIN_SETTINGS_KEYWORDS = 'admin_settings:keywords';

/**
 * @description Brain OAuth admin — site settings API & CORS section title
 * @localZh API 与 CORS
 * @localEn API & CORS
 */
export const ADMIN_SETTINGS_SECTION_API = 'admin_settings:section__api';

/**
 * @description Brain OAuth admin — site settings API & CORS section description
 * @localZh OAuth 机器端点（token / revoke / userinfo）与登出接口的跨域（CORS）规则：Origin × 路径 × 方法。未配置时回退到 API_CORS_ALLOWED_ORIGINS。
 * @localEn Cross-origin (CORS) rules for OAuth machine endpoints (token / revoke / userinfo) and logout: Origin × path × methods. Falls back to API_CORS_ALLOWED_ORIGINS when empty.
 */
export const ADMIN_SETTINGS_SECTION_API_DESC =
  'admin_settings:section__api_desc';

/**
 * @description Brain OAuth admin — site settings save button
 * @localZh 保存
 * @localEn Save
 */
export const ADMIN_SETTINGS_SAVE = 'admin_settings:save';

/**
 * @description Brain OAuth admin — site settings saving state
 * @localZh 保存中…
 * @localEn Saving…
 */
export const ADMIN_SETTINGS_SAVING = 'admin_settings:saving';

/**
 * @description Brain OAuth admin — site settings load failure
 * @localZh 加载设置失败
 * @localEn Failed to load settings
 */
export const ADMIN_SETTINGS_LOAD_FAILED = 'admin_settings:load__failed';

/**
 * @description Brain OAuth admin — site settings save failure
 * @localZh 保存失败
 * @localEn Failed to save
 */
export const ADMIN_SETTINGS_SAVE_FAILED = 'admin_settings:save__failed';

/**
 * @description Brain OAuth admin — site settings save success
 * @localZh 已保存
 * @localEn Saved
 */
export const ADMIN_SETTINGS_SAVE_SUCCESS = 'admin_settings:save__success';

/**
 * @description Brain OAuth admin — setting value source: database
 * @localZh 数据库
 * @localEn Database
 */
export const ADMIN_SETTINGS_SOURCE_DB = 'admin_settings:source__db';

/**
 * @description Brain OAuth admin — setting value source: default
 * @localZh 默认
 * @localEn Default
 */
export const ADMIN_SETTINGS_SOURCE_DEFAULT = 'admin_settings:source__default';

/**
 * @description Brain OAuth admin — CORS rule origin column
 * @localZh 来源 Origin
 * @localEn Origin
 */
export const ADMIN_SETTINGS_CORS_ORIGIN = 'admin_settings:cors__origin';

/**
 * @description Brain OAuth admin — CORS rule path column
 * @localZh API 路径
 * @localEn API path
 */
export const ADMIN_SETTINGS_CORS_PATH = 'admin_settings:cors__path';

/**
 * @description Brain OAuth admin — CORS rule methods column
 * @localZh HTTP 方法
 * @localEn HTTP methods
 */
export const ADMIN_SETTINGS_CORS_METHODS = 'admin_settings:cors__methods';

/**
 * @description Brain OAuth admin — add CORS rule button
 * @localZh 添加规则
 * @localEn Add rule
 */
export const ADMIN_SETTINGS_CORS_ADD = 'admin_settings:cors__add';

/**
 * @description Brain OAuth admin — remove CORS rule button
 * @localZh 删除
 * @localEn Remove
 */
export const ADMIN_SETTINGS_CORS_REMOVE = 'admin_settings:cors__remove';

/**
 * @description Brain OAuth admin — empty CORS rules hint
 * @localZh 暂无规则，点击下方添加一条（origin × path × methods）。
 * @localEn No rules yet. Add one below (origin × path × methods).
 */
export const ADMIN_SETTINGS_CORS_EMPTY = 'admin_settings:cors__empty';

/**
 * @description Brain OAuth admin — invalid CORS origin
 * @localZh Origin 须为 * 或有效的 http(s) 地址（不含路径），如 https://spa.example.com
 * @localEn Origin must be * or a valid http(s) origin without path, e.g. https://spa.example.com
 */
export const ADMIN_SETTINGS_CORS_ORIGIN_INVALID =
  'admin_settings:cors__origin_invalid';

/**
 * @description Brain OAuth admin — duplicate CORS rule
 * @localZh 存在重复规则（Origin + Path + Methods 完全相同）
 * @localEn Duplicate rule (same Origin + Path + Methods)
 */
export const ADMIN_SETTINGS_CORS_DUPLICATE = 'admin_settings:cors__duplicate';
