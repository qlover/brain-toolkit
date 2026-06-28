export const PAMCommon = {
  placeholderSearch: '搜索项目...',
  allCategory: '所有分类',
  addPam: '新增资产',
  addPamsm: '新增',
  pamViewModeCard: '卡片',
  pamViewModeList: '列表'
};
export const PAMProjectI18n = {
  noEnvVars: '无环境变量',
  public: '公开的',
  private: '私有的',
  readonly: '只读',
  delete: '删除',
  noDesc: '暂无描述',
  noEnvConfig: '未配置环境',
  envDemo: '环境变量示例',
  repoUrlTitle: '仓库',
  envCount: '个环境',
  noProject: '暂无项目，点击「新增资产」创建',
  edit: '编辑'
};

export const PAMFormI18n = {
  tipFalteError: '致命错误,修改项目缺少ID',
  labelName: '项目名称',
  placeholderName: '例如: ',
  labelSlug: 'Slug',
  placeholderSlug: 'auto',
  labelStack: '技术栈',
  placeholderStack: 'React, Go, Python',
  labelDesc: '项目描述',
  placeholderDesc: '简要描述项目…',
  labelRepo: '仓库地址',
  placeholderRepo: 'https://github.com/',
  labelCategory: '分类',
  labelUnCategory: '未分类',
  formCancel: '取消',
  formEdit: '保存修改',
  formSave: '保存项目',
  formSaveing: '保存中…',
  tipEnvVariables: '请先填写完整当前所有环境变量（键和值都不能为空）',
  labelEnvName: '变量名',
  labelEnvUrl: '访问地址',
  placeholderEnvName: '环境名称',
  placeholderEnvUrl: 'https://',
  collapsed: '展开',
  uncollapsed: '折叠',
  envVarAdd: '添加',
  noEnvVar: '暂无环境变量',
  placeholderEnvVar: 'Key',
  labelEnvValue: '变量值',
  placehoderEnvValue: 'value',
  mulitEnv: '多环境配置',
  envAdd: '添加环境',
  envTip: '每个环境独立访问地址 + 环境变量',
  envVarAddLabel: '添加变量',
  envVarTitle: '环境变量',
  placeholerEnvName: '环境名称',
  envUrlTitle: '访问地址 (URL)',
  envDelete: '删除环境'
};

export const PAMI18n = {
  ...PAMCommon,
  ...PAMProjectI18n,
  ...PAMFormI18n
};
export type HomeI18nInterface = typeof PAMI18n;
