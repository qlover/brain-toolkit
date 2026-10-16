import type { PAMVariable } from '@schemas/PAMEnvironmentSchema';

/**
 * 判断变量名是否像密钥。
 *
 * 存在意义：未勾选敏感的 `DATABASE_URL` / `API_TOKEN` 会以明文进库，并随读取接口、fork 流出去。
 * 核心思路：按键名分段匹配，避免 `AUTHOR` 误伤成 `AUTH`。
 * 主要能力：识别密钥样式键名，并在写入前标成敏感。
 * 主要用途：网页保存、项目创建和 fork 与 CLI 的 `looksSensitiveKey` 使用同一规则。
 *
 * 规则需与 `packages/pamenv` 的 `PamCliEnvDiffUtil.looksSensitiveKey` 保持一致。
 */
export class PAMEnvSensitiveKeyUtil {
  /**
   * @param key - 变量名
   * @returns 键名像密钥时为 true
   */
  public static looksSensitive(key: string): boolean {
    const upper = key.toUpperCase();
    if (
      /(?:^|_)(?:SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE|CREDENTIAL|JWT|SESSION|COOKIE|AUTH)(?:_|$)/.test(
        upper
      )
    ) {
      return true;
    }
    if (
      /(?:^|_)API_?KEY(?:_|$)|(?:^|_)ACCESS_KEY(?:_|$)|CONNECTION_STRING/.test(
        upper
      )
    ) {
      return true;
    }
    if (
      /(?:^|_)(?:DATABASE|POSTGRES|MYSQL|REDIS|MONGO(?:DB)?)_(?:URL|URI)(?:_|$)/.test(
        upper
      )
    ) {
      return true;
    }
    if (/_KEY$/.test(upper) && !/(?:^|_)PUBLIC_KEY$/.test(upper)) {
      return true;
    }
    return false;
  }

  /**
   * 把密钥样式的键标为敏感，已敏感的保持不变。
   *
   * @param variables - 待写入的变量
   * @returns 补上敏感标记后的变量
   */
  public static markLookalikes(variables: PAMVariable[]): PAMVariable[];

  /**
   * @param variables - 待写入的变量；undefined 原样返回
   */
  public static markLookalikes(
    variables: PAMVariable[] | undefined
  ): PAMVariable[] | undefined;

  public static markLookalikes(
    variables: PAMVariable[] | undefined
  ): PAMVariable[] | undefined {
    if (variables === undefined) {
      return undefined;
    }

    return variables.map((variable: PAMVariable): PAMVariable => {
      if (variable.sensitive === true || !this.looksSensitive(variable.key)) {
        return variable;
      }
      return {
        ...variable,
        sensitive: true
      };
    });
  }
}
