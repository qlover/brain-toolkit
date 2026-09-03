import { createHmac, randomUUID } from 'node:crypto';

export type AliyunDysmsSendInput = {
  readonly accessKeyId: string;
  readonly accessKeySecret: string;
  readonly signName: string;
  readonly templateCode: string;
  readonly templateParamKey: string;
  readonly regionId: string;
  readonly endpoint: string;
  /** E.164 or digits; converted for Aliyun PhoneNumbers. */
  readonly phone: string;
  readonly code: string;
};

export type AliyunDysmsSendResult = {
  readonly requestId?: string;
  readonly bizId?: string;
  readonly code: string;
  readonly message: string;
};

/**
 * Percent-encode for Aliyun POP RPC Signature (RFC 3986 subset).
 */
export function aliyunPercentEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

/**
 * Aliyun PhoneNumbers: drop leading `+` (e.g. `+86138…` → `86138…`).
 */
export function toAliyunPhoneNumber(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith('+')) {
    return trimmed.slice(1).replace(/\D/g, '');
  }
  return trimmed.replace(/\D/g, '');
}

function buildCanonicalQuery(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map(
      (key) =>
        `${aliyunPercentEncode(key)}=${aliyunPercentEncode(params[key]!)}`
    )
    .join('&');
}

/**
 * Classic POP Signature (HMAC-SHA1) for DysmsAPI SendSms.
 *
 * @see https://help.aliyun.com/document_detail/101341.html
 */
export function signAliyunRpcParams(
  method: 'GET' | 'POST',
  params: Record<string, string>,
  accessKeySecret: string
): string {
  const canonicalized = buildCanonicalQuery(params);
  const stringToSign = `${method}&${aliyunPercentEncode('/')}&${aliyunPercentEncode(canonicalized)}`;
  return createHmac('sha1', `${accessKeySecret}&`)
    .update(stringToSign)
    .digest('base64');
}

/**
 * Call Aliyun DysmsAPI `SendSms` (RPC, no official SDK).
 */
export async function sendAliyunDysms(
  input: AliyunDysmsSendInput
): Promise<AliyunDysmsSendResult> {
  const phoneNumbers = toAliyunPhoneNumber(input.phone);
  const templateParam = JSON.stringify({
    [input.templateParamKey]: input.code
  });

  const params: Record<string, string> = {
    AccessKeyId: input.accessKeyId,
    Action: 'SendSms',
    Format: 'JSON',
    PhoneNumbers: phoneNumbers,
    RegionId: input.regionId,
    SignName: input.signName,
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: randomUUID(),
    SignatureVersion: '1.0',
    TemplateCode: input.templateCode,
    TemplateParam: templateParam,
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    Version: '2017-05-25'
  };

  const signature = signAliyunRpcParams('POST', params, input.accessKeySecret);
  params.Signature = signature;

  const body = buildCanonicalQuery(params);
  const endpoint = input.endpoint.replace(/\/+$/, '');
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  const text = await response.text();
  let parsed: {
    Code?: string;
    Message?: string;
    RequestId?: string;
    BizId?: string;
  } = {};
  try {
    parsed = JSON.parse(text) as typeof parsed;
  } catch {
    throw new Error(
      `Aliyun SMS invalid JSON response (HTTP ${response.status}): ${text.slice(0, 200)}`
    );
  }

  return {
    requestId: parsed.RequestId,
    bizId: parsed.BizId,
    code: parsed.Code ?? (response.ok ? 'OK' : 'Unknown'),
    message: parsed.Message ?? text.slice(0, 200)
  };
}
