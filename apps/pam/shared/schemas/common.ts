import { z } from 'zod';
import { V_INVALID_ID } from '@config/i18n-identifier/common/validators';
import type { ValueOf } from '@qlover/fe-corekit';

export const uuidSchema = z.uuid({
  error: V_INVALID_ID
});

/**
 * 数据库内的数据主要是软删除，不会真实删除，所以这里定义一个删除类型，用于区分
 *
 * - int 0: 未删除
 * - int 1: 已删除
 */
export const DeleteStatus = {
  DELETE: 1,
  UNDELETE: 0
} as const;

export type UUIDType = z.infer<typeof uuidSchema>;
export type SchemaDeletesType = ValueOf<typeof DeleteStatus>;
