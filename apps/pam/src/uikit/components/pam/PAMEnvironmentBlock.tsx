import React, { useState } from 'react';
import { PAMEnvVarInput } from './PAMEnvVarInput';

interface EnvironmentData {
  name: string;
  url: string;
  variables: Array<{ key: string; value: string }>;
}

interface PAMEnvironmentBlockProps {
  env: EnvironmentData;
  onChange: (env: EnvironmentData) => void;
  onRemove: () => void;
}

export const PAMEnvironmentBlock: React.FC<PAMEnvironmentBlockProps> = ({
  env,
  onChange,
  onRemove
}) => {
  const [name, setName] = useState(env.name);
  const [url, setUrl] = useState(env.url);
  const [variables, setVariables] = useState(env.variables);

  const handleVarChange = (
    index: number,
    field: 'key' | 'value',
    value: string
  ) => {
    const newVars = [...variables];
    newVars[index] = { ...newVars[index], [field]: value };
    setVariables(newVars);
    onChange({ name, url, variables: newVars });
  };

  const addVar = () => {
    setVariables([...variables, { key: '', value: '' }]);
  };

  const removeVar = (index: number) => {
    const newVars = variables.filter((_, i) => i !== index);
    setVariables(newVars);
    onChange({ name, url, variables: newVars });
  };

  const handleNameChange = (value: string) => {
    setName(value);
    onChange({ name: value, url, variables });
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    onChange({ name, url: value, variables });
  };

  return (
    <div
      data-testid="PAMEnvironmentBlock"
      className="border border-primary-border rounded-xl p-4 bg-primary-bg relative"
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <i className="fas fa-server text-primary"></i>
          <input
            type="text"
            placeholder="环境名称 (如 dev, prod)"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="font-bold border border-primary-border rounded-lg px-2 py-1 w-32 text-sm bg-bg-container text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 text-sm"
        >
          <i className="fas fa-trash-alt"></i> 删除环境
        </button>
      </div>

      <div className="mb-3">
        <label className="text-xs font-semibold text-secondary-text">
          访问地址 (URL)
        </label>
        <input
          type="url"
          placeholder="https://..."
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          className="w-full border border-primary-border rounded-lg px-3 py-1.5 text-sm mt-1 bg-bg-container text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-secondary-text">
          环境变量{' '}
          <button
            type="button"
            onClick={addVar}
            className="text-primary text-xs ml-2 hover:text-primary-hover"
          >
            <i className="fas fa-plus-circle"></i> 添加变量
          </button>
        </label>
        <div className="mt-2">
          {variables.length === 0 ? (
            <div className="text-xs text-tertiary-text">暂无环境变量</div>
          ) : (
            variables.map((v, index) => (
              <PAMEnvVarInput
                key={index}
                keyValue={v.key}
                valueValue={v.value}
                onKeyChange={(val) => handleVarChange(index, 'key', val)}
                onValueChange={(val) => handleVarChange(index, 'value', val)}
                onRemove={() => removeVar(index)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
