/**
 * Brain OAuth — integration docs page identifiers (`page_docs_oauth` namespace).
 * Developer guide for third-party apps using Brain user OAuth 2.0.
 */

/**
 * @description Brain OAuth docs — page title
 * @localZh OAuth 集成文档
 * @localEn OAuth integration guide
 */
export const PAGE_DOCS_OAUTH_TITLE = 'page_docs_oauth:title';

/**
 * @description Brain OAuth docs — meta description
 * @localZh Brain OAuth 授权码流程、端点参数与 PKCE 说明
 * @localEn Authorization code flow, endpoint parameters, and PKCE for Brain OAuth
 */
export const PAGE_DOCS_OAUTH_DESCRIPTION = 'page_docs_oauth:description';

/**
 * @description Brain OAuth docs — content label
 * @localZh OAuth 文档
 * @localEn OAuth docs
 */
export const PAGE_DOCS_OAUTH_CONTENT = 'page_docs_oauth:content';

/**
 * @description Brain OAuth docs — SEO keywords
 * @localZh OAuth 2.0, 授权码, PKCE, token, userinfo
 * @localEn OAuth 2.0, authorization code, PKCE, token, userinfo
 */
export const PAGE_DOCS_OAUTH_KEYWORDS = 'page_docs_oauth:keywords';

/**
 * @description Header subtitle next to the logo
 * @localZh 集成文档
 * @localEn Docs
 */
export const PAGE_DOCS_OAUTH_HEADER_SUB = 'page_docs_oauth:header__sub';

/**
 * @description Subtitle under the page title
 * @localZh 注册客户端、引导用户授权、用授权码换取令牌并获取用户信息
 * @localEn Register a client, send users to consent, exchange the code for tokens and read the user profile
 */
export const PAGE_DOCS_OAUTH_DESC = 'page_docs_oauth:desc';

/**
 * @description Quick link card — playground title
 * @localZh 在站内测试完整流程
 * @localEn Try the full flow
 */
export const PAGE_DOCS_OAUTH_QUICK_PLAYGROUND =
  'page_docs_oauth:quick__playground';

/**
 * @description Quick link card — playground hint
 * @localZh 用真实参数走一遍授权、换票与 userinfo
 * @localEn Run authorize, token and userinfo with real parameters
 */
export const PAGE_DOCS_OAUTH_QUICK_PLAYGROUND_SUB =
  'page_docs_oauth:quick__playground_sub';

/**
 * @description Quick link card — OpenAPI title
 * @localZh OpenAPI 参考
 * @localEn OpenAPI reference
 */
export const PAGE_DOCS_OAUTH_QUICK_OPENAPI = 'page_docs_oauth:quick__openapi';

/**
 * @description Quick link card — OpenAPI hint
 * @localZh 所有端点的请求与响应定义
 * @localEn Request and response schemas for every endpoint
 */
export const PAGE_DOCS_OAUTH_QUICK_OPENAPI_SUB =
  'page_docs_oauth:quick__openapi_sub';

/**
 * @description Quick link card — console title
 * @localZh 管理 OAuth 应用
 * @localEn Manage OAuth apps
 */
export const PAGE_DOCS_OAUTH_QUICK_CONSOLE = 'page_docs_oauth:quick__console';

/**
 * @description Quick link card — console hint
 * @localZh 创建应用、配置回调地址、获取凭据
 * @localEn Create apps, set redirect URIs, get credentials
 */
export const PAGE_DOCS_OAUTH_QUICK_CONSOLE_SUB =
  'page_docs_oauth:quick__console_sub';

/**
 * @description Table of contents label
 * @localZh 目录
 * @localEn On this page
 */
export const PAGE_DOCS_OAUTH_TOC = 'page_docs_oauth:toc';

/**
 * @description Section title — overview
 * @localZh 概览
 * @localEn Overview
 */
export const PAGE_DOCS_OAUTH_SECTION_OVERVIEW =
  'page_docs_oauth:section__overview';

/**
 * @description Section title — flow
 * @localZh 授权码流程
 * @localEn Authorization code flow
 */
export const PAGE_DOCS_OAUTH_SECTION_FLOW = 'page_docs_oauth:section__flow';

/**
 * @description Section title — endpoints
 * @localZh 端点一览
 * @localEn Endpoints
 */
export const PAGE_DOCS_OAUTH_SECTION_ENDPOINTS =
  'page_docs_oauth:section__endpoints';

/**
 * @description Section title — authorization request
 * @localZh 授权请求
 * @localEn Authorization request
 */
export const PAGE_DOCS_OAUTH_SECTION_AUTHORIZE =
  'page_docs_oauth:section__authorize';

/**
 * @description Section title — token exchange
 * @localZh 令牌交换
 * @localEn Token exchange
 */
export const PAGE_DOCS_OAUTH_SECTION_TOKEN = 'page_docs_oauth:section__token';

/**
 * @description Section title — PKCE
 * @localZh PKCE
 * @localEn PKCE
 */
export const PAGE_DOCS_OAUTH_SECTION_PKCE = 'page_docs_oauth:section__pkce';

/**
 * @description Section title — user info
 * @localZh 用户信息
 * @localEn User info
 */
export const PAGE_DOCS_OAUTH_SECTION_USERINFO =
  'page_docs_oauth:section__userinfo';

/**
 * @description Section title — errors
 * @localZh 错误响应
 * @localEn Errors
 */
export const PAGE_DOCS_OAUTH_SECTION_ERRORS = 'page_docs_oauth:section__errors';

/**
 * @description Overview paragraph
 * @localZh Brain OAuth 实现 RFC 6749 授权码流程。第三方应用引导用户在 Brain 登录并同意授权，拿到授权码后在服务端换取 access_token，再用它读取用户信息。
 * @localEn Brain OAuth implements the RFC 6749 authorization code flow. Your app sends the user to sign in to Brain and approve access, exchanges the returned code for an access_token on your server, then reads the user profile.
 */
export const PAGE_DOCS_OAUTH_OVERVIEW_TEXT = 'page_docs_oauth:overview__text';

/**
 * @description Client type — confidential
 * @localZh 机密客户端
 * @localEn Confidential client
 */
export const PAGE_DOCS_OAUTH_CONFIDENTIAL = 'page_docs_oauth:confidential';

/**
 * @description Client type — confidential description
 * @localZh 有服务端，可以安全保存 client_secret；换票时用 client_secret 认证，PKCE 可选。
 * @localEn Has a backend that can keep client_secret safe. Authenticates with client_secret; PKCE is optional.
 */
export const PAGE_DOCS_OAUTH_CONFIDENTIAL_TEXT =
  'page_docs_oauth:confidential__text';

/**
 * @description Client type — public
 * @localZh 公共客户端
 * @localEn Public client
 */
export const PAGE_DOCS_OAUTH_PUBLIC = 'page_docs_oauth:public';

/**
 * @description Client type — public description
 * @localZh SPA、移动端等无法保存密钥的应用；没有 client_secret，必须使用 PKCE。
 * @localEn SPAs and mobile apps that cannot keep a secret. No client_secret; PKCE is required.
 */
export const PAGE_DOCS_OAUTH_PUBLIC_TEXT = 'page_docs_oauth:public__text';

/**
 * @description Flow step 1 title
 * @localZh 创建应用
 * @localEn Create an app
 */
export const PAGE_DOCS_OAUTH_FLOW1 = 'page_docs_oauth:flow1';

/**
 * @description Flow step 1 description
 * @localZh 在开发者控制台创建应用并配置 redirect_uri（必须 HTTPS，localhost 除外）。
 * @localEn Create an app in the developer console and set redirect_uri (HTTPS, except localhost).
 */
export const PAGE_DOCS_OAUTH_FLOW1_DESC = 'page_docs_oauth:flow1__desc';

/**
 * @description Flow step 2 title
 * @localZh 跳转授权
 * @localEn Redirect to authorize
 */
export const PAGE_DOCS_OAUTH_FLOW2 = 'page_docs_oauth:flow2';

/**
 * @description Flow step 2 description
 * @localZh 把用户重定向到 /oauth/authorize，带上 client_id、redirect_uri 和 state。
 * @localEn Send the user to /oauth/authorize with client_id, redirect_uri and state.
 */
export const PAGE_DOCS_OAUTH_FLOW2_DESC = 'page_docs_oauth:flow2__desc';

/**
 * @description Flow step 3 title
 * @localZh 用户同意
 * @localEn User approves
 */
export const PAGE_DOCS_OAUTH_FLOW3 = 'page_docs_oauth:flow3';

/**
 * @description Flow step 3 description
 * @localZh 用户登录并同意后，浏览器带着 ?code=…&state=… 回到 redirect_uri。
 * @localEn After sign-in and consent the browser returns to redirect_uri with ?code=…&state=….
 */
export const PAGE_DOCS_OAUTH_FLOW3_DESC = 'page_docs_oauth:flow3__desc';

/**
 * @description Flow step 4 title
 * @localZh 换取令牌
 * @localEn Exchange the code
 */
export const PAGE_DOCS_OAUTH_FLOW4 = 'page_docs_oauth:flow4';

/**
 * @description Flow step 4 description
 * @localZh 服务端用授权码调用 /oauth/token，获得 access_token 和 refresh_token。
 * @localEn Your server calls /oauth/token with the code to get access_token and refresh_token.
 */
export const PAGE_DOCS_OAUTH_FLOW4_DESC = 'page_docs_oauth:flow4__desc';

/**
 * @description Flow step 5 title
 * @localZh 读取用户
 * @localEn Read the user
 */
export const PAGE_DOCS_OAUTH_FLOW5 = 'page_docs_oauth:flow5';

/**
 * @description Flow step 5 description
 * @localZh 带上 Bearer access_token 调用 /oauth/userinfo。
 * @localEn Call /oauth/userinfo with the Bearer access_token.
 */
export const PAGE_DOCS_OAUTH_FLOW5_DESC = 'page_docs_oauth:flow5__desc';

/**
 * @description Table header — method
 * @localZh 方法
 * @localEn Method
 */
export const PAGE_DOCS_OAUTH_TH_METHOD = 'page_docs_oauth:th__method';

/**
 * @description Table header — path
 * @localZh 路径
 * @localEn Path
 */
export const PAGE_DOCS_OAUTH_TH_PATH = 'page_docs_oauth:th__path';

/**
 * @description Table header — caller
 * @localZh 调用方
 * @localEn Caller
 */
export const PAGE_DOCS_OAUTH_TH_CALLER = 'page_docs_oauth:th__caller';

/**
 * @description Table header — notes
 * @localZh 说明
 * @localEn Notes
 */
export const PAGE_DOCS_OAUTH_TH_NOTE = 'page_docs_oauth:th__note';

/**
 * @description Table header — parameter
 * @localZh 参数
 * @localEn Parameter
 */
export const PAGE_DOCS_OAUTH_TH_PARAM = 'page_docs_oauth:th__param';

/**
 * @description Table header — required
 * @localZh 必填
 * @localEn Required
 */
export const PAGE_DOCS_OAUTH_TH_REQUIRED = 'page_docs_oauth:th__required';

/**
 * @description Table header — error code
 * @localZh 错误码
 * @localEn Error
 */
export const PAGE_DOCS_OAUTH_TH_CODE = 'page_docs_oauth:th__code';

/**
 * @description Table header — where the error appears
 * @localZh 出现位置
 * @localEn Where
 */
export const PAGE_DOCS_OAUTH_TH_WHERE = 'page_docs_oauth:th__where';

/**
 * @description Endpoint caller — browser
 * @localZh 浏览器
 * @localEn Browser
 */
export const PAGE_DOCS_OAUTH_CALLER_BROWSER = 'page_docs_oauth:caller__browser';

/**
 * @description Endpoint caller — server
 * @localZh 服务端
 * @localEn Server
 */
export const PAGE_DOCS_OAUTH_CALLER_SERVER = 'page_docs_oauth:caller__server';

/**
 * @description Endpoint note — authorize
 * @localZh 展示授权确认页；未登录会先跳转登录，登录后回到本地址。
 * @localEn Shows the consent page. Guests sign in first and come back here.
 */
export const PAGE_DOCS_OAUTH_ENDPOINT_AUTHORIZE =
  'page_docs_oauth:endpoint__authorize';

/**
 * @description Endpoint note — token
 * @localZh 用授权码或 refresh_token 换取令牌；支持 Basic 认证或表单传 client_secret。
 * @localEn Exchange a code or refresh_token for tokens. Basic auth or client_secret in the form.
 */
export const PAGE_DOCS_OAUTH_ENDPOINT_TOKEN = 'page_docs_oauth:endpoint__token';

/**
 * @description Endpoint note — revoke
 * @localZh 吊销 access_token 或 refresh_token。
 * @localEn Revoke an access_token or refresh_token.
 */
export const PAGE_DOCS_OAUTH_ENDPOINT_REVOKE =
  'page_docs_oauth:endpoint__revoke';

/**
 * @description Endpoint note — userinfo
 * @localZh 需要 Authorization: Bearer；返回 sub、email、name 等信息。
 * @localEn Requires Authorization: Bearer. Returns sub, email, name and more.
 */
export const PAGE_DOCS_OAUTH_ENDPOINT_USERINFO =
  'page_docs_oauth:endpoint__userinfo';

/**
 * @description Authorization request paragraph
 * @localZh 把用户浏览器重定向到授权地址。redirect_uri 必须和应用里登记的完全一致。
 * @localEn Redirect the user's browser to the authorization URL. redirect_uri must exactly match one registered on the app.
 */
export const PAGE_DOCS_OAUTH_AUTHORIZE_TEXT = 'page_docs_oauth:authorize__text';

/**
 * @description Param pill — required
 * @localZh 必填
 * @localEn Required
 */
export const PAGE_DOCS_OAUTH_REQUIRED = 'page_docs_oauth:required';

/**
 * @description Param pill — optional
 * @localZh 可选
 * @localEn Optional
 */
export const PAGE_DOCS_OAUTH_OPTIONAL = 'page_docs_oauth:optional';

/**
 * @description Param pill — required for public clients
 * @localZh 公共客户端必填
 * @localEn Public clients
 */
export const PAGE_DOCS_OAUTH_PKCE_ONLY = 'page_docs_oauth:pkce__only';

/**
 * @description Param note — response_type
 * @localZh 固定为 code。
 * @localEn Always code.
 */
export const PAGE_DOCS_OAUTH_PARAM_RESPONSE_TYPE =
  'page_docs_oauth:param__response_type';

/**
 * @description Param note — client_id
 * @localZh 开发者控制台里的 Client ID。
 * @localEn The Client ID from the developer console.
 */
export const PAGE_DOCS_OAUTH_PARAM_CLIENT_ID =
  'page_docs_oauth:param__client_id';

/**
 * @description Param note — redirect_uri
 * @localZh 授权完成后回跳的地址，必须在应用的白名单内。
 * @localEn Where to return after consent. Must be on the app's allow list.
 */
export const PAGE_DOCS_OAUTH_PARAM_REDIRECT = 'page_docs_oauth:param__redirect';

/**
 * @description Param note — scope
 * @localZh 空格分隔，例如 openid profile。
 * @localEn Space separated, e.g. openid profile.
 */
export const PAGE_DOCS_OAUTH_PARAM_SCOPE = 'page_docs_oauth:param__scope';

/**
 * @description Param note — state
 * @localZh 随机字符串，回跳时原样带回，用来防止 CSRF。
 * @localEn A random string returned as is, to prevent CSRF.
 */
export const PAGE_DOCS_OAUTH_PARAM_STATE = 'page_docs_oauth:param__state';

/**
 * @description Param note — code_challenge
 * @localZh code_verifier 的 S256 摘要，同时传 code_challenge_method=S256。
 * @localEn The S256 digest of code_verifier, sent with code_challenge_method=S256.
 */
export const PAGE_DOCS_OAUTH_PARAM_CHALLENGE =
  'page_docs_oauth:param__challenge';

/**
 * @description Token exchange paragraph
 * @localZh 在服务端调用，不要在浏览器里暴露 client_secret。
 * @localEn Call this from your server. Never expose client_secret in the browser.
 */
export const PAGE_DOCS_OAUTH_TOKEN_TEXT = 'page_docs_oauth:token__text';

/**
 * @description Token tab — authorization code
 * @localZh 授权码换令牌
 * @localEn Authorization code
 */
export const PAGE_DOCS_OAUTH_TAB_CODE = 'page_docs_oauth:tab__code';

/**
 * @description Token tab — refresh token
 * @localZh 刷新令牌
 * @localEn Refresh token
 */
export const PAGE_DOCS_OAUTH_TAB_REFRESH = 'page_docs_oauth:tab__refresh';

/**
 * @description Code comment — confidential clients only
 * @localZh # 机密客户端
 * @localEn # confidential clients
 */
export const PAGE_DOCS_OAUTH_COMMENT_SECRET = 'page_docs_oauth:comment__secret';

/**
 * @description Code comment — when using PKCE
 * @localZh # 使用 PKCE 时
 * @localEn # when using PKCE
 */
export const PAGE_DOCS_OAUTH_COMMENT_VERIFIER =
  'page_docs_oauth:comment__verifier';

/**
 * @description Example response heading
 * @localZh 响应示例
 * @localEn Example response
 */
export const PAGE_DOCS_OAUTH_RESPONSE = 'page_docs_oauth:response';

/**
 * @description PKCE paragraph
 * @localZh 公共客户端必须使用 PKCE：先生成随机的 code_verifier，把它的 S256 摘要作为 code_challenge 放进授权请求，换令牌时再提交原始的 code_verifier。
 * @localEn Public clients must use PKCE: generate a random code_verifier, send its S256 digest as code_challenge in the authorization request, and submit the original code_verifier when exchanging the code.
 */
export const PAGE_DOCS_OAUTH_PKCE_TEXT = 'page_docs_oauth:pkce__text';

/**
 * @description PKCE note
 * @localZh 机密客户端也可以同时使用 PKCE，安全性更好。
 * @localEn Confidential clients can use PKCE too for extra protection.
 */
export const PAGE_DOCS_OAUTH_PKCE_NOTE = 'page_docs_oauth:pkce__note';

/**
 * @description User info paragraph
 * @localZh 成功时返回用户标识和资料；令牌无效或过期返回 401 和 error=invalid_token。
 * @localEn Returns the user id and profile. An invalid or expired token returns 401 with error=invalid_token.
 */
export const PAGE_DOCS_OAUTH_USERINFO_TEXT = 'page_docs_oauth:userinfo__text';

/**
 * @description Errors paragraph
 * @localZh 授权阶段的错误以 error、error_description 参数带回 redirect_uri；令牌和用户信息接口的错误以 JSON 返回。
 * @localEn Authorization errors come back to redirect_uri as error and error_description. Token and userinfo errors are returned as JSON.
 */
export const PAGE_DOCS_OAUTH_ERRORS_TEXT = 'page_docs_oauth:errors__text';

/**
 * @description Error location — all endpoints
 * @localZh 全部
 * @localEn All
 */
export const PAGE_DOCS_OAUTH_WHERE_ALL = 'page_docs_oauth:where__all';

/**
 * @description Error location — authorize
 * @localZh 授权
 * @localEn Authorize
 */
export const PAGE_DOCS_OAUTH_WHERE_AUTHORIZE =
  'page_docs_oauth:where__authorize';

/**
 * @description Error location — token
 * @localZh 令牌
 * @localEn Token
 */
export const PAGE_DOCS_OAUTH_WHERE_TOKEN = 'page_docs_oauth:where__token';

/**
 * @description Error location — userinfo
 * @localZh 用户信息
 * @localEn User info
 */
export const PAGE_DOCS_OAUTH_WHERE_USERINFO = 'page_docs_oauth:where__userinfo';

/**
 * @description Error note — invalid_request
 * @localZh 缺少必填参数或参数格式不对。
 * @localEn A required parameter is missing or malformed.
 */
export const PAGE_DOCS_OAUTH_ERROR_INVALID_REQUEST =
  'page_docs_oauth:error__invalid_request';

/**
 * @description Error note — unauthorized_client
 * @localZh 应用不存在、已停用，或者不允许这种授权方式。
 * @localEn The app does not exist, is disabled, or cannot use this grant.
 */
export const PAGE_DOCS_OAUTH_ERROR_UNAUTHORIZED =
  'page_docs_oauth:error__unauthorized';

/**
 * @description Error note — access_denied
 * @localZh 用户拒绝了授权。
 * @localEn The user denied access.
 */
export const PAGE_DOCS_OAUTH_ERROR_DENIED = 'page_docs_oauth:error__denied';

/**
 * @description Error note — invalid_scope
 * @localZh 请求的 scope 无效或超出应用允许的范围。
 * @localEn The requested scope is invalid or not allowed for this app.
 */
export const PAGE_DOCS_OAUTH_ERROR_SCOPE = 'page_docs_oauth:error__scope';

/**
 * @description Error note — invalid_client
 * @localZh 客户端认证失败，检查 client_id 和 client_secret。
 * @localEn Client authentication failed. Check client_id and client_secret.
 */
export const PAGE_DOCS_OAUTH_ERROR_CLIENT = 'page_docs_oauth:error__client';

/**
 * @description Error note — invalid_grant
 * @localZh 授权码无效、过期、已使用，或 code_verifier 不匹配。
 * @localEn The code is invalid, expired or used, or code_verifier does not match.
 */
export const PAGE_DOCS_OAUTH_ERROR_GRANT = 'page_docs_oauth:error__grant';

/**
 * @description Error note — invalid_token
 * @localZh access_token 无效或已过期。
 * @localEn The access_token is invalid or expired.
 */
export const PAGE_DOCS_OAUTH_ERROR_TOKEN = 'page_docs_oauth:error__token';

/**
 * @description Code block copy button label
 * @localZh 复制
 * @localEn Copy
 */
export const PAGE_DOCS_OAUTH_COPY = 'page_docs_oauth:copy';

/**
 * @description Toast after copying a code block
 * @localZh 已复制
 * @localEn Copied
 */
export const PAGE_DOCS_OAUTH_COPIED = 'page_docs_oauth:copied';
