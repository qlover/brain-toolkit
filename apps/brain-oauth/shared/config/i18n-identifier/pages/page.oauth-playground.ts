/**
 * Brain OAuth — in-app OAuth flow playground identifiers (`page_oauth_playground` namespace).
 * Brain users simulate authorization code flow without leaving the portal.
 */

/**
 * @description Playground — page title
 * @localZh OAuth 流程测试
 * @localEn OAuth flow tester
 */
export const PAGE_OAUTH_PLAYGROUND_TITLE = 'page_oauth_playground:title';

/**
 * @description Playground — meta description
 * @localZh 在站内模拟授权码登录与 token / userinfo 调用
 * @localEn Simulate authorization code flow and token / userinfo calls in-app
 */
export const PAGE_OAUTH_PLAYGROUND_DESCRIPTION =
  'page_oauth_playground:description';

/**
 * @description Playground — content label
 * @localZh OAuth 测试台
 * @localEn OAuth playground
 */
export const PAGE_OAUTH_PLAYGROUND_CONTENT = 'page_oauth_playground:content';

/**
 * @description Playground — SEO keywords
 * @localZh OAuth, 测试, 授权
 * @localEn OAuth, test, authorization
 */
export const PAGE_OAUTH_PLAYGROUND_KEYWORDS = 'page_oauth_playground:keywords';

/**
 * @description Header subtitle next to the logo
 * @localZh 测试台
 * @localEn Playground
 */
export const PAGE_OAUTH_PLAYGROUND_HEADER_SUB =
  'page_oauth_playground:header__sub';

/**
 * @description Subtitle under the page title
 * @localZh 用已注册应用的真实参数，在站内完成授权、换取令牌和读取用户信息
 * @localEn Run authorize, token exchange and userinfo on this site with your app's real parameters
 */
export const PAGE_OAUTH_PLAYGROUND_DESC = 'page_oauth_playground:desc';

/**
 * @description Account row — hint under the email
 * @localZh 授权将以这个账号进行
 * @localEn Authorization runs as this account
 */
export const PAGE_OAUTH_PLAYGROUND_ACCOUNT_SUB =
  'page_oauth_playground:account__sub';

/**
 * @description Account row — signed-in pill
 * @localZh 已登录
 * @localEn Signed in
 */
export const PAGE_OAUTH_PLAYGROUND_SIGNED_IN =
  'page_oauth_playground:signed__in';

/**
 * @description Step 1 title
 * @localZh 选择客户端
 * @localEn Choose a client
 */
export const PAGE_OAUTH_PLAYGROUND_STEP_CLIENT =
  'page_oauth_playground:step__client';

/**
 * @description Step 2 title
 * @localZh 授权确认
 * @localEn Consent
 */
export const PAGE_OAUTH_PLAYGROUND_STEP_CONSENT =
  'page_oauth_playground:step__consent';

/**
 * @description Step 3 title
 * @localZh 换取令牌
 * @localEn Exchange the code
 */
export const PAGE_OAUTH_PLAYGROUND_STEP_TOKEN =
  'page_oauth_playground:step__token';

/**
 * @description Step 4 title
 * @localZh 用户信息
 * @localEn User info
 */
export const PAGE_OAUTH_PLAYGROUND_STEP_USERINFO =
  'page_oauth_playground:step__userinfo';

/**
 * @description Reopen a completed step
 * @localZh 修改
 * @localEn Change
 */
export const PAGE_OAUTH_PLAYGROUND_CHANGE = 'page_oauth_playground:change';

/**
 * @description Client type — confidential
 * @localZh 机密客户端
 * @localEn Confidential client
 */
export const PAGE_OAUTH_PLAYGROUND_CONFIDENTIAL =
  'page_oauth_playground:confidential';

/**
 * @description Client type — public
 * @localZh 公共客户端
 * @localEn Public client
 */
export const PAGE_OAUTH_PLAYGROUND_PUBLIC = 'page_oauth_playground:public';

/**
 * @description Step 2 summary after allow
 * @localZh 已模拟允许，拿到授权码
 * @localEn Approved, authorization code received
 */
export const PAGE_OAUTH_PLAYGROUND_SUMMARY_ALLOWED =
  'page_oauth_playground:summary__allowed';

/**
 * @description Step 2 summary after deny
 * @localZh 已模拟拒绝
 * @localEn Denied
 */
export const PAGE_OAUTH_PLAYGROUND_SUMMARY_DENIED =
  'page_oauth_playground:summary__denied';

/**
 * @description Step 3 summary after token exchange
 * @localZh 已获得 access_token
 * @localEn access_token received
 */
export const PAGE_OAUTH_PLAYGROUND_SUMMARY_TOKEN =
  'page_oauth_playground:summary__token';

/**
 * @description Client select label
 * @localZh 客户端
 * @localEn Client
 */
export const PAGE_OAUTH_PLAYGROUND_CLIENT_LABEL =
  'page_oauth_playground:client__label';

/**
 * @description Shown when the user has no OAuth apps
 * @localZh 还没有应用，先去控制台创建一个。
 * @localEn No apps yet. Create one in the console first.
 */
export const PAGE_OAUTH_PLAYGROUND_NO_CLIENTS =
  'page_oauth_playground:no__clients';

/**
 * @description Link to the developer console
 * @localZh 去控制台
 * @localEn Open console
 */
export const PAGE_OAUTH_PLAYGROUND_GO_CONSOLE =
  'page_oauth_playground:go__console';

/**
 * @description Placeholder for optional inputs
 * @localZh 可选
 * @localEn Optional
 */
export const PAGE_OAUTH_PLAYGROUND_OPTIONAL = 'page_oauth_playground:optional';

/**
 * @description Generate a random state
 * @localZh 随机
 * @localEn Random
 */
export const PAGE_OAUTH_PLAYGROUND_RANDOM = 'page_oauth_playground:random';

/**
 * @description PKCE pill for public clients
 * @localZh 公共客户端必须使用
 * @localEn Required for public clients
 */
export const PAGE_OAUTH_PLAYGROUND_PKCE_REQUIRED =
  'page_oauth_playground:pkce__required';

/**
 * @description PKCE switch for confidential clients
 * @localZh 同时测试 PKCE
 * @localEn Also test PKCE
 */
export const PAGE_OAUTH_PLAYGROUND_PKCE_OPTIONAL =
  'page_oauth_playground:pkce__optional';

/**
 * @description Regenerate PKCE values
 * @localZh 重新生成
 * @localEn Regenerate
 */
export const PAGE_OAUTH_PLAYGROUND_REGEN = 'page_oauth_playground:regen';

/**
 * @description Validate parameters button
 * @localZh 校验参数
 * @localEn Validate
 */
export const PAGE_OAUTH_PLAYGROUND_VALIDATE = 'page_oauth_playground:validate';

/**
 * @description Validation passed
 * @localZh 参数有效，可以进行授权。
 * @localEn Parameters are valid. You can continue.
 */
export const PAGE_OAUTH_PLAYGROUND_VALID_OK = 'page_oauth_playground:valid__ok';

/**
 * @description Authorization URL label
 * @localZh 授权 URL（真实参数）
 * @localEn Authorization URL (real parameters)
 */
export const PAGE_OAUTH_PLAYGROUND_AUTH_URL = 'page_oauth_playground:auth__url';

/**
 * @description Mini consent card — hint under the app name
 * @localZh 请求访问你的账号
 * @localEn wants to access your account
 */
export const PAGE_OAUTH_PLAYGROUND_CONSENT_SUB =
  'page_oauth_playground:consent__sub';

/**
 * @description Simulate deny button
 * @localZh 模拟拒绝
 * @localEn Simulate deny
 */
export const PAGE_OAUTH_PLAYGROUND_DENY = 'page_oauth_playground:deny';

/**
 * @description Simulate allow button
 * @localZh 模拟允许
 * @localEn Simulate allow
 */
export const PAGE_OAUTH_PLAYGROUND_ALLOW = 'page_oauth_playground:allow';

/**
 * @description Callback result label
 * @localZh 回调结果（未跳转）
 * @localEn Callback result (no redirect)
 */
export const PAGE_OAUTH_PLAYGROUND_CALLBACK = 'page_oauth_playground:callback';

/**
 * @description Shown after a simulated deny
 * @localZh 用户拒绝了授权（access_denied），流程到此结束。可以在上一步点「修改」重新授权。
 * @localEn The user denied access (access_denied), so the flow ends here. Use Change on the previous step to try again.
 */
export const PAGE_OAUTH_PLAYGROUND_DENIED_NOTE =
  'page_oauth_playground:denied__note';

/**
 * @description Token step hint when PKCE is on
 * @localZh 已开启 PKCE，换取令牌时会自动提交 code_verifier，不需要 client_secret。
 * @localEn PKCE is on: code_verifier is sent automatically and no client_secret is needed.
 */
export const PAGE_OAUTH_PLAYGROUND_VERIFIER_NOTE =
  'page_oauth_playground:verifier__note';

/**
 * @description Exchange token button
 * @localZh 换取令牌
 * @localEn Exchange for token
 */
export const PAGE_OAUTH_PLAYGROUND_EXCHANGE = 'page_oauth_playground:exchange';

/**
 * @description Token response label
 * @localZh 令牌响应
 * @localEn Token response
 */
export const PAGE_OAUTH_PLAYGROUND_TOKEN_RESP =
  'page_oauth_playground:token__resp';

/**
 * @description Request userinfo button
 * @localZh 请求用户信息
 * @localEn Request user info
 */
export const PAGE_OAUTH_PLAYGROUND_FETCH_USER =
  'page_oauth_playground:fetch__user';

/**
 * @description Userinfo response label
 * @localZh 用户信息响应
 * @localEn User info response
 */
export const PAGE_OAUTH_PLAYGROUND_USER_RESP =
  'page_oauth_playground:user__resp';

/**
 * @description Flow finished
 * @localZh 流程完成，可以把这些参数用到你的应用里了。
 * @localEn Done. You can use these parameters in your app.
 */
export const PAGE_OAUTH_PLAYGROUND_ALL_DONE = 'page_oauth_playground:all__done';

/**
 * @description Bottom note
 * @localZh 只在站内模拟回调，不会跳转到外部 redirect_uri。
 * @localEn Callbacks are simulated on this site; nothing is sent to your redirect_uri.
 */
export const PAGE_OAUTH_PLAYGROUND_FOOT_NOTE =
  'page_oauth_playground:foot__note';

/**
 * @description Copy button label
 * @localZh 复制
 * @localEn Copy
 */
export const PAGE_OAUTH_PLAYGROUND_COPY = 'page_oauth_playground:copy';

/**
 * @description Toast after copying
 * @localZh 已复制
 * @localEn Copied
 */
export const PAGE_OAUTH_PLAYGROUND_COPIED = 'page_oauth_playground:copied';

/**
 * @description Close the error banner
 * @localZh 关闭
 * @localEn Close
 */
export const PAGE_OAUTH_PLAYGROUND_CLOSE = 'page_oauth_playground:close';

/**
 * @description Error prefix — loading clients
 * @localZh 加载客户端失败
 * @localEn Could not load clients
 */
export const PAGE_OAUTH_PLAYGROUND_ERR_LOAD_CLIENTS =
  'page_oauth_playground:err__load_clients';

/**
 * @description Error prefix — validation
 * @localZh 参数校验失败
 * @localEn Validation failed
 */
export const PAGE_OAUTH_PLAYGROUND_ERR_VALIDATE =
  'page_oauth_playground:err__validate';

/**
 * @description Error prefix — consent
 * @localZh 授权失败
 * @localEn Consent failed
 */
export const PAGE_OAUTH_PLAYGROUND_ERR_CONSENT =
  'page_oauth_playground:err__consent';

/**
 * @description Error prefix — token exchange
 * @localZh 换取令牌失败
 * @localEn Token exchange failed
 */
export const PAGE_OAUTH_PLAYGROUND_ERR_TOKEN =
  'page_oauth_playground:err__token';

/**
 * @description Error prefix — userinfo
 * @localZh 读取用户信息失败
 * @localEn User info failed
 */
export const PAGE_OAUTH_PLAYGROUND_ERR_USERINFO =
  'page_oauth_playground:err__userinfo';

/**
 * @description Error — invalid_request
 * @localZh 缺少必填参数或参数格式不对
 * @localEn a required parameter is missing or malformed
 */
export const PAGE_OAUTH_PLAYGROUND_ERR_INVALID_REQUEST =
  'page_oauth_playground:err__invalid_request';

/**
 * @description Error — invalid_client
 * @localZh client_secret 不正确或客户端认证失败
 * @localEn wrong client_secret or client authentication failed
 */
export const PAGE_OAUTH_PLAYGROUND_ERR_INVALID_CLIENT =
  'page_oauth_playground:err__invalid_client';

/**
 * @description Error — invalid_grant
 * @localZh 授权码无效、已过期或已使用，或 code_verifier 不匹配
 * @localEn the code is invalid, expired or used, or code_verifier does not match
 */
export const PAGE_OAUTH_PLAYGROUND_ERR_INVALID_GRANT =
  'page_oauth_playground:err__invalid_grant';

/**
 * @description Error — unauthorized_client
 * @localZh 应用不存在、已停用，或不允许这种授权方式
 * @localEn the app does not exist, is disabled, or cannot use this grant
 */
export const PAGE_OAUTH_PLAYGROUND_ERR_UNAUTHORIZED_CLIENT =
  'page_oauth_playground:err__unauthorized_client';

/**
 * @description Error — redirect_uri not registered
 * @localZh redirect_uri 不在应用的白名单内
 * @localEn redirect_uri is not registered on the app
 */
export const PAGE_OAUTH_PLAYGROUND_ERR_REDIRECT =
  'page_oauth_playground:err__redirect';

/**
 * @description Error — invalid_scope
 * @localZh scope 无效或超出应用允许的范围
 * @localEn the scope is invalid or not allowed for this app
 */
export const PAGE_OAUTH_PLAYGROUND_ERR_INVALID_SCOPE =
  'page_oauth_playground:err__invalid_scope';

/**
 * @description Error — invalid_token
 * @localZh access_token 无效或已过期
 * @localEn the access_token is invalid or expired
 */
export const PAGE_OAUTH_PLAYGROUND_ERR_INVALID_TOKEN =
  'page_oauth_playground:err__invalid_token';

/**
 * @description Error — unsupported response or grant type
 * @localZh 不支持的 response_type 或 grant_type
 * @localEn unsupported response_type or grant_type
 */
export const PAGE_OAUTH_PLAYGROUND_ERR_UNSUPPORTED =
  'page_oauth_playground:err__unsupported';

/**
 * @description Error — access_denied
 * @localZh 用户拒绝了授权
 * @localEn the user denied access
 */
export const PAGE_OAUTH_PLAYGROUND_ERR_ACCESS_DENIED =
  'page_oauth_playground:err__access_denied';

/**
 * @description Error — server_error
 * @localZh 服务暂时不可用，请稍后重试
 * @localEn the service is unavailable, try again later
 */
export const PAGE_OAUTH_PLAYGROUND_ERR_SERVER =
  'page_oauth_playground:err__server';

/**
 * @description Error — anything else
 * @localZh 请求失败，请稍后重试
 * @localEn the request failed, try again later
 */
export const PAGE_OAUTH_PLAYGROUND_ERR_UNKNOWN =
  'page_oauth_playground:err__unknown';
