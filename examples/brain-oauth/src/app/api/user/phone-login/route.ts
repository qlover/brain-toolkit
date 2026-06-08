import { NextRequest } from 'next/server';
import { API_USER_PHONE_LOGIN } from '@config/apiRoutes';
import { NextApiServer } from '@server/NextApiServer';
import { UserController } from '@server/controllers/UserController';

/**
 * Phone login via OTP — send code or verify code.
 *
 * Request body:
 * - `phone` (required): Phone number with country code, e.g. `+8613990101204`
 * - `otp`   (optional): 6-digit OTP code. Omit to send a new code; include to verify.
 *
 * Response (send OTP):
 * ```json
 * { "success": true, "data": { "message": "OTP sent", "OTP_EXP": 300 } }
 * ```
 *
 * Response (verify OTP):
 * ```json
 * { "success": true, "data": { "existing": true, "token": "..." } }
 * ```
 *
 * @see [API_USER_PHONE_LOGIN](../../../../shared/config/apiRoutes.ts)
 */
export async function POST(req: NextRequest) {
  const requestBody = await req.json();
  return await new NextApiServer(API_USER_PHONE_LOGIN, req).runWithJson(
    async ({ parameters: { IOC } }) =>
      IOC(UserController).loginWithPhone(requestBody)
  );

  // const requestBody = await request.json();

  // const apiServer = new NextApiServer(API_USER_PHONE_LOGIN, request);
  // return apiServer.runWithJson(async ({ IOC }) => {
  //   return await IOC(UserController).loginWithPhone(requestBody);

  //   // const config = apiServer.getIOC(I.AppConfig) as SeedServerConfigInterface;

  //   // const gateway = new BrainUserGateway(
  //   //   createBrainUserOptions({
  //   //     baseURL: config.brainUserProxyBaseURL,
  //   //     endpoints: config.brainUserProxyEndpoints
  //   //   }).requestAdapter
  //   // );

  //   // const result = await gateway.phoneLogin(
  //   //   { phone: requestBody.phone, otp: requestBody.otp },
  //   //   { method: 'POST' }
  //   // );

  //   // // Detect upstream errors returned as plain data (e.g. 404, 500)
  //   // // and convert to a proper error envelope so runWithJson returns
  //   // // the correct HTTP status code instead of wrapping as success.
  //   // if (result && typeof result === 'object') {
  //   //   const anyResult = result as Record<string, unknown>;
  //   //   const statusCode = anyResult.statusCode as number | undefined;
  //   //   if (statusCode && statusCode >= 400) {
  //   //     return {
  //   //       success: false as const,
  //   //       id: (anyResult.error as string) ?? 'upstream_error',
  //   //       message: (anyResult.message as string) ?? 'Upstream error',
  //   //       httpStatus: statusCode,
  //   //       requestId: apiServer.requestId
  //   //     };
  //   //   }
  //   // }

  //   // return result;
  // });
}
