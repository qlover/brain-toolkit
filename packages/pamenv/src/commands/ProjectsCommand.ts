import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  PAMENV_CLI_NO_PROJECTS,
  PAMENV_CLI_PROJECTS_COL_ENVS,
  PAMENV_CLI_PROJECTS_COL_ID,
  PAMENV_CLI_PROJECTS_COL_NAME,
  PAMENV_CLI_PROJECTS_COL_ROLE,
  PAMENV_CLI_PROJECTS_COL_SLUG,
  PAMENV_CLI_PROJECTS_PAGE_FOOTER,
  PAMENV_CLI_PROJECTS_PAGE_FOOTER_AT_LEAST,
  PAMENV_CLI_PROJECTS_PAGE_FOOTER_NO_TOTAL,
  PAMENV_CLI_PROJECTS_PAGE_MORE
} from '../i18n/identifier/pamenv_cli';
import type { PamCliApiClientInterface } from '../interfaces/PamCliApiClientInterface';
import type { PamCliListProjectsOptionsType } from '../interfaces/PamCliTypes';
import { PamCliProjectAccessUtil } from '../impls/PamCliProjectAccessUtil';
import { pamCliFormatTable } from '../impls/PamCliTableUtil';

export type PamCliProjectsCommandOptionsType = PamCliListProjectsOptionsType & {
  /** When true, include the project id column. */
  readonly verbose?: boolean;
};

/**
 * `pamenv projects` — list owned / visible PAM projects (aligned table).
 */
export class ProjectsCommand {
  constructor(protected readonly apiClient: PamCliApiClientInterface) {}

  /**
   * @param keyword - Optional search keyword
   * @param options - Web-aligned filters (`mine` / `writable` are server-side)
   */
  public async run(
    keyword?: string,
    options: PamCliProjectsCommandOptionsType = {}
  ): Promise<void> {
    // Same default page size as the PAM web home list; use --page for more.
    const search: PamCliListProjectsOptionsType = {
      ...options,
      page: options.page ?? 1,
      pageSize: options.pageSize ?? 10,
      view: options.view ?? 'compact',
      ...(keyword?.trim() ? { keyword: keyword.trim() } : {})
    };

    const page = await this.apiClient.searchProjects(search);
    const projects = page.items;

    if (projects.length === 0) {
      console.log(PamCliI18n.t(PAMENV_CLI_NO_PROJECTS));
      this.printPageFooter(page, 0);
      return;
    }

    const verbose = options.verbose === true;
    const header = [
      PamCliI18n.t(PAMENV_CLI_PROJECTS_COL_SLUG),
      PamCliI18n.t(PAMENV_CLI_PROJECTS_COL_NAME),
      PamCliI18n.t(PAMENV_CLI_PROJECTS_COL_ROLE),
      PamCliI18n.t(PAMENV_CLI_PROJECTS_COL_ENVS),
      ...(verbose ? [PamCliI18n.t(PAMENV_CLI_PROJECTS_COL_ID)] : [])
    ];

    const rows = projects.map((project) => {
      const role = PamCliProjectAccessUtil.roleLabel(project) || '-';
      const envs =
        project.environments
          ?.map((env) => env.name)
          .filter(Boolean)
          .join(', ') || '-';
      return [
        project.slug,
        project.name,
        role,
        envs,
        ...(verbose ? [project.id] : [])
      ];
    });

    const lines = pamCliFormatTable(header, rows, {
      // Keep long Chinese names from blowing out the terminal.
      maxWidths: [28, 28, 18, 36, verbose ? 36 : undefined]
    });
    for (const line of lines) {
      console.log(line);
    }
    this.printPageFooter(page, projects.length);
  }

  /**
   * Prints page / total summary under the table (from search API meta).
   *
   * PAM may skip exact count on page 2+ and set `total = offset + loaded`
   * (a lower bound) while `hasMore` stays true — do not render that as
   * “page N/N · total …” or it contradicts the next-page hint.
   */
  protected printPageFooter(
    page: {
      readonly page: number;
      readonly pageSize: number;
      readonly hasMore: boolean;
      readonly total?: number;
    },
    count: number
  ): void {
    const parts: string[] = [];
    const pageSize = Math.max(1, page.pageSize);
    const offset = Math.max(0, (page.page - 1) * pageSize);
    const total = page.total;
    // Placeholder from SQL when `p_include_count` is false on a full page.
    const totalIsLowerBound =
      typeof total === 'number' &&
      page.hasMore &&
      total <= offset + count;

    if (typeof total === 'number' && !totalIsLowerBound) {
      const pages = Math.max(1, Math.ceil(total / pageSize));
      parts.push(
        PamCliI18n.t(PAMENV_CLI_PROJECTS_PAGE_FOOTER, {
          page: String(page.page),
          pages: String(pages),
          count: String(count),
          total: String(total)
        })
      );
    } else if (typeof total === 'number' && totalIsLowerBound) {
      parts.push(
        PamCliI18n.t(PAMENV_CLI_PROJECTS_PAGE_FOOTER_AT_LEAST, {
          page: String(page.page),
          count: String(count),
          total: String(total)
        })
      );
    } else {
      parts.push(
        PamCliI18n.t(PAMENV_CLI_PROJECTS_PAGE_FOOTER_NO_TOTAL, {
          page: String(page.page),
          count: String(count),
          pageSize: String(pageSize)
        })
      );
    }
    if (page.hasMore) {
      parts.push(
        PamCliI18n.t(PAMENV_CLI_PROJECTS_PAGE_MORE, {
          next: String(page.page + 1)
        })
      );
    }
    console.log(parts.join(' '));
  }
}
