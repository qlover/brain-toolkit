/**
 * Permission catalog labels. Key = `permission:{slug}` where slug =
 * {@link permissionSlug}(uid). description 仅存 DB 供查询；UI 用本文件翻译。
 */

/**
 * @description List platform users
 * @localZh 列出平台用户
 * @localEn List platform users
 */
export const PERMISSION_GET_API_ADMIN_USERS = 'permission:get_api_admin_users';

/**
 * @description Set platform admin / system role (legacy)
 * @localZh 设置平台管理员 / 系统角色（旧接口）
 * @localEn Set platform admin / system role (legacy)
 */
export const PERMISSION_PATCH_API_ADMIN_USERS_USERID_PLATFORM_ADMIN =
  'permission:patch_api_admin_users_userId_platform_admin';

/**
 * @description Set system role user|operator|admin
 * @localZh 设置系统角色（普通用户 / 运营 / 管理员）
 * @localEn Set system role user|operator|admin
 */
export const PERMISSION_PATCH_API_ADMIN_USERS_USERID_SYSTEM_ROLE =
  'permission:patch_api_admin_users_userId_system_role';

/**
 * @description List role permission catalog and assignments
 * @localZh 查看角色权限目录与授权
 * @localEn List role permission catalog and assignments
 */
export const PERMISSION_GET_API_ADMIN_ROLES = 'permission:get_api_admin_roles';

/**
 * @description Replace role → permission assignments
 * @localZh 编辑角色权限授权
 * @localEn Replace role → permission assignments
 */
export const PERMISSION_PATCH_API_ADMIN_ROLES =
  'permission:patch_api_admin_roles';

/**
 * @description Read request audit logs
 * @localZh 查看请求审计日志
 * @localEn Read request audit logs
 */
export const PERMISSION_GET_API_ADMIN_REQUEST_LOGS =
  'permission:get_api_admin_request_logs';

/**
 * @description List phone OTP records
 * @localZh 查看手机验证码记录
 * @localEn List phone OTP records
 */
export const PERMISSION_GET_API_ADMIN_PHONE_OTPS =
  'permission:get_api_admin_phone_otps';

/**
 * @description Read site settings
 * @localZh 查看站点设置
 * @localEn Read site settings
 */
export const PERMISSION_GET_API_ADMIN_SITE_SETTINGS =
  'permission:get_api_admin_site_settings';

/**
 * @description Update site settings
 * @localZh 更新站点设置
 * @localEn Update site settings
 */
export const PERMISSION_PATCH_API_ADMIN_SITE_SETTINGS =
  'permission:patch_api_admin_site_settings';

/**
 * @description List project collaborators
 * @localZh 查看项目协作者
 * @localEn List project collaborators
 */
export const PERMISSION_GET_API_PAM_PROJECTID_COLLABORATORS =
  'permission:get_api_pam_projectId_collaborators';

/**
 * @description Add project collaborator
 * @localZh 添加项目协作者
 * @localEn Add project collaborator
 */
export const PERMISSION_POST_API_PAM_PROJECTID_COLLABORATORS =
  'permission:post_api_pam_projectId_collaborators';

/**
 * @description Update collaborator role
 * @localZh 更新协作者角色
 * @localEn Update collaborator role
 */
export const PERMISSION_PATCH_API_PAM_PROJECTID_COLLABORATORS_USERID =
  'permission:patch_api_pam_projectId_collaborators_userId';

/**
 * @description Remove collaborator
 * @localZh 移除协作者
 * @localEn Remove collaborator
 */
export const PERMISSION_DELETE_API_PAM_PROJECTID_COLLABORATORS_USERID =
  'permission:delete_api_pam_projectId_collaborators_userId';

/**
 * @description Create environment
 * @localZh 创建环境
 * @localEn Create environment
 */
export const PERMISSION_POST_API_PAM_PROJECTID_ENVIRONMENTS =
  'permission:post_api_pam_projectId_environments';

/**
 * @description Delete environment
 * @localZh 删除环境
 * @localEn Delete environment
 */
export const PERMISSION_POST_API_PAM_PROJECTID_ENVIRONMENTS_ENVID_DELETE =
  'permission:post_api_pam_projectId_environments_envId_delete';

/**
 * @description Replace environment variables
 * @localZh 替换环境变量
 * @localEn Replace environment variables
 */
export const PERMISSION_POST_API_PAM_PROJECTID_ENVIRONMENTS_ENVID_VARIABLES =
  'permission:post_api_pam_projectId_environments_envId_variables';

/**
 * @description Export environment dotenv
 * @localZh 导出环境 dotenv
 * @localEn Export environment dotenv
 */
export const PERMISSION_GET_API_PAM_PROJECTID_ENVIRONMENTS_ENVID_EXPORT =
  'permission:get_api_pam_projectId_environments_envId_export';

/**
 * @description Delete project
 * @localZh 删除项目
 * @localEn Delete project
 */
export const PERMISSION_POST_API_PAM_DELETE_ID =
  'permission:post_api_pam_delete_id';

/**
 * @description Update project
 * @localZh 编辑项目
 * @localEn Update project
 */
export const PERMISSION_POST_API_PAM_EDIT_ID =
  'permission:post_api_pam_edit_id';

/**
 * @description Transfer project ownership
 * @localZh 转移项目所有权
 * @localEn Transfer project ownership
 */
export const PERMISSION_POST_API_PAM_TRANSFER_ID =
  'permission:post_api_pam_transfer_id';

/**
 * @description Refresh project preview image
 * @localZh 刷新项目预览图
 * @localEn Refresh project preview image
 */
export const PERMISSION_POST_API_PAM_PREVIEW_IMAGE_ID =
  'permission:post_api_pam_preview_image_id';

/**
 * @description List my teams
 * @localZh 列出我的团队
 * @localEn List my teams
 */
export const PERMISSION_GET_API_PAM_TEAMS = 'permission:get_api_pam_teams';

/**
 * @description Create team
 * @localZh 创建团队
 * @localEn Create team
 */
export const PERMISSION_POST_API_PAM_TEAMS = 'permission:post_api_pam_teams';

/**
 * @description Get team detail
 * @localZh 查看团队详情
 * @localEn Get team detail
 */
export const PERMISSION_GET_API_PAM_TEAMS_TEAMID =
  'permission:get_api_pam_teams_teamId';

/**
 * @description Add team member
 * @localZh 添加团队成员
 * @localEn Add team member
 */
export const PERMISSION_POST_API_PAM_TEAMS_TEAMID_MEMBERS =
  'permission:post_api_pam_teams_teamId_members';

/**
 * @description Update team member role
 * @localZh 更新团队成员角色
 * @localEn Update team member role
 */
export const PERMISSION_PATCH_API_PAM_TEAMS_TEAMID_MEMBERS_USERID =
  'permission:patch_api_pam_teams_teamId_members_userId';

/**
 * @description Remove team member
 * @localZh 移除团队成员
 * @localEn Remove team member
 */
export const PERMISSION_DELETE_API_PAM_TEAMS_TEAMID_MEMBERS_USERID =
  'permission:delete_api_pam_teams_teamId_members_userId';

/**
 * @description Attach project to team
 * @localZh 将项目挂到团队
 * @localEn Attach project to team
 */
export const PERMISSION_POST_API_PAM_TEAMS_TEAMID_PROJECTS =
  'permission:post_api_pam_teams_teamId_projects';
