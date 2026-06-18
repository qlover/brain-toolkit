import { API_PAM_SEARCH } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import type { NextRequest } from 'next/server';

export function GET(req: NextRequest) {
  return new NextApiServer(API_PAM_SEARCH, req).runWithJson(
    ({ parameters: { IOC } }) => IOC(PAMController).searchPamList(req)
  );
}
