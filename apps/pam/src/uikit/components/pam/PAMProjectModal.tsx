/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { PAMEnvironmentBlock } from './PAMEnvironmentBlock';

export interface ProjectFormData {
  id?: string;
  slug: string;
  name: string;
  description: string;
  stack: string;
  repo_url: string;
  category: string;
  is_public: 0 | 1;
  environments: Array<{
    name: string;
    url: string;
    variables: Array<{ key: string; value: string }>;
  }>;
}

interface PAMProjectModalProps {
  isOpen: boolean;
  initialData?: Partial<ProjectFormData>;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => void;
  onDelete?: (id: string) => void;
  title?: string;
}

export const PAMProjectModal: React.FC<PAMProjectModalProps> = ({
  isOpen,
  initialData,
  onClose,
  onSubmit,
  onDelete,
  title = '项目资产配置'
}) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    slug: '',
    name: '',
    description: '',
    stack: '',
    repo_url: '',
    category: '',
    is_public: 0,
    environments: [{ name: 'dev', url: '', variables: [] }]
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        slug: initialData.slug || '',
        name: initialData.name || '',
        description: initialData.description || '',
        stack: initialData.stack || '',
        repo_url: initialData.repo_url || '',
        category: initialData.category || '',
        is_public: initialData.is_public ?? 0,
        environments: initialData.environments || [
          { name: 'dev', url: '', variables: [] }
        ]
      });
    } else {
      // 新建默认：dev + prod
      setFormData({
        slug: '',
        name: '',
        description: '',
        stack: '',
        repo_url: '',
        category: '',
        is_public: 0,
        environments: [
          { name: 'dev', url: '', variables: [] },
          { name: 'prod', url: '', variables: [] }
        ]
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleFieldChange = (field: keyof ProjectFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleEnvChange = (index: number, env: any) => {
    const newEnvs = [...formData.environments];
    newEnvs[index] = env;
    setFormData({ ...formData, environments: newEnvs });
  };

  const addEnvironment = () => {
    setFormData({
      ...formData,
      environments: [
        ...formData.environments,
        { name: '', url: '', variables: [] }
      ]
    });
  };

  const removeEnvironment = (index: number) => {
    const newEnvs = formData.environments.filter((_, i) => i !== index);
    setFormData({ ...formData, environments: newEnvs });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleDelete = () => {
    if (initialData?.id && onDelete) {
      onDelete(initialData.id);
    }
  };

  return (
    <div
      data-testid="PAMProjectModal"
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-transition"
    >
      <div className="bg-bg-container rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl custom-scroll">
        <div className="sticky top-0 bg-bg-container border-b border-primary-border px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-primary-text">{title}</h3>
          <button
            onClick={onClose}
            className="text-tertiary-text hover:text-primary-text text-2xl"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <input type="hidden" name="id" value={initialData?.id || ''} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-secondary-text mb-1">
                项目名称 *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="w-full border border-primary-border rounded-xl px-4 py-2.5 bg-bg-container text-primary-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary-text mb-1">
                Slug (URL标识)
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleFieldChange('slug', e.target.value)}
                placeholder="auto-generated"
                className="w-full border border-primary-border rounded-xl px-4 py-2.5 bg-bg-container text-primary-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary-text mb-1">
              技术栈
            </label>
            <input
              type="text"
              placeholder="React, Go, Python"
              value={formData.stack}
              onChange={(e) => handleFieldChange('stack', e.target.value)}
              className="w-full border border-primary-border rounded-xl px-4 py-2.5 bg-bg-container text-primary-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary-text mb-1">
              项目描述
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="w-full border border-primary-border rounded-xl px-4 py-2.5 bg-bg-container text-primary-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-secondary-text mb-1">
                <i className="fas fa-code-branch"></i> 仓库地址
              </label>
              <input
                type="url"
                placeholder="https://github.com/..."
                value={formData.repo_url}
                onChange={(e) => handleFieldChange('repo_url', e.target.value)}
                className="w-full border border-primary-border rounded-xl px-4 py-2.5 bg-bg-container text-primary-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary-text mb-1">
                分类
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleFieldChange('category', e.target.value)}
                className="w-full border border-primary-border rounded-xl px-4 py-2.5 bg-bg-container text-primary-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">未分类</option>
                <option value="前端">前端</option>
                <option value="后端">后端</option>
                <option value="工具">工具</option>
                <option value="文档">文档</option>
                <option value="基础设施">基础设施</option>
                <option value="其他">其他</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary-text mb-1">
              权限
            </label>
            <select
              value={formData.is_public}
              onChange={(e) =>
                handleFieldChange('is_public', Number(e.target.value) as 0 | 1)
              }
              className="w-full border border-primary-border rounded-xl px-4 py-2.5 bg-bg-container text-primary-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={0}>🔒 仅自己可见</option>
              <option value={1}>🌍 所有人可见</option>
            </select>
          </div>

          <div className="border-t border-primary-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-base font-bold text-primary-text">
                <i className="fas fa-cloud-upload-alt text-primary mr-1"></i>{' '}
                多环境配置
              </label>
              <button
                type="button"
                onClick={addEnvironment}
                className="text-primary text-sm hover:text-primary-hover bg-primary-bg px-3 py-1.5 rounded-lg transition"
              >
                <i className="fas fa-plus-circle"></i> 添加环境
              </button>
            </div>
            <div className="space-y-5">
              {formData.environments.map((env, index) => (
                <PAMEnvironmentBlock
                  key={index}
                  env={env}
                  onChange={(updated) => handleEnvChange(index, updated)}
                  onRemove={() => removeEnvironment(index)}
                />
              ))}
            </div>
            <p className="text-xs text-tertiary-text mt-2">
              每个环境独立配置访问地址 + 环境变量
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-primary-border">
            {initialData?.id && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-sm font-medium transition"
              >
                <i className="fas fa-trash-alt mr-1"></i> 删除项目
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-primary-border rounded-xl text-secondary-text hover:bg-primary-bg transition"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-on-brand rounded-xl shadow-sm font-medium transition"
            >
              保存项目
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
