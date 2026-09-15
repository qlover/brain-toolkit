/**
 * @description Admin roles page title
 * @localZh 角色管理
 * @localEn Role management
 */
export const ADMIN_ROLES_TITLE = 'admin_roles:title';

/**
 * @description Admin roles page description
 * @localZh 选择左侧角色，勾选并保存其 API 权限
 * @localEn Select a role on the left, then edit and save its API permissions
 */
export const ADMIN_ROLES_DESCRIPTION = 'admin_roles:description';

/**
 * @description Admin roles page keywords
 * @localZh 角色,权限,RBAC
 * @localEn roles,permissions,RBAC
 */
export const ADMIN_ROLES_KEYWORDS = 'admin_roles:keywords';

/**
 * @description System roles section heading
 * @localZh 系统角色
 * @localEn System roles
 */
export const ADMIN_ROLES_SECTION_SYSTEM = 'admin_roles:section__system';

/**
 * @description Team roles section heading
 * @localZh 团队角色
 * @localEn Team roles
 */
export const ADMIN_ROLES_SECTION_ORG = 'admin_roles:section__org';

/**
 * @description Permission catalog column / label
 * @localZh 权限
 * @localEn Permission
 */
export const ADMIN_ROLES_PERMISSION_LABEL = 'admin_roles:permission__label';

/**
 * @description Selected permission count prefix (append number in UI; no ICU vars)
 * @localZh 已选
 * @localEn Selected
 */
export const ADMIN_ROLES_SELECTED_COUNT = 'admin_roles:selected__count';

/**
 * @description Granted permissions section heading
 * @localZh 已授权
 * @localEn Granted
 */
export const ADMIN_ROLES_SECTION_GRANTED = 'admin_roles:section__granted';

/**
 * @description Available (unchecked) permissions section heading
 * @localZh 未授权
 * @localEn Not granted
 */
export const ADMIN_ROLES_SECTION_AVAILABLE = 'admin_roles:section__available';

/**
 * @description Hint under platform role editor
 * @localZh 自己的项目按项目所有者鉴权，权限模板是「团队所有者」，不是「普通用户」。普通用户只配平台能力（创建团队、后台）。
 * @localEn Own projects are authorized as project owner using the Team owner template, not User. The user role only covers platform capabilities (create teams, admin console).
 */
export const ADMIN_ROLES_HINT_PLATFORM = 'admin_roles:hint__platform';

/**
 * @description Hint under team role editor
 * @localZh 自己的项目 = 团队所有者权限。这里改的是加入别人团队后的角色。
 * @localEn Own projects use Team owner. This template is for membership in someone else's team.
 */
export const ADMIN_ROLES_HINT_TEAM = 'admin_roles:hint__team';

/**
 * @description Save role assignments button
 * @localZh 保存权限
 * @localEn Save permissions
 */
export const ADMIN_ROLES_SAVE = 'admin_roles:save';

/**
 * @description Saving state
 * @localZh 保存中…
 * @localEn Saving…
 */
export const ADMIN_ROLES_SAVING = 'admin_roles:saving';

/**
 * @description Load failed message
 * @localZh 加载角色失败
 * @localEn Failed to load roles
 */
export const ADMIN_ROLES_LOAD_FAILED = 'admin_roles:load_failed';

/**
 * @description Save failed message
 * @localZh 保存失败
 * @localEn Save failed
 */
export const ADMIN_ROLES_SAVE_FAILED = 'admin_roles:save_failed';

/**
 * @description Save success message
 * @localZh 已保存
 * @localEn Saved
 */
export const ADMIN_ROLES_SAVE_SUCCESS = 'admin_roles:save_success';

/**
 * @description Empty catalog
 * @localZh 暂无权限目录，请先执行 SQL 种子
 * @localEn No permission catalog; run SQL seeds first
 */
export const ADMIN_ROLES_EMPTY = 'admin_roles:empty';

/**
 * @description System role label: user
 * @localZh 普通用户
 * @localEn User
 */
export const ADMIN_ROLES_SYSTEM_USER = 'admin_roles:system__user';

/**
 * @description System role label: operator
 * @localZh 运营
 * @localEn Operator
 */
export const ADMIN_ROLES_SYSTEM_OPERATOR = 'admin_roles:system__operator';

/**
 * @description System role label: admin
 * @localZh 管理员
 * @localEn Admin
 */
export const ADMIN_ROLES_SYSTEM_ADMIN = 'admin_roles:system__admin';

/**
 * @description Team role label: member
 * @localZh 团队成员
 * @localEn Team member
 */
export const ADMIN_ROLES_ORG_MEMBER = 'admin_roles:org__member';

/**
 * @description Team role label: admin
 * @localZh 团队管理员
 * @localEn Team admin
 */
export const ADMIN_ROLES_ORG_ADMIN = 'admin_roles:org__admin';

/**
 * @description Team role label: owner
 * @localZh 团队所有者
 * @localEn Team owner
 */
export const ADMIN_ROLES_ORG_OWNER = 'admin_roles:org__owner';
