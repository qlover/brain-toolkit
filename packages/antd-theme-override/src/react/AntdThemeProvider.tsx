import type { ConfigProviderProps } from 'antd';
import { ConfigProvider } from 'antd';
import type { ReactNode } from 'react';
import { AntdStaticProvider } from './AntdStaticProvider';
import type { AntdStaticApiInterface } from './AntdStaticApiInterface';

export function AntdThemeProvider(
  props: ConfigProviderProps & {
    children?: ReactNode;
    staticApi?: AntdStaticApiInterface;
  } = {}
) {
  const { children, staticApi, ...rest } = props;

  return (
    <ConfigProvider {...rest}>
      {staticApi && <AntdStaticProvider staticApi={staticApi} />}
      {children}
    </ConfigProvider>
  );
}
