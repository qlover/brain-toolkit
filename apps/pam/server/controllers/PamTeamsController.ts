import { ExecutorError } from '@qlover/fe-corekit/executor';
import { inject, injectable } from '@shared/container';
import { API_REQUEST_BODY_EMPTY } from '@config/i18n-identifier/api';
import {
  PamTeamAttachProjectSchema,
  PamTeamCreateSchema,
  PamTeamMemberAddSchema,
  PamTeamMemberUpdateSchema,
  type PamTeamDetail,
  type PamTeamMemberItem,
  type PamTeamProjectItem,
  type PamTeamRole,
  type PamTeamRow
} from '@schemas/PamTeamSchema';
import { PamTeamService } from '@server/services/PamTeamService';
import type { NextRequest } from 'next/server';

type PamTeamListItem = PamTeamRow & {
  my_role: PamTeamRole;
  permissions: string[];
};

@injectable()
export class PamTeamsController {
  constructor(
    @inject(PamTeamService) protected readonly teams: PamTeamService
  ) {}

  public async listMine(): Promise<PamTeamListItem[]> {
    return this.teams.listMyTeams();
  }

  public async create(req: NextRequest): Promise<PamTeamDetail> {
    const body = await req.json().catch(() => null);
    if (!body) {
      throw new ExecutorError(API_REQUEST_BODY_EMPTY);
    }
    return this.teams.createTeam(PamTeamCreateSchema.parse(body));
  }

  public async detail(teamId: string): Promise<PamTeamDetail> {
    return this.teams.getTeamDetail(teamId);
  }

  public async addMember(
    teamId: string,
    req: NextRequest
  ): Promise<PamTeamMemberItem> {
    const body = await req.json().catch(() => null);
    if (!body) {
      throw new ExecutorError(API_REQUEST_BODY_EMPTY);
    }
    return this.teams.addMember(teamId, PamTeamMemberAddSchema.parse(body));
  }

  public async updateMember(
    teamId: string,
    userId: string,
    req: NextRequest
  ): Promise<PamTeamMemberItem> {
    const body = await req.json().catch(() => null);
    if (!body) {
      throw new ExecutorError(API_REQUEST_BODY_EMPTY);
    }
    return this.teams.updateMemberRole(
      teamId,
      userId,
      PamTeamMemberUpdateSchema.parse(body)
    );
  }

  public async removeMember(teamId: string, userId: string): Promise<void> {
    return this.teams.removeMember(teamId, userId);
  }

  public async attachProject(
    teamId: string,
    req: NextRequest
  ): Promise<{ ok: true }> {
    const body = await req.json().catch(() => null);
    if (!body) {
      throw new ExecutorError(API_REQUEST_BODY_EMPTY);
    }
    await this.teams.attachProject(
      teamId,
      PamTeamAttachProjectSchema.parse(body)
    );
    return { ok: true };
  }

  public async listProjects(teamId: string): Promise<PamTeamProjectItem[]> {
    return this.teams.listProjects(teamId);
  }

  public async dissolve(teamId: string): Promise<{ ok: true }> {
    await this.teams.dissolveTeam(teamId);
    return { ok: true };
  }
}
