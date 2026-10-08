/**
 * Brain OAuth admin — site settings page identifiers (`admin_settings` namespace).
 * Runtime settings stored in the database (CORS rules, …).
 */

/**
 * @description Brain OAuth admin settings — document title
 * @localZh 站点设置
 * @localEn Settings
 */
export const ADMIN_SETTINGS_TITLE = 'admin_settings:title';

/**
 * @description Brain OAuth admin settings — page description
 * @localZh 运行时参数，优先于 .env，保存后立即生效
 * @localEn Runtime settings. They override .env and apply immediately.
 */
export const ADMIN_SETTINGS_DESCRIPTION = 'admin_settings:description';

/**
 * @description Brain OAuth admin settings — SEO keywords
 * @localZh 站点设置, 配置, CORS
 * @localEn site settings, config, CORS
 */
export const ADMIN_SETTINGS_KEYWORDS = 'admin_settings:keywords';

/**
 * @description Brain OAuth admin settings — CORS card title
 * @localZh API 与 CORS
 * @localEn API & CORS
 */
export const ADMIN_SETTINGS_SECTION_API = 'admin_settings:section__api';

/**
 * @description Brain OAuth admin settings — CORS card description
 * @localZh 允许浏览器跨域调用 /oauth/token、/oauth/userinfo、/oauth/revoke 与登出接口的来源。每条规则由来源 Origin、API 路径、HTTP 方法组成，都可以用 * 表示任意；路径支持 /oauth/*。没有规则时使用环境变量 API_CORS_ALLOWED_ORIGINS。
 * @localEn Origins allowed to call /oauth/token, /oauth/userinfo, /oauth/revoke and sign-out from the browser. Each rule has an origin, an API path and HTTP methods; any of them can be *. Paths support /oauth/*. Without rules, API_CORS_ALLOWED_ORIGINS is used.
 */
export const ADMIN_SETTINGS_SECTION_API_DESC =
  'admin_settings:section__api_desc';

/**
 * @description Brain OAuth admin settings — save button
 * @localZh 保存
 * @localEn Save
 */
export const ADMIN_SETTINGS_SAVE = 'admin_settings:save';

/**
 * @description Brain OAuth admin settings — load error
 * @localZh 加载设置失败
 * @localEn Failed to load settings
 */
export const ADMIN_SETTINGS_LOAD_FAILED = 'admin_settings:load__failed';

/**
 * @description Brain OAuth admin settings — save error
 * @localZh 保存失败
 * @localEn Failed to save
 */
export const ADMIN_SETTINGS_SAVE_FAILED = 'admin_settings:save__failed';

/**
 * @description Brain OAuth admin settings — save toast
 * @localZh 已保存
 * @localEn Saved
 */
export const ADMIN_SETTINGS_SAVE_SUCCESS = 'admin_settings:save__success';

/**
 * @description Brain OAuth admin settings — rules come from the database
 * @localZh 来源：数据库
 * @localEn Source: database
 */
export const ADMIN_SETTINGS_SOURCE_DB = 'admin_settings:source__db';

/**
 * @description Brain OAuth admin settings — rules come from defaults
 * @localZh 来源：默认
 * @localEn Source: default
 */
export const ADMIN_SETTINGS_SOURCE_DEFAULT = 'admin_settings:source__default';

/**
 * @description Brain OAuth admin settings — rules label
 * @localZh CORS 规则
 * @localEn CORS rules
 */
export const ADMIN_SETTINGS_CORS_RULES = 'admin_settings:cors__rules';

/**
 * @description Brain OAuth admin settings — rule field: origin
 * @localZh 来源 Origin
 * @localEn Origin
 */
export const ADMIN_SETTINGS_CORS_ORIGIN = 'admin_settings:cors__origin';

/**
 * @description Brain OAuth admin settings — rule field: path
 * @localZh API 路径
 * @localEn API path
 */
export const ADMIN_SETTINGS_CORS_PATH = 'admin_settings:cors__path';

/**
 * @description Brain OAuth admin settings — rule field: methods
 * @localZh 方法
 * @localEn Methods
 */
export const ADMIN_SETTINGS_CORS_METHODS = 'admin_settings:cors__methods';

/**
 * @description Brain OAuth admin settings — placeholder when * is selected
 * @localZh 任意
 * @localEn Any
 */
export const ADMIN_SETTINGS_CORS_ANY = 'admin_settings:cors__any';

/**
 * @description Brain OAuth admin settings — add rule button
 * @localZh 添加规则
 * @localEn Add rule
 */
export const ADMIN_SETTINGS_CORS_ADD = 'admin_settings:cors__add';

/**
 * @description Brain OAuth admin settings — remove rule button
 * @localZh 删除
 * @localEn Remove
 */
export const ADMIN_SETTINGS_CORS_REMOVE = 'admin_settings:cors__remove';

/**
 * @description Brain OAuth admin settings — no rules
 * @localZh 还没有规则，点击下方「添加规则」
 * @localEn No rules yet. Use "Add rule" below.
 */
export const ADMIN_SETTINGS_CORS_EMPTY = 'admin_settings:cors__empty';

/**
 * @description Brain OAuth admin settings — invalid origin
 * @localZh 来源 Origin 必须是 * 或有效的 http(s) 地址（不含路径），例如 https://spa.example.com
 * @localEn Origin must be * or a valid http(s) origin without a path, e.g. https://spa.example.com
 */
export const ADMIN_SETTINGS_CORS_ORIGIN_INVALID =
  'admin_settings:cors__origin_invalid';

/**
 * @description Brain OAuth admin settings — invalid path
 * @localZh API 路径必须以 / 开头，或选择 *
 * @localEn API path must start with / or be *
 */
export const ADMIN_SETTINGS_CORS_PATH_INVALID =
  'admin_settings:cors__path_invalid';

/**
 * @description Brain OAuth admin settings — no method selected
 * @localZh 至少选择一个方法
 * @localEn Pick at least one method
 */
export const ADMIN_SETTINGS_CORS_METHODS_EMPTY =
  'admin_settings:cors__methods_empty';

/**
 * @description Brain OAuth admin settings — duplicate rule
 * @localZh 与其他规则重复（来源、路径、方法都相同）
 * @localEn Duplicates another rule (same origin, path and methods)
 */
export const ADMIN_SETTINGS_CORS_DUPLICATE = 'admin_settings:cors__duplicate';

/**
 * @description Brain OAuth admin settings — save blocked by invalid rules
 * @localZh 请先修正标红的规则
 * @localEn Fix the rules marked in red first
 */
export const ADMIN_SETTINGS_CORS_FIX_ERRORS = 'admin_settings:cors__fix_errors';

/**
 * @description Brain OAuth admin settings — Brain API card title
 * @localZh Brain API
 * @localEn Brain API
 */
export const ADMIN_SETTINGS_SECTION_BRAIN = 'admin_settings:section__brain';

/**
 * @description Brain OAuth admin settings — Brain API card description
 * @localZh 登录、短信验证码、用户信息与 access token 换取请求的 Brain API 地址。只会保存与默认值不同的项，保存后约 1 分钟内对所有实例生效。
 * @localEn Brain API addresses for sign-in, SMS codes, user info and access token exchange. Only values that differ from the defaults are saved; changes reach all instances within about a minute.
 */
export const ADMIN_SETTINGS_SECTION_BRAIN_DESC =
  'admin_settings:section__brain_desc';

/**
 * @description Brain OAuth admin settings — current Brain env select
 * @localZh 当前环境
 * @localEn Current environment
 */
export const ADMIN_SETTINGS_BRAIN_ENV = 'admin_settings:brain__env';

/**
 * @description Brain OAuth admin settings — env address list title
 * @localZh 环境地址
 * @localEn Environment addresses
 */
export const ADMIN_SETTINGS_BRAIN_DOMAINS = 'admin_settings:brain__domains';

/**
 * @description Brain OAuth admin settings — env name field
 * @localZh 环境名
 * @localEn Environment name
 */
export const ADMIN_SETTINGS_BRAIN_DOMAIN_NAME =
  'admin_settings:brain__domain_name';

/**
 * @description Brain OAuth admin settings — env API URL field
 * @localZh API 地址
 * @localEn API URL
 */
export const ADMIN_SETTINGS_BRAIN_DOMAIN_URL =
  'admin_settings:brain__domain_url';

/**
 * @description Brain OAuth admin settings — add env button
 * @localZh 添加环境
 * @localEn Add environment
 */
export const ADMIN_SETTINGS_BRAIN_DOMAIN_ADD =
  'admin_settings:brain__domain_add';

/**
 * @description Brain OAuth admin settings — remove env button
 * @localZh 删除
 * @localEn Remove
 */
export const ADMIN_SETTINGS_BRAIN_DOMAIN_REMOVE =
  'admin_settings:brain__domain_remove';

/**
 * @description Brain OAuth admin settings — built-in env tag
 * @localZh 内置
 * @localEn Built-in
 */
export const ADMIN_SETTINGS_BRAIN_PRESET = 'admin_settings:brain__preset';

/**
 * @description Brain OAuth admin settings — access token URL field
 * @localZh Access token 地址
 * @localEn Access token URL
 */
export const ADMIN_SETTINGS_BRAIN_USERLY = 'admin_settings:brain__userly';

/**
 * @description Brain OAuth admin settings — access token URL help
 * @localZh 只对当前环境生效；留空则与当前环境的 API 地址相同
 * @localEn Applies to the current environment only; leave empty to use its API URL
 */
export const ADMIN_SETTINGS_BRAIN_USERLY_HELP =
  'admin_settings:brain__userly_help';

/**
 * @description Brain OAuth admin settings — endpoints section title
 * @localZh 接口路径（高级）
 * @localEn Endpoint paths (advanced)
 */
export const ADMIN_SETTINGS_BRAIN_ENDPOINTS = 'admin_settings:brain__endpoints';

/**
 * @description Brain OAuth admin settings — endpoints section description
 * @localZh 一般无需修改。路径会拼接在 API 地址之后。
 * @localEn Usually left as is. Paths are appended to the API URL.
 */
export const ADMIN_SETTINGS_BRAIN_ENDPOINTS_DESC =
  'admin_settings:brain__endpoints_desc';

/**
 * @description Brain OAuth admin settings — value differs from default
 * @localZh 已修改
 * @localEn Modified
 */
export const ADMIN_SETTINGS_BRAIN_MODIFIED = 'admin_settings:brain__modified';

/**
 * @description Brain OAuth admin settings — reset one value
 * @localZh 恢复默认
 * @localEn Reset
 */
export const ADMIN_SETTINGS_BRAIN_RESET = 'admin_settings:brain__reset';

/**
 * @description Brain OAuth admin settings — reset whole Brain API config
 * @localZh 全部恢复默认
 * @localEn Reset all
 */
export const ADMIN_SETTINGS_BRAIN_RESET_ALL = 'admin_settings:brain__reset_all';

/**
 * @description Brain OAuth admin settings — invalid URL
 * @localZh 请填写以 http:// 或 https:// 开头的地址
 * @localEn Enter a URL starting with http:// or https://
 */
export const ADMIN_SETTINGS_BRAIN_URL_INVALID =
  'admin_settings:brain__url_invalid';

/**
 * @description Brain OAuth admin settings — invalid env name
 * @localZh 环境名不能为空，也不能重复
 * @localEn Environment name is required and must be unique
 */
export const ADMIN_SETTINGS_BRAIN_NAME_INVALID =
  'admin_settings:brain__name_invalid';

/**
 * @description Brain OAuth admin settings — invalid endpoint path
 * @localZh 路径需以 / 开头，且不能包含空格
 * @localEn Path must start with / and contain no spaces
 */
export const ADMIN_SETTINGS_BRAIN_PATH_INVALID =
  'admin_settings:brain__path_invalid';

/**
 * @description Brain OAuth admin settings — save blocked by invalid fields
 * @localZh 请先修正标红的项
 * @localEn Fix the fields marked in red first
 */
export const ADMIN_SETTINGS_BRAIN_CONFIG_INVALID =
  'admin_settings:brain__config_invalid';

/**
 * @description Brain OAuth admin settings — effective API URL
 * @localZh 生效的 API 地址
 * @localEn Effective API URL
 */
export const ADMIN_SETTINGS_BRAIN_EFFECTIVE = 'admin_settings:brain__effective';

/**
 * @description Brain OAuth admin settings — effective access token URL
 * @localZh 生效的 access token 地址
 * @localEn Effective access token URL
 */
export const ADMIN_SETTINGS_BRAIN_USERLY_EFFECTIVE =
  'admin_settings:brain__userly_effective';
