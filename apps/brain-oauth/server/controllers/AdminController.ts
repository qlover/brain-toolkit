import type {
  AdminOverview,
  AdminUserList,
  AdminUserRole
} from '@shared/admin/adminDashboard';
import { isBrainAdminUser } from '@shared/auth/brainAdmin';
import { inject, injectable } from '@shared/container';
import { AdminDashboardService } from '@server/services/AdminDashboardService';
import { OAuthUserService } from '@server/services/OAuthUserService';
import type { UserServiceInterface } from '../interfaces/UserServiceInterface';

const MAX_PAGE_SIZE = 100;
const MAX_TZ_OFFSET = 14 * 60;

@injectable()
export class AdminController {
  constructor(
    @inject(OAuthUserService) protected userService: UserServiceInterface,
    @inject(AdminDashboardService)
    protected dashboard: AdminDashboardService
  ) {}

  /** Site-wide for admins; otherwise scoped to the caller's apps and logs. */
  public async getOverview(query: URLSearchParams): Promise<AdminOverview> {
    const user = await this.userService.getUser();
    const tz = Number(query.get('tzOffset'));
    const tzOffset =
      Number.isInteger(tz) && Math.abs(tz) <= MAX_TZ_OFFSET ? tz : 0;
    return this.dashboard.getOverview(
      isBrainAdminUser(user) ? null : String(user.id),
      tzOffset
    );
  }

  public listUsers(query: URLSearchParams): Promise<AdminUserList> {
    const role = query.get('role');
    return this.dashboard.listUsers({
      page: positiveInt(query.get('page'), 1),
      pageSize: Math.min(positiveInt(query.get('pageSize'), 15), MAX_PAGE_SIZE),
      keyword: query.get('keyword') ?? undefined,
      role:
        role === 'admin' || role === 'user'
          ? (role as AdminUserRole)
          : undefined
    });
  }
}

function positiveInt(raw: string | null, fallback: number): number {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}
