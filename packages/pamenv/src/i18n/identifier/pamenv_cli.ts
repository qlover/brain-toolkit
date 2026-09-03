/**
 * pamenv CLI UX i18n identifiers (consumed by ts2locales).
 *
 * Significance: Typed keys for interactive CLI copy.
 * Core idea: JSDoc @localZh/@localEn → dist/locales via Ts2Locales.
 * Main purpose: Avoid stringly-typed PamCliI18n.t keys.
 */

/**
 * @description 使用配置: {{path}}
 * @localZh 使用配置: {{path}}
 * @localEn Using config: {{path}}
 */
export const PAMENV_CLI_USING_CONFIG = 'pamenv_cli:using_config';

/**
 * @description PAM 地址
 * @localZh PAM 地址
 * @localEn PAM base URL
 */
export const PAMENV_CLI_PROMPT_BASE_URL = 'pamenv_cli:prompt_base_url';

/**
 * @description 邮箱
 * @localZh 邮箱
 * @localEn Email
 */
export const PAMENV_CLI_PROMPT_EMAIL = 'pamenv_cli:prompt_email';

/**
 * @description 密码
 * @localZh 密码
 * @localEn Password
 */
export const PAMENV_CLI_PROMPT_PASSWORD = 'pamenv_cli:prompt_password';

/**
 * @description 邮箱和密码不能为空
 * @localZh 邮箱和密码不能为空
 * @localEn Email and password are required
 */
export const PAMENV_CLI_EMAIL_PASSWORD_REQUIRED = 'pamenv_cli:email_password_required';

/**
 * @description 请在浏览器打开以下链接以授权 pamenv：
 * @localZh 请在浏览器打开以下链接以授权 pamenv：
 * @localEn Open the URL below in your browser to authorize pamenv:
 */
export const PAMENV_CLI_LOGIN_OPEN_BROWSER = 'pamenv_cli:login_open_browser';

/**
 * @description 用户码: {{code}}
 * @localZh 用户码: {{code}}
 * @localEn User code: {{code}}
 */
export const PAMENV_CLI_LOGIN_USER_CODE = 'pamenv_cli:login_user_code';

/**
 * @description 等待授权中...
 * @localZh 等待授权中...
 * @localEn Waiting for authorization...
 */
export const PAMENV_CLI_LOGIN_WAITING = 'pamenv_cli:login_waiting';

/**
 * @description （无法自动打开浏览器 — 请手动打开上方链接。）
 * @localZh （无法自动打开浏览器 — 请手动打开上方链接。）
 * @localEn (Could not open browser automatically — open the URL manually.)
 */
export const PAMENV_CLI_LOGIN_BROWSER_OPEN_FAILED = 'pamenv_cli:login_browser_open_failed';

/**
 * @description 浏览器中拒绝了授权
 * @localZh 浏览器中拒绝了授权
 * @localEn Authorization denied in browser
 */
export const PAMENV_CLI_LOGIN_DENIED = 'pamenv_cli:login_denied';

/**
 * @description 设备码已过期。请重新运行 `pamenv login`。
 * @localZh 设备码已过期。请重新运行 `pamenv login`。
 * @localEn Device code expired. Run `pamenv login` again.
 */
export const PAMENV_CLI_LOGIN_EXPIRED = 'pamenv_cli:login_expired';

/**
 * @description 等待浏览器授权超时
 * @localZh 等待浏览器授权超时
 * @localEn Timed out waiting for browser authorization
 */
export const PAMENV_CLI_LOGIN_TIMEOUT = 'pamenv_cli:login_timeout';

/**
 * @description 已登录为 {{email}}
 * @localZh 已登录为 {{email}}
 * @localEn Logged in as {{email}}
 */
export const PAMENV_CLI_LOGIN_SUCCESS = 'pamenv_cli:login_success';

/**
 * @description 令牌过期时间 {{expiresAt}}
 * @localZh 令牌过期时间 {{expiresAt}}
 * @localEn Token expires at {{expiresAt}}
 */
export const PAMENV_CLI_LOGIN_EXPIRES = 'pamenv_cli:login_expires';

/**
 * @description 配置已保存到 {{path}}
 * @localZh 配置已保存到 {{path}}
 * @localEn Config saved to {{path}}
 */
export const PAMENV_CLI_LOGIN_CONFIG_SAVED = 'pamenv_cli:login_config_saved';

/**
 * @description 已从浏览器同步语言: {{locale}}
 * @localZh 已从浏览器同步语言: {{locale}}
 * @localEn Locale set from browser: {{locale}}
 */
export const PAMENV_CLI_LOGIN_LOCALE_SYNCED = 'pamenv_cli:login_locale_synced';

/**
 * @description 已缓存文案（{{count}} 条）→ {{path}}
 * @localZh 已缓存文案（{{count}} 条）→ {{path}}
 * @localEn Locales cached ({{count}} keys) → {{path}}
 */
export const PAMENV_CLI_LOCALES_CACHED = 'pamenv_cli:locales_cached';

/**
 * @description 拉取文案失败（API 报错时会重试）: {{message}}
 * @localZh 拉取文案失败（API 报错时会重试）: {{message}}
 * @localEn Failed to pull locale messages (will retry on API errors): {{message}}
 */
export const PAMENV_CLI_LOCALES_PULL_FAILED = 'pamenv_cli:locales_pull_failed';

/**
 * @description 配置项 `{{key}}` 缺少值
 * @localZh 配置项 `{{key}}` 缺少值
 * @localEn Missing value for config key `{{key}}`
 */
export const PAMENV_CLI_CONFIG_MISSING_VALUE = 'pamenv_cli:config_missing_value';

/**
 * @description 不支持的语言 `{{value}}`。可用: {{supported}}
 * @localZh 不支持的语言 `{{value}}`。可用: {{supported}}
 * @localEn Unsupported locale `{{value}}`. Use: {{supported}}
 */
export const PAMENV_CLI_CONFIG_UNSUPPORTED_LOCALE = 'pamenv_cli:config_unsupported_locale';

/**
 * @description 未知配置项 `{{key}}`。支持: {{supported}}
 * @localZh 未知配置项 `{{key}}`。支持: {{supported}}
 * @localEn Unknown config key `{{key}}`. Supported: {{supported}}
 */
export const PAMENV_CLI_CONFIG_UNKNOWN_KEY = 'pamenv_cli:config_unknown_key';

/**
 * @description baseUrl = {{url}}
 * @localZh baseUrl = {{url}}
 * @localEn baseUrl = {{url}}
 */
export const PAMENV_CLI_CONFIG_BASE_URL_SET = 'pamenv_cli:config_base_url_set';

/**
 * @description 配置: {{path}}
 * @localZh 配置: {{path}}
 * @localEn Config: {{path}}
 */
export const PAMENV_CLI_CONFIG_PATH = 'pamenv_cli:config_path';

/**
 * @description locale = {{locale}}
 * @localZh locale = {{locale}}
 * @localEn locale = {{locale}}
 */
export const PAMENV_CLI_CONFIG_LOCALE_SET = 'pamenv_cli:config_locale_set';

/**
 * @description path     {{path}}
 * @localZh path     {{path}}
 * @localEn path     {{path}}
 */
export const PAMENV_CLI_CONFIG_LIST_PATH = 'pamenv_cli:config_list_path';

/**
 * @description baseUrl  {{url}}
 * @localZh baseUrl  {{url}}
 * @localEn baseUrl  {{url}}
 */
export const PAMENV_CLI_CONFIG_LIST_BASE_URL = 'pamenv_cli:config_list_base_url';

/**
 * @description locale   {{locale}}{{locked}}
 * @localZh locale   {{locale}}{{locked}}
 * @localEn locale   {{locale}}{{locked}}
 */
export const PAMENV_CLI_CONFIG_LIST_LOCALE = 'pamenv_cli:config_list_locale';

/**
 * @description  (已锁定)
 * @localZh  (已锁定)
 * @localEn  (locked)
 */
export const PAMENV_CLI_CONFIG_LIST_LOCALE_LOCKED = 'pamenv_cli:config_list_locale_locked';

/**
 * @description messages {{count}} 条{{pulled}}
 * @localZh messages {{count}} 条{{pulled}}
 * @localEn messages {{count}} keys{{pulled}}
 */
export const PAMENV_CLI_CONFIG_LIST_MESSAGES = 'pamenv_cli:config_list_messages';

/**
 * @description  (拉取于 {{at}})
 * @localZh  (拉取于 {{at}})
 * @localEn  (pulled {{at}})
 */
export const PAMENV_CLI_CONFIG_LIST_MESSAGES_PULLED = 'pamenv_cli:config_list_messages_pulled';

/**
 * @description email    {{email}}
 * @localZh email    {{email}}
 * @localEn email    {{email}}
 */
export const PAMENV_CLI_CONFIG_LIST_EMAIL = 'pamenv_cli:config_list_email';

/**
 * @description token    (已设置)
 * @localZh token    (已设置)
 * @localEn token    (set)
 */
export const PAMENV_CLI_CONFIG_LIST_TOKEN_SET = 'pamenv_cli:config_list_token_set';

/**
 * @description token    (无)
 * @localZh token    (无)
 * @localEn token    (none)
 */
export const PAMENV_CLI_CONFIG_LIST_TOKEN_NONE = 'pamenv_cli:config_list_token_none';

/**
 * @description (无)
 * @localZh (无)
 * @localEn (none)
 */
export const PAMENV_CLI_CONFIG_EMAIL_NONE = 'pamenv_cli:config_email_none';

/**
 * @description 正在拉取文案 locale={{locale}} ← {{baseUrl}} ...
 * @localZh 正在拉取文案 locale={{locale}} ← {{baseUrl}} ...
 * @localEn Pulling locales locale={{locale}} from {{baseUrl}} ...
 */
export const PAMENV_CLI_LOCALES_PULLING = 'pamenv_cli:locales_pulling';

/**
 * @description 已写入 {{count}} 条 → {{path}}
 * @localZh 已写入 {{count}} 条 → {{path}}
 * @localEn Wrote {{count}} keys → {{path}}
 */
export const PAMENV_CLI_LOCALES_PULLED = 'pamenv_cli:locales_pulled';

/**
 * @description 已取消。
 * @localZh 已取消。
 * @localEn Cancelled.
 */
export const PAMENV_CLI_CANCELLED = 'pamenv_cli:cancelled';

/**
 * @description 正在扫描 {{cwd}} ...
 * @localZh 正在扫描 {{cwd}} ...
 * @localEn Scanning {{cwd}} ...
 */
export const PAMENV_CLI_SCANNING = 'pamenv_cli:scanning';

/**
 * @description 项目名称
 * @localZh 项目名称
 * @localEn project name
 */
export const PAMENV_CLI_PROMPT_PROJECT_NAME = 'pamenv_cli:prompt_project_name';

/**
 * @description 项目名称不能为空
 * @localZh 项目名称不能为空
 * @localEn Project name is required
 */
export const PAMENV_CLI_PROJECT_NAME_REQUIRED = 'pamenv_cli:project_name_required';

/**
 * @description 描述
 * @localZh 描述
 * @localEn description
 */
export const PAMENV_CLI_PROMPT_DESCRIPTION = 'pamenv_cli:prompt_description';

/**
 * @description 分类
 * @localZh 分类
 * @localEn category
 */
export const PAMENV_CLI_PROMPT_CATEGORY = 'pamenv_cli:prompt_category';

/**
 * @description 自定义分类…
 * @localZh 自定义分类…
 * @localEn Custom category…
 */
export const PAMENV_CLI_CATEGORY_CUSTOM = 'pamenv_cli:category_custom';

/**
 * @description 输入分类名称
 * @localZh 输入分类名称
 * @localEn Category name
 */
export const PAMENV_CLI_PROMPT_CATEGORY_CUSTOM =
  'pamenv_cli:prompt_category_custom';

/**
 * @description 分类不能为空
 * @localZh 分类不能为空
 * @localEn Category is required
 */
export const PAMENV_CLI_CATEGORY_REQUIRED = 'pamenv_cli:category_required';

/**
 * @description 仓库地址
 * @localZh 仓库地址
 * @localEn repository url
 */
export const PAMENV_CLI_PROMPT_REPO_URL = 'pamenv_cli:prompt_repo_url';

/**
 * @description 即将创建：
 * @localZh 即将创建：
 * @localEn About to create:
 */
export const PAMENV_CLI_ABOUT_TO_CREATE = 'pamenv_cli:about_to_create';

/**
 * @description 确认创建该 PAM 项目？
 * @localZh 确认创建该 PAM 项目？
 * @localEn Create this PAM project?
 */
export const PAMENV_CLI_CREATE_CONFIRM = 'pamenv_cli:create_confirm';

/**
 * @description 已创建项目 "{{slug}}" ({{id}})。
 * @localZh 已创建项目 "{{slug}}" ({{id}})。
 * @localEn Created project "{{slug}}" ({{id}}).
 */
export const PAMENV_CLI_CREATED_PROJECT = 'pamenv_cli:created_project';

/**
 * @description 未创建环境。可在 PAM 网页添加，或补齐 .env 后重新 init。
 * @localZh 未创建环境。可在 PAM 网页添加，或补齐 .env 后重新 init。
 * @localEn No environments were created. Add them in the PAM UI, or re-run init after adding .env files.
 */
export const PAMENV_CLI_NO_ENVS_CREATED = 'pamenv_cli:no_envs_created';

/**
 * @description 下一步：推送本地 dotenv，例如：
 * @localZh 下一步：推送本地 dotenv，例如：
 * @localEn Next: push local dotenv files, for example:
 */
export const PAMENV_CLI_NEXT_PUSH = 'pamenv_cli:next_push';

/**
 * @description     （读取项目目录中的 {{fileName}}）
 * @localZh     （读取项目目录中的 {{fileName}}）
 * @localEn     (reads {{fileName}} in the project directory)
 */
export const PAMENV_CLI_NEXT_PUSH_READS = 'pamenv_cli:next_push_reads';

/**
 * @description 也可打开 {{url}} 查看项目详情。
 * @localZh 也可打开 {{url}} 查看项目详情。
 * @localEn You can also open {{url}} to view project details.
 */
export const PAMENV_CLI_OPEN_PROJECT_DETAIL = 'pamenv_cli:open_project_detail';

/**
 * @description   package.json: {{value}}
 * @localZh   package.json: {{value}}
 * @localEn   package.json: {{value}}
 */
export const PAMENV_CLI_SCAN_PACKAGE = 'pamenv_cli:scan_package';

/**
 * @description   package.json: (未找到)
 * @localZh   package.json: (未找到)
 * @localEn   package.json: (not found)
 */
export const PAMENV_CLI_SCAN_PACKAGE_MISSING = 'pamenv_cli:scan_package_missing';

/**
 * @description   homepage:     {{value}}
 * @localZh   homepage:     {{value}}
 * @localEn   homepage:     {{value}}
 */
export const PAMENV_CLI_SCAN_HOMEPAGE = 'pamenv_cli:scan_homepage';

/**
 * @description   homepage:     (未找到)
 * @localZh   homepage:     (未找到)
 * @localEn   homepage:     (not found)
 */
export const PAMENV_CLI_SCAN_HOMEPAGE_MISSING = 'pamenv_cli:scan_homepage_missing';

/**
 * @description   git origin:   {{value}}
 * @localZh   git origin:   {{value}}
 * @localEn   git origin:   {{value}}
 */
export const PAMENV_CLI_SCAN_GIT = 'pamenv_cli:scan_git';

/**
 * @description   git origin:   (未找到)
 * @localZh   git origin:   (未找到)
 * @localEn   git origin:   (not found)
 */
export const PAMENV_CLI_SCAN_GIT_MISSING = 'pamenv_cli:scan_git_missing';

/**
 * @description   env 文件:     {{value}}
 * @localZh   env 文件:     {{value}}
 * @localEn   env files:    {{value}}
 */
export const PAMENV_CLI_SCAN_ENV_FILES = 'pamenv_cli:scan_env_files';

/**
 * @description   env 文件:     (无)
 * @localZh   env 文件:     (无)
 * @localEn   env files:    (none)
 */
export const PAMENV_CLI_SCAN_ENV_FILES_NONE = 'pamenv_cli:scan_env_files_none';

/**
 * @description 项目 slug（全局唯一）
 * @localZh 项目 slug（全局唯一）
 * @localEn project slug (globally unique)
 */
export const PAMENV_CLI_PROMPT_SLUG = 'pamenv_cli:prompt_slug';

/**
 * @description slug 不能为空（字母、数字、短横线）
 * @localZh slug 不能为空（字母、数字、短横线）
 * @localEn Slug is required (letters, numbers, dashes)
 */
export const PAMENV_CLI_SLUG_REQUIRED = 'pamenv_cli:slug_required';

/**
 * @description 项目 "{{slug}}" 已存在且归你所有。
 * @localZh 项目 "{{slug}}" 已存在且归你所有。
 * @localEn Project "{{slug}}" already exists and you own it.
 */
export const PAMENV_CLI_PROJECT_EXISTS_OWNED = 'pamenv_cli:project_exists_owned';

/**
 * @description 环境: {{envs}}
 * @localZh 环境: {{envs}}
 * @localEn Environments: {{envs}}
 */
export const PAMENV_CLI_PROJECT_EXISTS_ENVS = 'pamenv_cli:project_exists_envs';

/**
 * @description 使用 `pamenv push {{slug}} -e <env>` 上传 dotenv。
 * @localZh 使用 `pamenv push {{slug}} -e <env>` 上传 dotenv。
 * @localEn Use `pamenv push {{slug}} -e <env>` to upload dotenv files.
 */
export const PAMENV_CLI_PROJECT_EXISTS_PUSH_HINT = 'pamenv_cli:project_exists_push_hint';

/**
 * @description Slug "{{slug}}" 已被其他项目占用。
 * @localZh Slug "{{slug}}" 已被其他项目占用。
 * @localEn Slug "{{slug}}" is already taken by another project.
 */
export const PAMENV_CLI_SLUG_TAKEN = 'pamenv_cli:slug_taken';

/**
 * @description 请换一个 slug 后重新运行 `pamenv init`。
 * @localZh 请换一个 slug 后重新运行 `pamenv init`。
 * @localEn Choose a different slug and run `pamenv init` again.
 */
export const PAMENV_CLI_SLUG_TAKEN_RETRY = 'pamenv_cli:slug_taken_retry';

/**
 * @description 没有 .env 文件且没有 package homepage — 跳过环境创建。
 * @localZh 没有 .env 文件且没有 package homepage — 跳过环境创建。
 * @localEn No .env files and no package homepage — skipping environments.
 */
export const PAMENV_CLI_SKIP_ENVS_NO_FILES_NO_HOME = 'pamenv_cli:skip_envs_no_files_no_home';

/**
 * @description 未找到 .env 文件 — 跳过环境创建（仅有 homepage 不够）。
 * @localZh 未找到 .env 文件 — 跳过环境创建（仅有 homepage 不够）。
 * @localEn No .env files found — skipping environments (homepage alone is not enough).
 */
export const PAMENV_CLI_SKIP_ENVS_NO_FILES = 'pamenv_cli:skip_envs_no_files';

/**
 * @description 要创建的环境
 * @localZh 要创建的环境
 * @localEn environments to create
 */
export const PAMENV_CLI_PROMPT_ENVS_TO_CREATE = 'pamenv_cli:prompt_envs_to_create';

/**
 * @description 未选择环境 — 将创建无环境的项目。
 * @localZh 未选择环境 — 将创建无环境的项目。
 * @localEn No environments selected — creating project without envs.
 */
export const PAMENV_CLI_NO_ENVS_SELECTED = 'pamenv_cli:no_envs_selected';

/**
 * @description 根据 {{sources}} 配置环境：
 * @localZh 根据 {{sources}} 配置环境：
 * @localEn Configure environment from {{sources}}:
 */
export const PAMENV_CLI_CONFIGURE_ENV_FROM = 'pamenv_cli:configure_env_from';

/**
 * @description   环境名
 * @localZh   环境名
 * @localEn   env name
 */
export const PAMENV_CLI_PROMPT_ENV_NAME = 'pamenv_cli:prompt_env_name';

/**
 * @description 环境名不能为空
 * @localZh 环境名不能为空
 * @localEn Environment name is required
 */
export const PAMENV_CLI_ENV_NAME_REQUIRED = 'pamenv_cli:env_name_required';

/**
 * @description   环境 URL
 * @localZh   环境 URL
 * @localEn   env url
 */
export const PAMENV_CLI_PROMPT_ENV_URL = 'pamenv_cli:prompt_env_url';

/**
 * @description 需要有效的 http(s) URL
 * @localZh 需要有效的 http(s) URL
 * @localEn A valid http(s) URL is required
 */
export const PAMENV_CLI_ENV_URL_REQUIRED = 'pamenv_cli:env_url_required';

/**
 * @description 编辑后环境名重复
 * @localZh 编辑后环境名重复
 * @localEn Duplicate environment names after editing
 */
export const PAMENV_CLI_DUPLICATE_ENV_NAMES = 'pamenv_cli:duplicate_env_names';

/**
 * @description (无)
 * @localZh (无)
 * @localEn (none)
 */
export const PAMENV_CLI_LABEL_NONE = 'pamenv_cli:label_none';

/**
 * @description Pull 冲突：本地文件与远端不一致
 * @localZh Pull 冲突：本地文件与远端不一致
 * @localEn Pull conflict: local file differs from remote
 */
export const PAMENV_CLI_PULL_CONFLICT = 'pamenv_cli:pull_conflict';

/**
 * @description 本地文件: {{path}}
 * @localZh 本地文件: {{path}}
 * @localEn Local file: {{path}}
 */
export const PAMENV_CLI_LOCAL_FILE = 'pamenv_cli:local_file';

/**
 * @description 用远端值覆盖本地文件（有远端注释时以远端为准）？
 * @localZh 用远端值覆盖本地文件（有远端注释时以远端为准）？
 * @localEn Overwrite local file with remote values (remote comments win when present)?
 */
export const PAMENV_CLI_PULL_OVERWRITE_PROMPT = 'pamenv_cli:pull_overwrite_prompt';

/**
 * @description 已是最新: {{slug}}/{{env}} ({{path}})
 * @localZh 已是最新: {{slug}}/{{env}} ({{path}})
 * @localEn Already up to date: {{slug}}/{{env}} ({{path}})
 */
export const PAMENV_CLI_PULL_UP_TO_DATE = 'pamenv_cli:pull_up_to_date';

/**
 * @description 已拉取 {{slug}}/{{env}} → {{path}}
 * @localZh 已拉取 {{slug}}/{{env}} → {{path}}
 * @localEn Pulled {{slug}}/{{env}} → {{path}}
 */
export const PAMENV_CLI_PULLED = 'pamenv_cli:pulled';

/**
 * @description 你没有项目 "{{slug}}" 的写权限（需为所有者或协作者）。
 * @localZh 你没有项目 "{{slug}}" 的写权限（需为所有者或协作者）。
 * @localEn You do not have write access to project "{{slug}}" (owner or collaborator required).
 */
export const PAMENV_CLI_NOT_OWNER_EXPORT = 'pamenv_cli:not_owner_export';

/**
 * @description 你没有项目 "{{slug}}" 的写权限（需为所有者或协作者）。
 * @localZh 你没有项目 "{{slug}}" 的写权限（需为所有者或协作者）。
 * @localEn You do not have write access to project "{{slug}}" (owner or collaborator required).
 */
export const PAMENV_CLI_NOT_OWNER_PUSH = 'pamenv_cli:not_owner_push';

/**
 * @description 已同步: {{slug}}/{{env}}
 * @localZh 已同步: {{slug}}/{{env}}
 * @localEn Already in sync: {{slug}}/{{env}}
 */
export const PAMENV_CLI_PUSH_ALREADY_SYNC = 'pamenv_cli:push_already_sync';

/**
 * @description Push 冲突：自上次同步后本地与远端均有变更
 * @localZh Push 冲突：自上次同步后本地与远端均有变更
 * @localEn Push conflict: local and remote both changed since last sync
 */
export const PAMENV_CLI_PUSH_CONFLICT = 'pamenv_cli:push_conflict';

/**
 * @description 冲突键: {{keys}}
 * @localZh 冲突键: {{keys}}
 * @localEn Conflicting keys: {{keys}}
 */
export const PAMENV_CLI_PUSH_CONFLICT_KEYS = 'pamenv_cli:push_conflict_keys';

/**
 * @description Push 预览: {{slug}}/{{env}}
 * @localZh Push 预览: {{slug}}/{{env}}
 * @localEn Push review: {{slug}}/{{env}}
 */
export const PAMENV_CLI_PUSH_REVIEW = 'pamenv_cli:push_review';

/**
 * @description 已推送 {{slug}}/{{env}} ← {{path}}
 * @localZh 已推送 {{slug}}/{{env}} ← {{path}}
 * @localEn Pushed {{slug}}/{{env}} ← {{path}}
 */
export const PAMENV_CLI_PUSHED = 'pamenv_cli:pushed';

/**
 * @description 已创建环境 {{slug}}/{{name}}
 * @localZh 已创建环境 {{slug}}/{{name}}
 * @localEn Created environment {{slug}}/{{name}}
 */
export const PAMENV_CLI_CREATED_ENVIRONMENT = 'pamenv_cli:created_environment';

/**
 * @description 将创建环境 "{{name}}"，url: {{url}}
 * @localZh 将创建环境 "{{name}}"，url: {{url}}
 * @localEn Will create environment "{{name}}" with url: {{url}}
 */
export const PAMENV_CLI_WILL_CREATE_ENV = 'pamenv_cli:will_create_env';

/**
 * @description 自上次同步后远端已变更。请先运行 `pamenv pull {{slug}} -e {{env}}`。
 * @localZh 自上次同步后远端已变更。请先运行 `pamenv pull {{slug}} -e {{env}}`。
 * @localEn Remote changed since last sync. Run `pamenv pull {{slug}} -e {{env}}` first.
 */
export const PAMENV_CLI_PUSH_REMOTE_ONLY = 'pamenv_cli:push_remote_only';

/**
 * @description 仍要用本地值覆盖远端吗？
 * @localZh 仍要用本地值覆盖远端吗？
 * @localEn Overwrite remote with local values anyway?
 */
export const PAMENV_CLI_PUSH_OVERWRITE_REMOTE = 'pamenv_cli:push_overwrite_remote';

/**
 * @description 尚无同步基线。创建 {{slug}}/{{env}} 并推送本地变量？
 * @localZh 尚无同步基线。创建 {{slug}}/{{env}} 并推送本地变量？
 * @localEn No sync baseline found. Create {{slug}}/{{env}} and push local variables?
 */
export const PAMENV_CLI_PUSH_NO_BASELINE_CREATE = 'pamenv_cli:push_no_baseline_create';

/**
 * @description 尚无同步基线（此处从未 pull/push）。仍要用本地覆盖远端？
 * @localZh 尚无同步基线（此处从未 pull/push）。仍要用本地覆盖远端？
 * @localEn No sync baseline found (never pulled/pushed here). Push local over remote anyway?
 */
export const PAMENV_CLI_PUSH_NO_BASELINE = 'pamenv_cli:push_no_baseline';

/**
 * @description 将 {{count}} 个变量推送到 {{slug}}/{{env}}？
 * @localZh 将 {{count}} 个变量推送到 {{slug}}/{{env}}？
 * @localEn Push {{count}} variable(s) to {{slug}}/{{env}}?
 */
export const PAMENV_CLI_PUSH_CONFIRM = 'pamenv_cli:push_confirm';

/**
 * @description 创建 {{slug}}/{{env}} 并推送 {{count}} 个变量？
 * @localZh 创建 {{slug}}/{{env}} 并推送 {{count}} 个变量？
 * @localEn Create {{slug}}/{{env}} and push {{count}} variable(s)?
 */
export const PAMENV_CLI_PUSH_CONFIRM_CREATE = 'pamenv_cli:push_confirm_create';

/**
 * @description 检测到大量变更。仍要推送到 PAM？
 * @localZh 检测到大量变更。仍要推送到 PAM？
 * @localEn Large changes detected. Push these variables to PAM anyway?
 */
export const PAMENV_CLI_PUSH_CONFIRM_LARGE = 'pamenv_cli:push_confirm_large';

/**
 * @description 检测到大量变更。仍要创建 {{slug}}/{{env}} 并推送？
 * @localZh 检测到大量变更。仍要创建 {{slug}}/{{env}} 并推送？
 * @localEn Large changes detected. Create {{slug}}/{{env}} and push these variables anyway?
 */
export const PAMENV_CLI_PUSH_CONFIRM_CREATE_LARGE = 'pamenv_cli:push_confirm_create_large';

/**
 * @description 警告：变量名变更较大（新增 {{added}}，删除 {{removed}}；远端原有 {{remote}} 个键）。
 * @localZh 警告：变量名变更较大（新增 {{added}}，删除 {{removed}}；远端原有 {{remote}} 个键）。
 * @localEn Warning: large variable name changes (added {{added}}, removed {{removed}}; remote had {{remote}} keys).
 */
export const PAMENV_CLI_PUSH_LARGE_WARNING = 'pamenv_cli:push_large_warning';

/**
 * @description 已推送 {{path}} → {{slug}}/{{env}}（{{count}} 个变量）
 * @localZh 已推送 {{path}} → {{slug}}/{{env}}（{{count}} 个变量）
 * @localEn Pushed {{path}} → {{slug}}/{{env}} ({{count}} vars)
 */
export const PAMENV_CLI_PUSHED_DETAIL = 'pamenv_cli:pushed_detail';

