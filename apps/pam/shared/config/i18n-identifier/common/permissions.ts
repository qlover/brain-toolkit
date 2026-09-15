/**
 * Permission catalog labels. Key = `permission:{permission_key}`.
 * description 仅存 DB；UI 用本文件翻译。
 */

/**
 * @description List platform users
 * @localZh 列出平台用户
 * @localEn List platform users
 */
export const PERMISSION_ADMIN_USERS_READ = 'permission:admin_users_read';

/**
 * @description Set platform admin / system role (legacy)
 * @localZh 设置平台管理员 / 系统角色（旧接口）
 * @localEn Set platform admin / system role (legacy)
 */
export const PERMISSION_ADMIN_USERS_PLATFORM_ADMIN =
  'permission:admin_users_platform_admin';

/**
 * @description Set system role user|operator|admin
 * @localZh 设置系统角色（普通用户 / 运营 / 管理员）
 * @localEn Set system role user|operator|admin
 */
export const PERMISSION_ADMIN_USERS_SYSTEM_ROLE =
  'permission:admin_users_system_role';

/**
 * @description List role permission catalog and assignments
 * @localZh 查看角色权限目录与授权
 * @localEn List role permission catalog and assignments
 */
export const PERMISSION_ADMIN_ROLES_READ = 'permission:admin_roles_read';

/**
 * @description Replace role → permission assignments
 * @localZh 编辑角色权限授权
 * @localEn Replace role → permission assignments
 */
export const PERMISSION_ADMIN_ROLES_WRITE = 'permission:admin_roles_write';

/**
 * @description List permission catalog (super admin)
 * @localZh 查看权限目录
 * @localEn List permission catalog
 */
export const PERMISSION_ADMIN_PERMISSIONS_READ =
  'permission:admin_permissions_read';

/**
 * @description Create or update permission catalog (super admin)
 * @localZh 创建或修改权限目录
 * @localEn Create or update permission catalog
 */
export const PERMISSION_ADMIN_PERMISSIONS_WRITE =
  'permission:admin_permissions_write';

/**
 * @description Read request audit logs
 * @localZh 查看请求审计日志
 * @localEn Read request audit logs
 */
export const PERMISSION_ADMIN_REQUEST_LOGS_READ =
  'permission:admin_request_logs_read';

/**
 * @description List phone OTP records
 * @localZh 查看手机验证码记录
 * @localEn List phone OTP records
 */
export const PERMISSION_ADMIN_PHONE_OTPS_READ =
  'permission:admin_phone_otps_read';

/**
 * @description Read site settings
 * @localZh 查看站点设置
 * @localEn Read site settings
 */
export const PERMISSION_ADMIN_SITE_SETTINGS_READ =
  'permission:admin_site_settings_read';

/**
 * @description Update site settings
 * @localZh 更新站点设置
 * @localEn Update site settings
 */
export const PERMISSION_ADMIN_SITE_SETTINGS_WRITE =
  'permission:admin_site_settings_write';

/**
 * @description List project collaborators
 * @localZh 查看项目协作者
 * @localEn List project collaborators
 */
export const PERMISSION_PAM_COLLABORATORS_READ =
  'permission:pam_collaborators_read';

/**
 * @description Add project collaborator
 * @localZh 添加项目协作者
 * @localEn Add project collaborator
 */
export const PERMISSION_PAM_COLLABORATORS_CREATE =
  'permission:pam_collaborators_create';

/**
 * @description Update collaborator role
 * @localZh 更新协作者角色
 * @localEn Update collaborator role
 */
export const PERMISSION_PAM_COLLABORATORS_UPDATE =
  'permission:pam_collaborators_update';

/**
 * @description Remove collaborator
 * @localZh 移除协作者
 * @localEn Remove collaborator
 */
export const PERMISSION_PAM_COLLABORATORS_DELETE =
  'permission:pam_collaborators_delete';

/**
 * @description List project environments
 * @localZh 查看环境列表
 * @localEn List project environments
 */
export const PERMISSION_PAM_ENVIRONMENTS_READ =
  'permission:pam_environments_read';

/**
 * @description Create environment
 * @localZh 创建环境
 * @localEn Create environment
 */
export const PERMISSION_PAM_ENVIRONMENTS_CREATE =
  'permission:pam_environments_create';

/**
 * @description Delete environment
 * @localZh 删除环境
 * @localEn Delete environment
 */
export const PERMISSION_PAM_ENVIRONMENTS_DELETE =
  'permission:pam_environments_delete';

/**
 * @description Replace environment variables
 * @localZh 替换环境变量
 * @localEn Replace environment variables
 */
export const PERMISSION_PAM_ENVIRONMENTS_VARIABLES_WRITE =
  'permission:pam_environments_variables_write';

/**
 * @description Export environment dotenv
 * @localZh 导出环境 dotenv
 * @localEn Export environment dotenv
 */
export const PERMISSION_PAM_ENVIRONMENTS_EXPORT =
  'permission:pam_environments_export';

/**
 * @description Delete project
 * @localZh 删除项目
 * @localEn Delete project
 */
export const PERMISSION_PAM_PROJECT_DELETE = 'permission:pam_project_delete';

/**
 * @description Update project
 * @localZh 编辑项目
 * @localEn Update project
 */
export const PERMISSION_PAM_PROJECT_EDIT = 'permission:pam_project_edit';

/**
 * @description Transfer project ownership
 * @localZh 转移项目所有权
 * @localEn Transfer project ownership
 */
export const PERMISSION_PAM_PROJECT_TRANSFER =
  'permission:pam_project_transfer';

/**
 * @description Refresh project preview image
 * @localZh 刷新项目预览图
 * @localEn Refresh project preview image
 */
export const PERMISSION_PAM_PROJECT_PREVIEW_WRITE =
  'permission:pam_project_preview_write';

/**
 * @description Create project
 * @localZh 新建项目
 * @localEn Create project
 */
export const PERMISSION_PAM_PROJECT_CREATE = 'permission:pam_project_create';

/**
 * @description Fork project
 * @localZh 派生（Fork）项目
 * @localEn Fork project
 */
export const PERMISSION_PAM_PROJECT_FORK = 'permission:pam_project_fork';

/**
 * @description List my teams
 * @localZh 列出我的团队
 * @localEn List my teams
 */
export const PERMISSION_PAM_TEAMS_LIST = 'permission:pam_teams_list';

/**
 * @description Create team
 * @localZh 创建团队
 * @localEn Create team
 */
export const PERMISSION_PAM_TEAMS_CREATE = 'permission:pam_teams_create';

/**
 * @description Get team detail
 * @localZh 查看团队详情
 * @localEn Get team detail
 */
export const PERMISSION_PAM_TEAMS_READ = 'permission:pam_teams_read';

/**
 * @description Add team member
 * @localZh 添加团队成员
 * @localEn Add team member
 */
export const PERMISSION_PAM_TEAMS_MEMBERS_CREATE =
  'permission:pam_teams_members_create';

/**
 * @description Update team member role
 * @localZh 更新团队成员角色
 * @localEn Update team member role
 */
export const PERMISSION_PAM_TEAMS_MEMBERS_UPDATE =
  'permission:pam_teams_members_update';

/**
 * @description Remove team member
 * @localZh 移除团队成员
 * @localEn Remove team member
 */
export const PERMISSION_PAM_TEAMS_MEMBERS_DELETE =
  'permission:pam_teams_members_delete';

/**
 * @description Attach project to team
 * @localZh 将项目挂到团队
 * @localEn Attach project to team
 */
export const PERMISSION_PAM_TEAMS_PROJECTS_ATTACH =
  'permission:pam_teams_projects_attach';
