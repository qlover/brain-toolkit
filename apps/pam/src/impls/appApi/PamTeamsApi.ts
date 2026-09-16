import { inject, injectable } from '@shared/container';
import {
  API_PAM_TEAMS,
  API_PAM_TEAMS_2,
  API_PAM_TEAMS_MEMBERS,
  API_PAM_TEAMS_MEMBERS_2,
  API_PAM_TEAMS_PROJECTS
} from '@config/apiRoutes';
import type {
  PamTeamAttachProject,
  PamTeamCreate,
  PamTeamDetail,
  PamTeamMemberAdd,
  PamTeamMemberItem,
  PamTeamMemberUpdate,
  PamTeamProjectItem,
  PamTeamRole,
  PamTeamRow
} from '@schemas/PamTeamSchema';
import { AppApiRequester } from './AppApiRequester';
import type { NextKitApiSuccess } from '@qlover/next-kit/common';

export type PamTeamListItem = PamTeamRow & {
  my_role: PamTeamRole;
  permissions: string[];
};

function teamPath(teamId: string, template: string): string {
  return template.replace(':teamId', encodeURIComponent(teamId));
}

function memberPath(teamId: string, userId: string): string {
  return API_PAM_TEAMS_MEMBERS_2.replace(
    ':teamId',
    encodeURIComponent(teamId)
  ).replace(':userId', encodeURIComponent(userId));
}

@injectable()
export class PamTeamsApi {
  constructor(
    @inject(AppApiRequester) private readonly appApiRequester: AppApiRequester
  ) {}

  public async listMine(): Promise<PamTeamListItem[]> {
    const response = await this.appApiRequester.get(API_PAM_TEAMS);
    const envelope = response.data as NextKitApiSuccess<PamTeamListItem[]>;
    return envelope.data ?? [];
  }

  public async create(body: PamTeamCreate): Promise<PamTeamDetail> {
    const response = await this.appApiRequester.post(API_PAM_TEAMS, body);
    const envelope = response.data as NextKitApiSuccess<PamTeamDetail>;
    return envelope.data!;
  }

  public async detail(teamId: string): Promise<PamTeamDetail> {
    const response = await this.appApiRequester.get(
      teamPath(teamId, API_PAM_TEAMS_2)
    );
    const envelope = response.data as NextKitApiSuccess<PamTeamDetail>;
    return envelope.data!;
  }

  public async addMember(
    teamId: string,
    body: PamTeamMemberAdd
  ): Promise<PamTeamMemberItem> {
    const response = await this.appApiRequester.post(
      teamPath(teamId, API_PAM_TEAMS_MEMBERS),
      body
    );
    const envelope = response.data as NextKitApiSuccess<PamTeamMemberItem>;
    return envelope.data!;
  }

  public async updateMember(
    teamId: string,
    userId: string,
    body: PamTeamMemberUpdate
  ): Promise<PamTeamMemberItem> {
    const response = await this.appApiRequester.patch(
      memberPath(teamId, userId),
      body
    );
    const envelope = response.data as NextKitApiSuccess<PamTeamMemberItem>;
    return envelope.data!;
  }

  public async removeMember(teamId: string, userId: string): Promise<void> {
    await this.appApiRequester.delete(memberPath(teamId, userId));
  }

  public async attachProject(
    teamId: string,
    body: PamTeamAttachProject
  ): Promise<void> {
    await this.appApiRequester.post(
      teamPath(teamId, API_PAM_TEAMS_PROJECTS),
      body
    );
  }

  public async listProjects(teamId: string): Promise<PamTeamProjectItem[]> {
    const response = await this.appApiRequester.get(
      teamPath(teamId, API_PAM_TEAMS_PROJECTS)
    );
    const envelope = response.data as NextKitApiSuccess<PamTeamProjectItem[]>;
    return envelope.data ?? [];
  }

  public async dissolve(teamId: string): Promise<void> {
    await this.appApiRequester.delete(teamPath(teamId, API_PAM_TEAMS_2));
  }
}
