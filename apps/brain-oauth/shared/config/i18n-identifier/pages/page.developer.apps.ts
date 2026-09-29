/**
 * @description Developer apps page title
 * @localZh 我的 OAuth 应用
 * @localEn My OAuth apps
 */
export const DEVELOPER_APPS_TITLE = 'developer_apps:title';

/**
 * @description Developer apps page description
 * @localZh 管理你的 OAuth 2.0 应用，创建和管理客户端凭证
 * @localEn Manage your OAuth 2.0 apps and client credentials
 */
export const DEVELOPER_APPS_DESCRIPTION = 'developer_apps:description';

/**
 * @description Developer apps page keywords
 * @localZh OAuth, 开发者, 应用管理, 客户端
 * @localEn OAuth, developer, application management, client
 */
export const DEVELOPER_APPS_KEYWORDS = 'developer_apps:keywords';

/**
 * @description Create new app button text
 * @localZh 创建新应用
 * @localEn New app
 */
export const DEVELOPER_APPS_CREATE_BUTTON = 'developer_apps:create_button';

/**
 * @description Edit app button text
 * @localZh 编辑
 * @localEn Edit
 */
export const DEVELOPER_APPS_EDIT_BUTTON = 'developer_apps:edit_button';

/**
 * @description Delete app button text
 * @localZh 删除
 * @localEn Delete
 */
export const DEVELOPER_APPS_DELETE_BUTTON = 'developer_apps:delete_button';

/**
 * @description Rotate secret button text
 * @localZh 重置密钥
 * @localEn Rotate secret
 */
export const DEVELOPER_APPS_ROTATE_SECRET_BUTTON =
  'developer_apps:rotate_secret_button';

/**
 * @description Client ID label
 * @localZh Client ID
 * @localEn Client ID
 */
export const DEVELOPER_APPS_CLIENT_ID_LABEL = 'developer_apps:client_id_label';

/**
 * @description Redirect URIs label
 * @localZh 重定向 URI
 * @localEn Redirect URIs
 */
export const DEVELOPER_APPS_REDIRECT_URIS_LABEL =
  'developer_apps:redirect_uris_label';

/**
 * @description Created at label
 * @localZh 创建于
 * @localEn Created
 */
export const DEVELOPER_APPS_CREATED_AT_LABEL =
  'developer_apps:created_at_label';

/**
 * @description Status enabled badge text
 * @localZh 已启用
 * @localEn Enabled
 */
export const DEVELOPER_APPS_STATUS_ENABLED = 'developer_apps:status_enabled';

/**
 * @description Create modal title
 * @localZh 创建 OAuth 应用
 * @localEn Create OAuth app
 */
export const DEVELOPER_APPS_CREATE_MODAL_TITLE =
  'developer_apps:create_modal_title';

/**
 * @description Edit modal title
 * @localZh 编辑应用
 * @localEn Edit app
 */
export const DEVELOPER_APPS_EDIT_MODAL_TITLE =
  'developer_apps:edit_modal_title';

/**
 * @description Application name form label
 * @localZh 应用名称
 * @localEn App name
 */
export const DEVELOPER_APPS_APP_NAME_LABEL = 'developer_apps:app_name_label';

/**
 * @description Application name required validation message
 * @localZh 请输入应用名称
 * @localEn Please enter application name
 */
export const DEVELOPER_APPS_APP_NAME_REQUIRED =
  'developer_apps:app_name_required';

/**
 * @description Redirect URIs required validation message
 * @localZh 请至少填写一个重定向 URI
 * @localEn Please enter at least one redirect URI
 */
export const DEVELOPER_APPS_REDIRECT_URIS_REQUIRED =
  'developer_apps:redirect_uris_required';

/**
 * @description Redirect URIs textarea placeholder
 * @localZh https://your-app.com/callback
 * @localEn https://your-app.com/callback
 */
export const DEVELOPER_APPS_REDIRECT_URIS_PLACEHOLDER =
  'developer_apps:redirect_uris_placeholder';

/**
 * @description Redirect URIs hint text
 * @localZh 每行一个；必须使用 HTTPS，本地开发可用 http://localhost。
 * @localEn One per line. HTTPS required; http://localhost is allowed for development.
 */
export const DEVELOPER_APPS_REDIRECT_URIS_HINT =
  'developer_apps:redirect_uris_hint';

/**
 * @description Client URI form label
 * @localZh 应用主页 URL（可选）
 * @localEn Homepage URL (optional)
 */
export const DEVELOPER_APPS_CLIENT_URI_LABEL =
  'developer_apps:client_uri_label';

/**
 * @description Logo URI form label
 * @localZh Logo 图片 URL（可选）
 * @localEn Logo URL (optional)
 */
export const DEVELOPER_APPS_LOGO_URI_LABEL = 'developer_apps:logo_uri_label';

/**
 * @description Logo URI form hint
 * @localZh 将显示在授权页与应用列表。
 * @localEn Shown on the consent page and in the app list.
 */
export const DEVELOPER_APPS_LOGO_URI_HINT = 'developer_apps:logo_uri_hint';

/**
 * @description Logo URI invalid message
 * @localZh 请输入有效的图片 URL
 * @localEn Please enter a valid image URL
 */
export const DEVELOPER_APPS_LOGO_URI_INVALID =
  'developer_apps:logo_uri_invalid';

/**
 * @description Cancel button text
 * @localZh 取消
 * @localEn Cancel
 */
export const DEVELOPER_APPS_CANCEL_BUTTON = 'developer_apps:cancel_button';

/**
 * @description Create submit button text
 * @localZh 创建应用
 * @localEn Create app
 */
export const DEVELOPER_APPS_CREATE_SUBMIT_BUTTON =
  'developer_apps:create_submit_button';

/**
 * @description Save submit button text
 * @localZh 保存修改
 * @localEn Save
 */
export const DEVELOPER_APPS_SAVE_SUBMIT_BUTTON =
  'developer_apps:save_submit_button';

/**
 * @description Delete confirmation dialog title
 * @localZh 删除应用？
 * @localEn Delete app?
 */
export const DEVELOPER_APPS_DELETE_CONFIRM_TITLE =
  'developer_apps:delete_confirm_title';

/**
 * @description Delete confirmation dialog content
 * @localZh 删除后无法恢复，已授权的用户将无法继续通过该应用登录。
 * @localEn This cannot be undone. Users will no longer be able to sign in through this app.
 */
export const DEVELOPER_APPS_DELETE_CONFIRM_CONTENT =
  'developer_apps:delete_confirm_content';

/**
 * @description Rotate secret confirmation dialog title
 * @localZh 重置密钥？
 * @localEn Rotate secret?
 */
export const DEVELOPER_APPS_ROTATE_SECRET_CONFIRM_TITLE =
  'developer_apps:rotate_secret_confirm_title';

/**
 * @description Rotate secret confirmation dialog content
 * @localZh 旧密钥会立即失效，使用旧密钥的服务需要同步更新。
 * @localEn The old secret stops working immediately. Update any service that uses it.
 */
export const DEVELOPER_APPS_ROTATE_SECRET_CONFIRM_CONTENT =
  'developer_apps:rotate_secret_confirm_content';

/**
 * @description Toast message for successful app creation
 * @localZh 应用创建成功！
 * @localEn Application created successfully!
 */
export const DEVELOPER_APPS_TOAST_CREATE_SUCCESS =
  'developer_apps:toast_create_success';

/**
 * @description Toast message for successful app update
 * @localZh 应用信息已更新
 * @localEn App updated
 */
export const DEVELOPER_APPS_TOAST_UPDATE_SUCCESS =
  'developer_apps:toast_update_success';

/**
 * @description Toast message for successful app deletion
 * @localZh 应用已删除
 * @localEn App deleted
 */
export const DEVELOPER_APPS_TOAST_DELETE_SUCCESS =
  'developer_apps:toast_delete_success';

/**
 * @description Toast message for successful secret rotation
 * @localZh 新密钥已生成，请妥善保存
 * @localEn New secret generated, please save it securely
 */
export const DEVELOPER_APPS_TOAST_ROTATE_SUCCESS =
  'developer_apps:toast_rotate_success';

/**
 * @description Toast message for operation error
 * @localZh 操作失败，请稍后重试
 * @localEn Operation failed, please try again later
 */
export const DEVELOPER_APPS_TOAST_ERROR = 'developer_apps:toast_error';

/**
 * @description Empty state message when no apps exist
 * @localZh 还没有应用，创建一个开始接入 Brain 登录
 * @localEn No apps yet. Create one to start using Brain sign-in.
 */
export const DEVELOPER_APPS_EMPTY_STATE = 'developer_apps:empty_state';

/**
 * @description Developer console subtitle in page header
 * @localZh 开发者控制台
 * @localEn Developer console
 */
export const DEVELOPER_APPS_CONSOLE_SUBTITLE =
  'developer_apps:console_subtitle';

/**
 * @description Credentials modal title after create or rotate secret
 * @localZh 新应用凭据
 * @localEn App credentials
 */
export const DEVELOPER_APPS_CREDENTIALS_MODAL_TITLE =
  'developer_apps:credentials_modal_title';

/**
 * @description Client secret label in credentials modal
 * @localZh Client Secret
 * @localEn Client Secret
 */
export const DEVELOPER_APPS_CLIENT_SECRET_LABEL =
  'developer_apps:client_secret_label';

/**
 * @description One-time secret warning in credentials modal
 * @localZh 此密钥仅显示一次，请立即保存到安全位置，关闭后无法再次查看。
 * @localEn This secret is shown only once. Store it somewhere safe now.
 */
export const DEVELOPER_APPS_SECRET_WARNING = 'developer_apps:secret_warning';

/**
 * @description Confirm button in credentials modal
 * @localZh 我已保存，关闭
 * @localEn I have saved it
 */
export const DEVELOPER_APPS_CREDENTIALS_CONFIRM =
  'developer_apps:credentials_confirm';

/**
 * @description Copy button label (aria / tooltip)
 * @localZh 复制
 * @localEn Copy
 */
export const DEVELOPER_APPS_COPY = 'developer_apps:copy';

/**
 * @description Toast after copying client id
 * @localZh Client ID 已复制
 * @localEn Client ID copied
 */
export const DEVELOPER_APPS_COPY_CLIENT_ID_SUCCESS =
  'developer_apps:copy_client_id_success';

/**
 * @description Toast after copying client secret
 * @localZh Client Secret 已复制
 * @localEn Client Secret copied
 */
export const DEVELOPER_APPS_COPY_SECRET_SUCCESS =
  'developer_apps:copy_secret_success';

/**
 * @description Loading apps list
 * @localZh 加载应用中…
 * @localEn Loading applications…
 */
export const DEVELOPER_APPS_LOADING = 'developer_apps:loading';

/**
 * @description Saving create/edit form
 * @localZh 保存中...
 * @localEn Saving...
 */
export const DEVELOPER_APPS_SAVING = 'developer_apps:saving';

/**
 * @description Client type field label
 * @localZh 客户端类型
 * @localEn Client type
 */
export const DEVELOPER_APPS_CLIENT_TYPE_LABEL =
  'developer_apps:client__type__label';

/**
 * @description Confidential client option
 * @localZh 机密客户端
 * @localEn Confidential client
 */
export const DEVELOPER_APPS_CLIENT_TYPE_CONFIDENTIAL =
  'developer_apps:client__type__confidential';

/**
 * @description Public client option
 * @localZh 公共客户端（PKCE）
 * @localEn Public client (PKCE)
 */
export const DEVELOPER_APPS_CLIENT_TYPE_PUBLIC =
  'developer_apps:client__type__public';

/**
 * @description Client type locked hint on edit
 * @localZh 创建后不可更改
 * @localEn Cannot be changed after creation
 */
export const DEVELOPER_APPS_CLIENT_TYPE_LOCKED_HINT =
  'developer_apps:client__type__locked__hint';

/**
 * @description Public client badge
 * @localZh 公共客户端
 * @localEn Public
 */
export const DEVELOPER_APPS_STATUS_PUBLIC = 'developer_apps:status__public';

/**
 * @description Confidential client badge
 * @localZh 机密客户端
 * @localEn Confidential
 */
export const DEVELOPER_APPS_STATUS_CONFIDENTIAL =
  'developer_apps:status__confidential';

/**
 * @description Public client credentials note
 * @localZh 公共客户端不生成 client_secret，请在前端使用 PKCE 完成授权。
 * @localEn Public clients have no client_secret. Use PKCE in your frontend.
 */
export const DEVELOPER_APPS_PUBLIC_CLIENT_NOTE =
  'developer_apps:public__client__note';

/**
 * @description Application name placeholder
 * @localZh 例如：我的网站
 * @localEn e.g. My website
 */
export const DEVELOPER_APPS_APP_NAME_PLACEHOLDER =
  'developer_apps:app_name_placeholder';

/**
 * @description Confidential client option hint
 * @localZh 有服务端，可以安全保存 client_secret
 * @localEn Has a backend that can keep client_secret safe
 */
export const DEVELOPER_APPS_CLIENT_TYPE_CONFIDENTIAL_HINT =
  'developer_apps:client__type__confidential__hint';

/**
 * @description Public client option hint
 * @localZh SPA / 移动端，不生成 secret，必须使用 PKCE
 * @localEn SPA / mobile, no secret, PKCE required
 */
export const DEVELOPER_APPS_CLIENT_TYPE_PUBLIC_HINT =
  'developer_apps:client__type__public__hint';
