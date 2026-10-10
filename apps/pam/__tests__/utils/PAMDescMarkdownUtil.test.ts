import { describe, expect, it } from 'vitest';
import {
  extractPAMDescLinks,
  extractPAMDescSummary,
  getPAMDescLinkKind
} from '@shared/utils/PAMDescMarkdownUtil';

const DESC = `# Brain Userguide

用来和 **natural** 手机联动的 [AI 新手教程](https://aiguide.brain.ai) 站点。

## 链接

- [Jira NFS-319](https://brain-ai.atlassian.net/browse/NFS-319)
- [Figma 主稿](https://www.figma.com/design/abc/userguide)
- [PRD](https://brain.feishu.cn/docx/prd)
- [仓库](https://github.com/brain/userguide)
- [Figma 主稿](https://www.figma.com/design/abc/userguide)
`;

describe('extractPAMDescSummary', () => {
  it('returns the first body paragraph without markdown syntax', () => {
    expect(extractPAMDescSummary(DESC)).toBe(
      '用来和 natural 手机联动的 AI 新手教程 站点。'
    );
  });

  it('keeps plain-text descriptions', () => {
    expect(extractPAMDescSummary('用于插件下载，国内访问')).toBe(
      '用于插件下载，国内访问'
    );
  });

  it('returns empty string when there is no paragraph', () => {
    expect(extractPAMDescSummary('# Title\n\n- item')).toBe('');
    expect(extractPAMDescSummary(null)).toBe('');
  });
});

describe('extractPAMDescLinks', () => {
  it('extracts typed links, skipping repo hosts and duplicates', () => {
    expect(extractPAMDescLinks(DESC)).toEqual([
      { title: 'AI 新手教程', url: 'https://aiguide.brain.ai', kind: 'link' },
      {
        title: 'Jira NFS-319',
        url: 'https://brain-ai.atlassian.net/browse/NFS-319',
        kind: 'issue'
      },
      {
        title: 'Figma 主稿',
        url: 'https://www.figma.com/design/abc/userguide',
        kind: 'design'
      },
      { title: 'PRD', url: 'https://brain.feishu.cn/docx/prd', kind: 'doc' }
    ]);
  });
});

describe('getPAMDescLinkKind', () => {
  it('falls back to link for unknown or invalid urls', () => {
    expect(getPAMDescLinkKind('https://example.com')).toBe('link');
    expect(getPAMDescLinkKind('not a url')).toBe('link');
  });
});
