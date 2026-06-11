export const BrainUserIdentifier = {
  /**
   * 一般用于响应结果为空或者不符合预期的情况
   */
  NO_RESPONSE_DATA: 'no_response_data',

  /**
   * 请求过于频繁，一般用于接口防刷或者限流的场景
   */
  TOO_FREQUENTLY: 'too_frequently',

  ANTI_ABUSE_CHECK_FAILED: 'anti_abuse_check_failed',
  /**
   * 获取用户信息的时候会返回
   *
   * ```{ detail: 'Invalid token.' }```
   */
  GETUSERINFO_INVALID_TOKEN: 'invalid_token'
} as const;
