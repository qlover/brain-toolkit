import type { ForgeIssueCreateInputType } from '../types/IssueForgeTypes';
import type { FeedbackIssueTemplateType } from './FeedbackIssueTemplateResolver';
import { FEEDBACK_ISSUE_DEFAULT_TITLE } from './FeedbackIssueTemplateConfig';

const TITLE_MAX = 256;
const PLACEHOLDER_PATTERN = /\{\{\s*([a-z_]+)\s*\}\}/g;

/**
 * 通用模板渲染：只做 `{{var}}` 替换，不解释业务字段。
 */
export class FeedbackIssueTemplateRenderer {
  public render(
    template: string,
    variables: Readonly<Record<string, string>>
  ): string {
    return template.replace(PLACEHOLDER_PATTERN, (_m, key: string) => {
      return Object.prototype.hasOwnProperty.call(variables, key)
        ? (variables[key] ?? '')
        : `{{${key}}}`;
    });
  }

  public buildIssue(
    template: FeedbackIssueTemplateType,
    variables: Readonly<Record<string, string>>,
    extraLabels: readonly string[] = []
  ): ForgeIssueCreateInputType {
    const titleTemplate = template.title.trim() || FEEDBACK_ISSUE_DEFAULT_TITLE;
    const title = Array.from(
      this.render(titleTemplate, variables).replace(/\s+/g, ' ').trim()
    )
      .slice(0, TITLE_MAX)
      .join('');
    return {
      title,
      body: this.render(template.body, variables).trim(),
      labels: [...new Set([...template.labels, ...extraLabels])]
    };
  }
}
