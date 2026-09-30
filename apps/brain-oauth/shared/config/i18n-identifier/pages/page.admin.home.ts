/**
 * Brain OAuth admin — shared shell and overview identifiers (`admin_home` namespace).
 * Loaded on every admin page for the side nav, pager and common labels.
 */

/**
 * @description Brain OAuth admin — overview document title
 * @localZh 概览
 * @localEn Overview
 */
export const ADMIN_HOME_TITLE = 'admin_home:title';

/**
 * @description Brain OAuth admin — overview description (admins)
 * @localZh 站点运行情况一览
 * @localEn How the site is doing
 */
export const ADMIN_HOME_DESCRIPTION = 'admin_home:description';

/**
 * @description Brain OAuth admin — overview description (non-admins)
 * @localZh 你的应用运行情况一览
 * @localEn How your apps are doing
 */
export const ADMIN_HOME_DESCRIPTION_OWN = 'admin_home:description__own';

/**
 * @description Brain OAuth admin — overview SEO keywords
 * @localZh 管理后台, 概览, 统计
 * @localEn admin, overview, stats
 */
export const ADMIN_HOME_KEYWORDS = 'admin_home:keywords';

/**
 * @description Brain OAuth admin — side nav label
 * @localZh 菜单
 * @localEn Menu
 */
export const ADMIN_HOME_SHELL_MENU = 'admin_home:shell__menu';

/**
 * @description Brain OAuth admin — tag on admin-only nav items
 * @localZh 管理员
 * @localEn Admin
 */
export const ADMIN_HOME_SHELL_ADMIN_TAG = 'admin_home:shell__admin_tag';

/**
 * @description Brain OAuth admin — admin-only page shown to a normal user
 * @localZh 没有权限访问这个页面
 * @localEn You don't have access to this page
 */
export const ADMIN_HOME_SHELL_FORBIDDEN = 'admin_home:shell__forbidden';

/**
 * @description Brain OAuth admin — refresh list button
 * @localZh 刷新
 * @localEn Refresh
 */
export const ADMIN_HOME_SHELL_REFRESH = 'admin_home:shell__refresh';

/**
 * @description Brain OAuth admin — toast after refreshing a list
 * @localZh 已刷新
 * @localEn Refreshed
 */
export const ADMIN_HOME_SHELL_REFRESHED = 'admin_home:shell__refreshed';

/**
 * @description Brain OAuth admin — filter chip for no filter
 * @localZh 全部
 * @localEn All
 */
export const ADMIN_HOME_SHELL_ALL = 'admin_home:shell__all';

/**
 * @description Brain OAuth admin — list load error
 * @localZh 加载失败，请稍后重试
 * @localEn Failed to load. Please try again later.
 */
export const ADMIN_HOME_SHELL_LOAD_FAILED = 'admin_home:shell__load_failed';

/**
 * @description Brain OAuth admin — close dialog button
 * @localZh 关闭
 * @localEn Close
 */
export const ADMIN_HOME_SHELL_CLOSE = 'admin_home:shell__close';

/**
 * @description Brain OAuth admin — row details button
 * @localZh 详情
 * @localEn Details
 */
export const ADMIN_HOME_SHELL_DETAIL = 'admin_home:shell__detail';

/**
 * @description Brain OAuth admin — copy button label
 * @localZh 复制
 * @localEn Copy
 */
export const ADMIN_HOME_SHELL_COPY = 'admin_home:shell__copy';

/**
 * @description Brain OAuth admin — toast after copying
 * @localZh 已复制
 * @localEn Copied
 */
export const ADMIN_HOME_SHELL_COPIED = 'admin_home:shell__copied';

/**
 * @description Brain OAuth admin — pager range, placeholders {from} {to} {total}
 * @localZh {from}–{to} / {total}
 * @localEn {from}–{to} of {total}
 */
export const ADMIN_HOME_SHELL_RANGE = 'admin_home:shell__range';

/**
 * @description Brain OAuth admin — pager page size label
 * @localZh 每页
 * @localEn per page
 */
export const ADMIN_HOME_SHELL_PER_PAGE = 'admin_home:shell__per_page';

/**
 * @description Brain OAuth admin — pager previous button
 * @localZh 上一页
 * @localEn Previous page
 */
export const ADMIN_HOME_SHELL_PREV_PAGE = 'admin_home:shell__prev_page';

/**
 * @description Brain OAuth admin — pager next button
 * @localZh 下一页
 * @localEn Next page
 */
export const ADMIN_HOME_SHELL_NEXT_PAGE = 'admin_home:shell__next_page';

/**
 * @description Brain OAuth admin — sign-in method phone_otp
 * @localZh 手机验证码
 * @localEn Phone code
 */
export const ADMIN_HOME_SHELL_LOGIN_PHONE_OTP =
  'admin_home:shell__login_phone_otp';

/**
 * @description Brain OAuth admin — sign-in method password
 * @localZh 邮箱密码
 * @localEn Email & password
 */
export const ADMIN_HOME_SHELL_LOGIN_PASSWORD =
  'admin_home:shell__login_password';

/**
 * @description Brain OAuth admin — stat card: registered users
 * @localZh 注册用户
 * @localEn Users
 */
export const ADMIN_HOME_STAT_USERS = 'admin_home:stat__users';

/**
 * @description Brain OAuth admin — stat card: new users this week, placeholder {n}
 * @localZh 本周新增 {n}
 * @localEn +{n} this week
 */
export const ADMIN_HOME_STAT_USERS_TREND = 'admin_home:stat__users_trend';

/**
 * @description Brain OAuth admin — stat card: OAuth apps
 * @localZh OAuth 应用
 * @localEn OAuth apps
 */
export const ADMIN_HOME_STAT_APPS = 'admin_home:stat__apps';

/**
 * @description Brain OAuth admin — stat card: public clients, placeholder {n}
 * @localZh 其中公共客户端 {n} 个
 * @localEn {n} public clients
 */
export const ADMIN_HOME_STAT_APPS_TREND = 'admin_home:stat__apps_trend';

/**
 * @description Brain OAuth admin — stat card: authorizations today
 * @localZh 今日授权
 * @localEn Authorizations today
 */
export const ADMIN_HOME_STAT_AUTH = 'admin_home:stat__auth';

/**
 * @description Brain OAuth admin — stat card: failure rate today
 * @localZh 今日失败率
 * @localEn Failure rate today
 */
export const ADMIN_HOME_STAT_FAIL = 'admin_home:stat__fail';

/**
 * @description Brain OAuth admin — stat card trend, placeholder {delta}
 * @localZh 较昨日 {delta}
 * @localEn {delta} vs yesterday
 */
export const ADMIN_HOME_STAT_VS_YESTERDAY = 'admin_home:stat__vs_yesterday';

/**
 * @description Brain OAuth admin — stat card trend without data
 * @localZh 昨日无数据
 * @localEn No data yesterday
 */
export const ADMIN_HOME_STAT_NO_COMPARE = 'admin_home:stat__no_compare';

/**
 * @description Brain OAuth admin — bar chart title
 * @localZh 近 7 天授权次数
 * @localEn Authorizations, last 7 days
 */
export const ADMIN_HOME_CHART_TITLE = 'admin_home:chart__title';

/**
 * @description Brain OAuth admin — bar chart subtitle
 * @localZh 按天统计
 * @localEn Daily
 */
export const ADMIN_HOME_CHART_SUB = 'admin_home:chart__sub';

/**
 * @description Brain OAuth admin — recent requests card title
 * @localZh 最近请求
 * @localEn Recent requests
 */
export const ADMIN_HOME_RECENT_TITLE = 'admin_home:recent__title';

/**
 * @description Brain OAuth admin — link to request logs
 * @localZh 查看全部
 * @localEn View all
 */
export const ADMIN_HOME_RECENT_VIEW_ALL = 'admin_home:recent__view_all';

/**
 * @description Brain OAuth admin — recent requests empty state
 * @localZh 暂无请求记录
 * @localEn No requests yet
 */
export const ADMIN_HOME_RECENT_EMPTY = 'admin_home:recent__empty';
