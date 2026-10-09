/* Brain OAuth 原型共享脚本 —— 工具栏、主题 / 语言 / 视图切换、多语言、图标 */
(function () {
  const BRAIN_PATH =
    'M777.79,533.74c-77.45-7.06-134.42-44.33-166.64-117.19-8.59-19.42-17.07-38.9-25.83-58.24-6.25-13.79-22.34-18.15-34.77-9.56-6.35,4.38-12.44,9.13-18.73,13.6a30.94,30.94,0,0,1-34.33.94c-10.17-6.44-15.81-18.76-13.8-30.14,2.3-13,11.3-22.36,24.26-25a29.56,29.56,0,0,1,24.79,5.76c6.12,4.69,12,9.7,18.07,14.45C563.15,338,579.55,334.73,587,321c10.35-19.07,20.47-38.27,30.78-57.37,30-55.56,76-89.4,138.35-99.42A187.36,187.36,0,0,1,966.42,297.46c19.81,68.86-3.13,144.09-58,190.63a186.58,186.58,0,0,1-99.87,43.78C798.68,533.08,788.7,533.11,777.79,533.74Zm-127.35-191c-2.61,73.53,55.79,135.63,130.15,138.38S918,426,920.6,352.3,864.82,216.7,790.42,213.91,653.06,269,650.44,342.72Z';

  const stroke = (d, w = 1.8) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

  const ICONS = {
    github:
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z"/></svg>',
    moon: stroke('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>'),
    sun: stroke(
      '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
    ),
    arrow: stroke('<path d="M5 12h14M13 6l6 6-6 6"/>', 2),
    chevron: stroke('<path d="m6 9 6 6 6-6"/>', 2.4),
    copy: stroke(
      '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'
    ),
    check: stroke('<path d="m5 12 5 5 9-10"/>', 2.2),
    plus: stroke('<path d="M12 5v14M5 12h14"/>', 2),
    close: stroke('<path d="M6 6l12 12M18 6 6 18"/>', 2),
    edit: stroke('<path d="M4 20h4L19 9l-4-4L4 16v4Z"/>'),
    key: stroke(
      '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3"/>'
    ),
    trash: stroke(
      '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'
    ),
    logout: stroke('<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>'),
    lock: stroke(
      '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'
    ),
    shield: stroke(
      '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>'
    ),
    info: stroke(
      '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'
    ),
    warn: stroke(
      '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17h.01"/>'
    ),
    code: stroke('<path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 4l-4 16"/>'),
    cloud: stroke(
      '<path d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8H7Z"/>'
    ),
    flask: stroke(
      '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/>'
    ),
    book: stroke(
      '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>'
    ),
    search: stroke('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    refresh: stroke(
      '<path d="M20 11a8 8 0 0 0-14.9-3M4 5v4h4M4 13a8 8 0 0 0 14.9 3M20 19v-4h-4"/>'
    ),
    grid: stroke(
      '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>'
    ),
    users: stroke(
      '<circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 7M21 20a6 6 0 0 0-4-5.6"/>'
    ),
    list: stroke(
      '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
      2
    ),
    gear: stroke(
      '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>'
    ),
    external: stroke(
      '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'
    ),
    eye: stroke(
      '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'
    )
  };

  function icon(name) {
    return ICONS[name] || '';
  }

  const COMMON = {
    zh: {
      github: 'GitHub',
      theme: '主题',
      lang: '语言',
      footer: '© 2026 Brain OAuth',
      docs: '集成文档'
    },
    en: {
      github: 'GitHub',
      theme: 'Theme',
      lang: 'Language',
      footer: '© 2026 Brain OAuth',
      docs: 'Docs'
    }
  };

  const BASE_GROUPS = [
    {
      key: 'theme',
      label: '主题',
      options: [
        ['light', '亮色'],
        ['dark', '暗色']
      ]
    },
    {
      key: 'lang',
      label: '语言',
      options: [
        ['zh', '中文'],
        ['en', 'English']
      ]
    },
    {
      key: 'device',
      label: '视图',
      options: [
        ['desktop', '桌面'],
        ['mobile', '手机']
      ]
    }
  ];

  const SHARED_KEYS = ['theme', 'lang', 'device'];
  const STORAGE_KEY = 'brain-oauth-proto';

  function loadShared() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function saveShared(state) {
    try {
      const shared = {};
      SHARED_KEYS.forEach((key) => (shared[key] = state[key]));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shared));
    } catch {
      /* 静态打开时 localStorage 不可用也不影响原型 */
    }
  }

  const proto = {
    state: {},
    dict: {},
    icon,
    render: () => {},
    toast
  };

  function renderBar(title, groups, isIndex) {
    const bar = document.createElement('div');
    bar.className = 'proto-bar';
    bar.innerHTML =
      (isIndex ? '' : '<a href="index.html">← 原型目录</a>') +
      `<strong>${title}</strong>` +
      groups
        .map(
          (g) =>
            `<div class="proto-group" data-key="${g.key}"><span>${g.label}</span>` +
            g.options
              .map(([v, l]) => `<button data-value="${v}">${l}</button>`)
              .join('') +
            '</div>'
        )
        .join('');
    document.body.prepend(bar);

    bar.addEventListener('click', (event) => {
      const btn = event.target.closest('.proto-group button');
      if (!btn) return;
      proto.state[btn.parentElement.dataset.key] = btn.dataset.value;
      proto.render();
    });
  }

  function fillStatic() {
    document.querySelectorAll('svg.brain-logo').forEach((svg) => {
      svg.setAttribute('viewBox', '0 0 490.16 371.96');
      svg.setAttribute('fill', 'currentColor');
      svg.innerHTML = `<path d="${BRAIN_PATH}" transform="translate(-483.29 -161.78)"/>`;
    });

    document.querySelectorAll('[data-icon]').forEach((el) => {
      el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon));
    });

    document.querySelectorAll('[data-std-actions]').forEach((el) => {
      el.insertAdjacentHTML(
        'afterbegin',
        `<a class="round-btn" href="#" data-i18n-title="github" aria-label="GitHub">${icon('github')}</a>` +
          '<button class="round-btn" data-toggle="theme" data-i18n-title="theme"></button>' +
          '<button class="round-btn" data-toggle="lang" data-i18n-title="lang"></button>'
      );
    });

    document.querySelectorAll('.bg').forEach((bg) => {
      bg.innerHTML =
        '<div class="disc"></div>' +
        ['sm', 'lg', 'xs1', 'xs2', 'xs3', 'xs4']
          .map((s) => `<div class="sphere sphere-${s}"></div>`)
          .join('');
    });

    const stage = document.getElementById('stage');
    stage.insertAdjacentHTML('beforeend', '<div class="toasts"></div>');

    stage.addEventListener('click', (event) => {
      const toggle = event.target.closest('[data-toggle]');
      if (!toggle) return;
      const key = toggle.dataset.toggle;
      proto.state[key] =
        key === 'theme'
          ? proto.state.theme === 'dark'
            ? 'light'
            : 'dark'
          : proto.state.lang === 'zh'
            ? 'en'
            : 'zh';
      proto.render();
    });
  }

  function toast(message) {
    const box = document.querySelector('#stage .toasts');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    box.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  /**
   * @param {object} options
   * @param {string} options.title 工具栏标题
   * @param {{zh: object, en: object}} options.i18n 页面文案，值可以是字符串或函数
   * @param {Array} [options.groups] 页面额外的工具栏分组
   * @param {object} [options.state] 页面额外状态的默认值
   * @param {(state: object, dict: object) => void} [options.onRender]
   * @param {boolean} [options.isIndex] 目录页不显示返回链接
   */
  function init({
    title,
    i18n,
    groups = [],
    state = {},
    onRender,
    isIndex = false
  }) {
    Object.assign(
      proto.state,
      { theme: 'light', lang: 'zh', device: 'desktop' },
      state,
      loadShared()
    );

    const stage = document.getElementById('stage');
    const pageKeys = groups.map((g) => g.key).concat(Object.keys(state));

    proto.render = function render() {
      const s = proto.state;
      const dict = { ...COMMON[s.lang], ...i18n[s.lang] };
      proto.dict = dict;

      stage.className = [
        'stage',
        `theme-${s.theme}`,
        s.device === 'mobile' ? 'is-mobile' : '',
        ...[...new Set(pageKeys)].map((key) => `${key}-${s[key]}`)
      ].join(' ');

      const text = (key) =>
        typeof dict[key] === 'function' ? dict[key]() : dict[key];
      document.querySelectorAll('[data-i18n]').forEach((el) => {
        const value = text(el.dataset.i18n);
        if (value !== undefined) el.textContent = value;
      });
      document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
        el.placeholder = text(el.dataset.i18nPlaceholder) ?? '';
      });
      document.querySelectorAll('[data-i18n-title]').forEach((el) => {
        el.title = text(el.dataset.i18nTitle) ?? '';
      });

      document.querySelectorAll('[data-toggle="theme"]').forEach((el) => {
        el.innerHTML = icon(s.theme === 'dark' ? 'sun' : 'moon');
      });
      document.querySelectorAll('[data-toggle="lang"]').forEach((el) => {
        el.textContent = s.lang === 'zh' ? '中' : 'EN';
      });
      document.documentElement.lang = s.lang === 'zh' ? 'zh-CN' : 'en';

      document.querySelectorAll('.proto-group').forEach((group) => {
        group.querySelectorAll('button').forEach((btn) => {
          btn.classList.toggle(
            'on',
            s[group.dataset.key] === btn.dataset.value
          );
        });
      });

      saveShared(s);
      if (onRender) onRender(s, dict);
    };

    renderBar(title, [...BASE_GROUPS, ...groups], isIndex);
    fillStatic();
    proto.render();
    return proto;
  }

  proto.init = init;
  window.BrainProto = proto;
})();
