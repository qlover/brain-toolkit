import { ConfigProvider, ConfigProviderProps } from 'antd';
import { ReactNode } from 'react';
import { AntdStaticProvider } from './AntdStaticProvider';
import { AntdStaticApiInterface } from './AntdStaticApiInterface';

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
