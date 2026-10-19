/**
 * 判断变量名是否像密钥，仅用于提交前提示。
 *
 * 存在意义：用户可能忘记勾选敏感；键名提示比静默自动标敏感更清晰。
 * 核心思路：按键名分段匹配，避免 `AUTHOR` 误伤成 `AUTH`。
 * 主要能力：识别疑似密钥的键名。
 * 主要用途：网页保存前提示；CLI push 勾选时预勾疑似项。是否敏感仍由用户决定。
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
}
