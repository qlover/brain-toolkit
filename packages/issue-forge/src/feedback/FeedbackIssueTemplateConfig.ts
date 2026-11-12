export const FeedbackIssueTemplateSource = Object.freeze({
  repo: 'repo',
  builtin: 'builtin'
} as const);

export type FeedbackIssueTemplateSourceType =
  (typeof FeedbackIssueTemplateSource)[keyof typeof FeedbackIssueTemplateSource];

export const FEEDBACK_ISSUE_TEMPLATE_PATH =
  '.github/ISSUE_TEMPLATE/feedback.md' as const;

export const FEEDBACK_ISSUE_TEMPLATE_CACHE_TTL_MS = 10 * 60 * 1000;
export const FEEDBACK_ISSUE_TEMPLATE_FAILURE_TTL_MS = 60 * 1000;

export const FEEDBACK_ISSUE_DEFAULT_TITLE =
  '[Feedback][{{category}}] {{summary}}' as const;

export const FEEDBACK_ISSUE_ASSETS_BRANCH = 'feedback-assets' as const;
export const FEEDBACK_ISSUE_ASSETS_DIR = 'feedback' as const;

export const FEEDBACK_ISSUE_ASSETS_README = `# feedback-assets

Feedback screenshots uploaded by the app backend for Issue references.

- Do not merge into main
- May contain user screenshots; keep the branch private if needed
` as const;

export const FEEDBACK_ISSUE_DEFAULT_TEMPLATE = `---
name: User feedback
about: App user feedback (server also uses this template; placeholders replaced server-side)
title: "[Feedback][{{category}}] {{summary}}"
labels: feedback
---

> App feedback · ID: \`{{feedback_id}}\` · [Admin]({{admin_url}})

### Reporter

| Field | Value |
| --- | --- |
| Name | {{display_name}} |
| Email | {{email}} |
| Phone | {{phone}} |
| Submitted at | {{created_at}} |

### Description

{{body}}

### Environment

{{environment}}

### Page

{{page_url}}

### Screenshots

{{screenshots}}

{{user_agent}}
` as const;
