/* PAM prototype shared script: theme, header, sample data, markdown helpers, description editor */
(function () {
  const THEME_KEY = 'pam-proto-theme';

  const esc = (s) =>
    String(s ?? '').replace(
      /[&<>"]/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
    );

  /* ---------- sample data ---------- */
  const PROJECTS = [
    {
      slug: 'brain-userguide',
      name: 'Brain Userguide',
      category: '前端',
      stack: 'React',
      repoIcon: 'fa-brands fa-github',
      owner: '66edd6c4-1f89-4481-a13d-20f29e9d733f',
      updated: '2026年9月30日 17:04',
      cover: 'guide',
      envs: [
        { name: 'cloud', url: 'https://aiguide.cloud.brain.ai' },
        { name: 'dev', url: 'https://aiguide-dev.brain.ai', dev: true },
        { name: 'jp', url: 'https://aiguide.jp.brain.ai' }
      ],
      desc: `用来和 natural 手机联动的 AI 新手教程站点。

## 需求与设计
- [Jira NFS-319](https://brain-ai.atlassian.net/browse/NFS-319)
- [Figma 主稿](https://www.figma.com/design/abc123/userguide)
- [交互说明](https://www.figma.com/board/xyz/flow)

## 文档
- [PRD](https://brain.feishu.cn/docx/userguide-prd)
- [接口文档](https://apifox.com/apidoc/shared-guide)

## 备注
各环境使用同一套内容配置，\`jp\` 环境需要日文文案；发布前在 **cloud** 环境验收。`
    },
    {
      slug: 'react-seed',
      name: 'react seed',
      category: '前端',
      stack: 'React,Vite',
      repoIcon: 'fa-solid fa-seedling',
      owner: '66edd6c4-1f89-4481-a13d-20f29e9d733f',
      updated: '2026年9月18日 17:00',
      cover: 'seed',
      envs: [
        { name: 'dev', url: 'https://reactseed.qlover.top/en', dev: true }
      ],
      desc: `这是一个国际化、主题、权限、路由一体的模板。

- [仓库](https://github.com/qlover/react-seed)`
    },
    {
      slug: 'crx-download',
      name: '国内 crx 插件下载',
      category: '工具',
      stack: 'crx',
      repoIcon: 'fa-brands fa-chrome',
      owner: '66edd6c4-1f89-4481-a13d-20f29e9d733f',
      updated: '2026年9月16日 10:31',
      cover: 'dash',
      envs: [],
      desc: '用于插件下载，国内访问'
    },
    {
      slug: 'brain-email-agent',
      name: 'brain email agent',
      category: '前端',
      stack: '',
      repoIcon: 'fa-solid fa-code-branch',
      owner: '66edd6c4-1f89-4481-a13d-20f29e9d733f',
      updated: '2026年9月15日 10:21',
      cover: null,
      envs: [
        {
          name: 'dev',
          url: 'http://imagica.brain.loocaa.com:13540/dash/',
          dev: true
        },
        { name: 'dev-api', url: 'http://imagica.brain.loocaa.com:13541' }
      ],
      desc: `关于早期单独实现的 email 的 agent

- [设计稿](https://www.figma.com/design/mail/agent)`
    }
  ];

  /* ---------- light-weight extraction (list page: no markdown lib) ---------- */
  function stripInline(s) {
    return s
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/(\*\*|__|\*|_|~~)(.+?)\1/g, '$2')
      .trim();
  }

  function extractSummary(md) {
    for (const block of String(md || '').split(/\n\s*\n/)) {
      const t = block.trim();
      if (!t || /^(#|[-*+] |\d+\. |>|```|\|)/.test(t)) continue;
      return stripInline(t.replace(/\n/g, ' '));
    }
    return '';
  }

  const LINK_TYPES = [
    { re: /figma\.com/, icon: 'fa-brands fa-figma', label: '设计' },
    { re: /atlassian\.net|jira/, icon: 'fa-brands fa-jira', label: '需求' },
    {
      re: /feishu|larksuite|notion|yuque|confluence|docs\.google|apifox|swagger/,
      icon: 'fa-solid fa-file-lines',
      label: '文档'
    }
  ];

  /** Code hosts are already reachable via the avatar (repo_url), so they are not quick links. */
  const REPO_HOST_RE =
    /^https?:\/\/(www\.)?(github\.com|gitlab\.[^/]+|gitee\.com|bitbucket\.org)\//;

  function extractLinks(md) {
    const out = [];
    const seen = new Set();
    const re = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
    let m;
    while ((m = re.exec(String(md || '')))) {
      if (seen.has(m[2]) || REPO_HOST_RE.test(m[2])) continue;
      seen.add(m[2]);
      const type = LINK_TYPES.find((t) => t.re.test(m[2])) || {
        icon: 'fa-solid fa-link',
        label: '链接'
      };
      out.push({ title: m[1], url: m[2], icon: type.icon, label: type.label });
    }
    return out;
  }

  /* ---------- lazy markdown renderer (stands in for next/dynamic + react-markdown) ---------- */
  let markedPromise = null;
  function loadRenderer() {
    if (!markedPromise) {
      markedPromise = new Promise((resolve) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/marked@12/marked.min.js';
        s.onload = () => resolve(window.marked);
        document.head.appendChild(s);
      });
    }
    return markedPromise;
  }

  async function renderMd(el, md) {
    if (!String(md || '').trim()) {
      el.innerHTML = '<p class="t3">暂无描述</p>';
      return;
    }
    if (!window.marked)
      el.innerHTML =
        '<p class="t3"><i class="fa-solid fa-spinner fa-spin mr-1"></i>加载渲染器…</p>';
    const marked = await loadRenderer();
    el.innerHTML = marked.parse(String(md).replace(/</g, '&lt;'));
    el.querySelectorAll('a').forEach((a) => {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
  }

  /* ---------- small renderers ---------- */
  function envChip(env, compact) {
    return `<a class="env ${env.dev ? 'dev' : ''} ${compact ? 'compact' : ''}" href="${esc(env.url)}" target="_blank" title="${esc(env.url)}"><i class="fa-solid fa-arrow-up-right-from-square" style="font-size:.85em"></i>${esc(env.name)}</a>`;
  }

  function linkChip(l) {
    return `<a class="lnk" href="${esc(l.url)}" target="_blank" title="${esc(l.label + ' · ' + l.url)}"><i class="${l.icon}"></i><span>${esc(l.title)}</span></a>`;
  }

  function linkIcon(l) {
    return `<a class="lnk-icon" href="${esc(l.url)}" target="_blank" title="${esc(l.label + ' · ' + l.title)}"><i class="${l.icon}"></i></a>`;
  }

  function linkIcons(links, max) {
    const shown = links.slice(0, max);
    const rest = links.slice(max);
    return (
      shown.map(linkIcon).join('') +
      (rest.length
        ? `<span class="lnk-icon t3" title="${esc(rest.map((l) => l.title).join('、'))}">+${rest.length}</span>`
        : '')
    );
  }

  /** Fake first-screen screenshot so the prototype has a cover without external images. */
  function coverHtml(kind) {
    if (kind === 'guide') {
      return `<div class="cover" style="background:#f3f4f6">
        <div style="position:absolute;left:8%;top:10%;font:600 11px Inter;color:#111">Natural OS Guide</div>
        <div style="position:absolute;left:8%;top:22%;width:52%;height:46%;border-radius:10px;background:linear-gradient(135deg,#0b1220,#1e293b)">
          <div style="position:absolute;left:10%;top:38%;color:#fff;font:700 13px Inter">AI BUTTON</div>
          <div style="position:absolute;right:12%;top:12%;width:26%;height:76%;border-radius:10px;background:linear-gradient(160deg,#e5e7eb,#f97316)"></div>
        </div>
        <div style="position:absolute;left:64%;top:26%;width:28%;font:600 10px Inter;color:#111">AI Button<div style="margin-top:6px;height:5px;background:#d1d5db;border-radius:3px"></div><div style="margin-top:4px;height:5px;width:70%;background:#d1d5db;border-radius:3px"></div></div>
        <div style="position:absolute;left:8%;top:74%;width:25%;height:16%;border-radius:8px;background:#e5e7eb"></div>
        <div style="position:absolute;left:35%;top:74%;width:25%;height:16%;border-radius:8px;background:#e5e7eb"></div>
      </div>`;
    }
    if (kind === 'seed') {
      return `<div class="cover" style="background:linear-gradient(90deg,#f5f3ff 0%,#fff 55%)">
        <div style="position:absolute;left:6%;top:30%;font:700 14px Inter;color:#1f2937">Grow from seed to product</div>
        <div style="position:absolute;left:6%;top:44%;width:36%;height:5px;background:#ddd6fe;border-radius:3px"></div>
        <div style="position:absolute;left:6%;top:52%;width:28%;height:5px;background:#ddd6fe;border-radius:3px"></div>
        <div style="position:absolute;right:7%;top:14%;width:36%;height:74%;background:#fff;border-radius:10px;box-shadow:0 4px 18px rgb(0 0 0/.08);padding:10px">
          <div style="font:700 11px Inter;color:#111">Sign In</div>
          <div style="margin-top:10px;height:12px;border:1px solid #e5e7eb;border-radius:4px"></div>
          <div style="margin-top:6px;height:12px;border:1px solid #e5e7eb;border-radius:4px"></div>
          <div style="margin-top:6px;height:12px;border:1px solid #e5e7eb;border-radius:4px"></div>
          <div style="margin-top:10px;height:13px;background:#7c3aed;border-radius:4px"></div>
        </div>
      </div>`;
    }
    if (kind === 'dash') {
      const tile = (c, n) =>
        `<div style="flex:1;background:#fff;border-radius:6px;padding:6px;border:1px solid #e5e7eb"><div style="font:700 12px Inter;color:${c}">${n}</div><div style="margin-top:4px;height:4px;background:#e5e7eb;border-radius:2px"></div></div>`;
      const row = () =>
        `<div style="display:flex;gap:6px;align-items:center;margin-top:7px"><div style="width:12px;height:12px;border-radius:3px;background:#93c5fd"></div><div style="flex:1;height:5px;background:#e5e7eb;border-radius:3px"></div><div style="width:18%;height:5px;background:#e5e7eb;border-radius:3px"></div></div>`;
      return `<div class="cover" style="background:#f8fafc;padding:10px 12px">
        <div style="display:flex;gap:6px">${tile('#2563eb', '296271')}${tile('#0891b2', '33699')}${tile('#ea580c', '437970')}${tile('#0d9488', '110698')}</div>
        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;margin-top:8px;padding:6px 8px">${row()}${row()}${row()}${row()}</div>
      </div>`;
    }
    return '';
  }

  /* ---------- description editor (shared by create modal and General) ---------- */
  /**
   * @param {HTMLElement} root container
   * @param {{ value: string, rows?: number, autoGrow?: boolean, maxRows?: number, expandable?: boolean, onChange?: (v: string) => void }} opts
   */
  function mountDescEditor(root, opts) {
    const max = 10000;
    const state = { value: opts.value || '', mode: 'edit' };
    root.innerHTML = `
      <div class="flex items-center justify-between mb-1.5">
        <div class="seg sm" data-seg>
          <button class="on" data-mode="edit">编辑</button>
          <button data-mode="preview">预览</button>
        </div>
        <div class="flex items-center gap-2 text-xs t3">
          <span><i class="fa-brands fa-markdown mr-1"></i>支持 Markdown</span>
          ${opts.expandable ? '<button class="hdr-icon" style="width:26px;height:26px" data-expand title="展开编辑"><i class="fa-solid fa-up-right-and-down-left-from-center"></i></button>' : ''}
        </div>
      </div>
      <textarea class="input" data-ta rows="${opts.rows || 3}" maxlength="${max}" style="${opts.autoGrow ? 'resize:none;overflow-y:auto' : 'resize:vertical'}" placeholder="第一段写一句话简介；Figma、文档、Jira 等链接写成 [标题](地址)，会显示为快速入口"></textarea>
      <div class="input md hide" data-preview style="font-family:inherit;overflow:auto;${opts.autoGrow ? 'max-height:260px' : 'min-height:' + (opts.rows || 3) * 22 + 'px'}"></div>
      <div class="flex justify-between mt-1.5 text-xs t3">
        <span>第一段作为卡片摘要，其中的链接会显示为快速入口</span>
        <span data-count></span>
      </div>`;
    const ta = root.querySelector('[data-ta]');
    const preview = root.querySelector('[data-preview]');
    const count = root.querySelector('[data-count]');

    const grow = () => {
      if (!opts.autoGrow) return;
      ta.style.height = 'auto';
      const lineH = 21;
      ta.style.height =
        Math.min(ta.scrollHeight + 2, lineH * (opts.maxRows || 10) + 20) + 'px';
    };
    const sync = () => {
      count.textContent = `${state.value.length} / ${max}`;
      grow();
    };
    const set = (v, silent) => {
      state.value = v;
      if (ta.value !== v) ta.value = v;
      sync();
      if (state.mode === 'preview') renderMd(preview, v);
      if (!silent && opts.onChange) opts.onChange(v);
    };

    ta.addEventListener('input', () => set(ta.value));
    root.querySelector('[data-seg]').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      state.mode = b.dataset.mode;
      root
        .querySelectorAll('[data-seg] button')
        .forEach((x) => x.classList.toggle('on', x === b));
      ta.classList.toggle('hide', state.mode !== 'edit');
      preview.classList.toggle('hide', state.mode !== 'preview');
      if (state.mode === 'preview') renderMd(preview, state.value);
    });

    const expandBtn = root.querySelector('[data-expand]');
    if (expandBtn) {
      expandBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openExpandEditor(state.value, (v) => set(v));
      });
    }

    set(state.value, true);
    requestAnimationFrame(grow);
    return { get: () => state.value, set: (v) => set(v, true), refresh: grow };
  }

  function openExpandEditor(value, onDone) {
    const mask = document.createElement('div');
    mask.className = 'modal-mask';
    mask.style.padding = '24px';
    mask.innerHTML = `
      <div class="scard w-full max-w-6xl flex flex-col" style="height:calc(100vh - 48px)">
        <div class="flex items-center justify-between px-5 py-3 border-b bd">
          <div class="font-semibold">编辑描述</div>
          <button class="btn btn-primary" data-done>完成</button>
        </div>
        <div class="grid grid-rows-2 md:grid-rows-1 md:grid-cols-2 flex-1 min-h-0">
          <textarea class="input h-full" style="border:0;border-right:1px solid rgb(var(--border));border-radius:0;resize:none" maxlength="10000"></textarea>
          <div class="md p-5 overflow-auto"></div>
        </div>
      </div>`;
    document.body.appendChild(mask);
    const ta = mask.querySelector('textarea');
    const pv = mask.querySelector('.md');
    ta.value = value;
    renderMd(pv, value);
    ta.addEventListener('input', () => renderMd(pv, ta.value));
    mask.querySelector('[data-done]').addEventListener('click', () => {
      onDone(ta.value);
      mask.remove();
    });
    ta.focus();
  }

  /* ---------- theme + header ---------- */
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    localStorage.setItem(THEME_KEY, t);
  }

  function header(active) {
    const nav = [
      ['projects', '项目', 'projects.html'],
      ['teams', '团队', '#'],
      ['docs', '文档', '#'],
      ['cli', 'CLI', '#'],
      ['about', '关于', '#'],
      ['dev', '开发者', '#']
    ];
    return `
      <header class="hdr">
        <div class="max-w-7xl mx-auto h-full px-3 sm:px-6 flex items-center justify-between">
          <div class="flex items-center gap-6 min-w-0">
            <a href="index.html" class="flex items-center gap-2 t1 shrink-0">
              <span class="w-6 h-6 rounded-md bg-brand flex items-center justify-center text-[11px]"><i class="fa-solid fa-diamond"></i></span>
              <span class="font-bold whitespace-nowrap">PAM 资产中心</span>
              <span class="text-xs t3 hidden xl:inline whitespace-nowrap">多环境 · 仓库 · 变量 · 一处直达</span>
            </a>
            <nav class="hidden md:flex items-center gap-1">
              ${nav.map(([k, label, href]) => `<a class="nav-link whitespace-nowrap ${k === active ? 'on' : ''}" href="${href}">${label}</a>`).join('')}
            </nav>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <span class="hdr-icon max-sm:hidden"><i class="fa-brands fa-github"></i></span>
            <span class="hdr-icon" data-theme-toggle title="切换明暗"><i class="fa-solid fa-circle-half-stroke"></i></span>
            <span class="hdr-icon max-sm:hidden"><i class="fa-solid fa-language"></i></span>
            <span class="hdr-icon md:hidden"><i class="fa-solid fa-bars"></i></span>
            <span class="ml-1 sm:ml-2 w-8 h-8 rounded-full bg-brand-soft flex items-center justify-center text-sm font-bold">M</span>
          </div>
        </div>
      </header>`;
  }

  function init({ active, protoNote } = {}) {
    applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
    const mount = document.querySelector('[data-pam-header]');
    if (mount) {
      mount.outerHTML =
        (protoNote
          ? `<div class="proto-bar"><div class="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between gap-4"><span><i class="fa-solid fa-flask mr-1 brand"></i>${protoNote}</span><a class="brand" href="index.html">← 原型目录</a></div></div>`
          : '') + header(active);
    }
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-theme-toggle]')) {
        applyTheme(
          document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
        );
      }
    });
  }

  window.PamProto = {
    init,
    esc,
    PROJECTS,
    extractSummary,
    extractLinks,
    renderMd,
    loadRenderer,
    envChip,
    linkChip,
    linkIcon,
    linkIcons,
    coverHtml,
    mountDescEditor
  };
})();
