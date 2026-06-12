/**
 * Brain OAuth — marketing home page identifiers (`page_home` namespace).
 * Public landing page for the Brain user OAuth 2.0 authorization service.
 */

/**
 * @description Brain OAuth home page — document title
 * @localZh Brain OAuth
 * @localEn Brain OAuth
 */
export const PAGE_HOME_TITLE = 'page_home:title';

/**
 * @description Home page meta description
 * @localZh 标准 OAuth 2.0 授权服务，Brain 身份认证中间层
 * @localEn Standard OAuth 2.0 authorization service, Brain identity middleware
 */
export const PAGE_HOME_DESCRIPTION = 'page_home:description';

/**
 * @description Home page keywords
 * @localZh OAuth 2.0, 身份认证, Brain OAuth
 * @localEn OAuth 2.0, identity, Brain OAuth
 */
export const PAGE_HOME_KEYWORDS = 'page_home:keywords';

/**
 * @description Home nav - Docs
 * @localZh 文档
 * @localEn Docs
 */
export const PAGE_HOME_NAV_DOCS = 'page_home:nav__docs';

/**
 * @description Home nav - About
 * @localZh 关于
 * @localEn About
 */
export const PAGE_HOME_NAV_ABOUT = 'page_home:nav__about';

/**
 * @description Hero badge label
 * @localZh OAuth 2.0 授权服务器
 * @localEn OAuth 2.0 Server
 */
export const PAGE_HOME_HERO_BADGE = 'page_home:hero__badge';

/**
 * @description Hero title line 1
 * @localZh Brain 身份认证
 * @localEn Brain Identity
 */
export const PAGE_HOME_HERO_TITLE1 = 'page_home:hero__title1';

/**
 * @description Hero title line 2
 * @localZh 中间层
 * @localEn Middleware
 */
export const PAGE_HOME_HERO_TITLE2 = 'page_home:hero__title2';

/**
 * @description Hero description
 * @localZh 标准 OAuth 2.0 协议，让第三方应用安全接入 Brain 用户体系。开发者自助注册应用，无需接触密码。
 * @localEn Standard OAuth 2.0 for secure third-party app integration. Self-service developer console, no password exposure.
 */
export const PAGE_HOME_HERO_DESC = 'page_home:hero__desc';

/**
 * @description Hero primary CTA
 * @localZh 开始使用
 * @localEn Get started
 */
export const PAGE_HOME_HERO_START = 'page_home:hero__start';

/**
 * @description Hero secondary CTA
 * @localZh 阅读文档
 * @localEn Read docs
 */
export const PAGE_HOME_HERO_DOCS = 'page_home:hero__docs';

/**
 * @description Feature 1 label
 * @localZh 标准 OAuth 2.0
 * @localEn Standard OAuth 2.0
 */
export const PAGE_HOME_FEATURE1_TITLE = 'page_home:feature1__title';

/**
 * @description Feature 2 label
 * @localZh 开发者自助控制台
 * @localEn Self-service Console
 */
export const PAGE_HOME_FEATURE2_TITLE = 'page_home:feature2__title';

/**
 * @description Feature 3 label
 * @localZh 无服务器部署
 * @localEn Serverless Ready
 */
export const PAGE_HOME_FEATURE3_TITLE = 'page_home:feature3__title';

/**
 * @description CTA section title
 * @localZh 准备好开始了吗？
 * @localEn Ready to build?
 */
export const PAGE_HOME_CTA_TITLE = 'page_home:cta__title';

/**
 * @description CTA section description
 * @localZh 创建你的第一个 OAuth 应用，只需几分钟。
 * @localEn Create your first OAuth app in minutes.
 */
export const PAGE_HOME_CTA_DESC = 'page_home:cta__desc';

/**
 * @description CTA button label
 * @localZh 前往控制台
 * @localEn Go to console
 */
export const PAGE_HOME_CTA_BUTTON = 'page_home:cta__button';

/**
 * @description Footer tagline
 * @localZh 标准 OAuth 2.0 授权服务
 * @localEn Standard OAuth 2.0 Authorization Service
 */
export const PAGE_HOME_FOOTER_TAGLINE = 'page_home:footer__tagline'; /**
 * @description API snippet login line note
 * @localZh 终端用户登录（示例 Provider）
 * @localEn End-user sign-in (example provider)
 */
export const PAGE_HOME_API_SNIPPET_LOGIN = 'page_home:api__snippet__login';
/**
 * @description Feature 1 description
 * @localZh shared/oauth-wrapper 实现 RFC 授权码、PKCE、换票与客户端管理，与具体登录 API 无关。
 * @localEn shared/oauth-wrapper implements RFC flows, PKCE, token exchange, and client registry—provider-agnostic.
 */
export const PAGE_HOME_FEATURE1_DESC = 'page_home:feature1__desc';

/**
 * @description Feature 2 description
 * @localZh 通过 OAuthUserAdapter 对接任意上游；本仓库 demo-oauth 目录提供参考实现。
 * @localEn Plug in any upstream via OAuthUserAdapter; this repo ships a reference under oauth-wrapper.
 */
export const PAGE_HOME_FEATURE2_DESC = 'page_home:feature2__desc';

/**
 * @description Feature 3 description
 * @localZh 自助注册 OAuth 应用、配置 redirect_uri，并用 Playground 在站内调试完整流程。
 * @localEn Register apps, manage redirect URIs, and debug the full flow in the Playground.
 */
export const PAGE_HOME_FEATURE3_DESC = 'page_home:feature3__desc';

/**
 * @description Architecture section title
 * @localZh 项目如何分层
 * @localEn How this repo is split
 */
export const PAGE_HOME_SECTION_ARCH_TITLE = 'page_home:section__arch__title';

/**
 * @description Architecture section body
 * @localZh shared/oauth-wrapper 是通用 OAuth 授权服务器逻辑；oauth-wrapper 是本示例的装配层（会话 cookie、登录编排、Supabase 仓储）。换登录 API 时主要替换 demo-oauth 中的 Provider 适配器并调整 IOC 绑定，内核尽量保持不变。
 * @localEn shared/oauth-wrapper is the reusable OAuth server core. oauth-wrapper is this example’s wiring (session cookie, login orchestration, Supabase repository). To use another login API, replace the provider adapter under demo-oauth and rebind IOC—the core stays stable.
 */
export const PAGE_HOME_SECTION_ARCH_BODY = 'page_home:section__arch__body';

/**
 * @description Demo deployment section title
 * @localZh 本示例部署：Brain User 登录
 * @localEn This deployment: Brain User login
 */
export const PAGE_HOME_SECTION_DEMO_TITLE = 'page_home:section__demo__title';

/**
 * @description Demo deployment section body
 * @localZh 当前运行的示例在 oauth-wrapper 中接入了 Brain User API（BrainUserAdapter），环境变量 OAUTH_WRAPPER_API_BASE 指向上游地址。这只是演示一种 Provider；你的 fork 可以换成 Keycloak、自建 REST 等，无需修改 OAuth 协议面。
 * @localEn This running example uses Brain User API via BrainUserAdapter under oauth-wrapper (see OAUTH_WRAPPER_API_BASE). It is one reference provider—your fork can swap in Keycloak, a custom REST API, etc., without changing the OAuth surface.
 */
export const PAGE_HOME_SECTION_DEMO_BODY = 'page_home:section__demo__body';

/**
 * @description API snippet section title
 * @localZh 主要端点
 * @localEn Key endpoints
 */
export const PAGE_HOME_API_SNIPPET_TITLE = 'page_home:api__snippet__title';
