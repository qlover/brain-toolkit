import { AppstoreOutlined, PlusOutlined } from '@ant-design/icons';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';

interface PAMPageHeaderProps {
  tt: PAMI18nInterface;
  onCreate: () => void;
}

export function PAMPageHeader({ tt, onCreate }: PAMPageHeaderProps) {
  return (
    <header
      data-testid="PAMPageHeader"
      className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="from-brand to-brand-active flex shrink-0 rounded-xl bg-gradient-to-br p-2.5 shadow-md">
          <AppstoreOutlined className="text-on-brand text-xl" />
        </div>
        <div>
          <h1 className="text-primary-text text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
            {tt.title}
          </h1>
          <p className="text-secondary-text xs:block hidden text-xs sm:text-sm">
            {tt.subtitle}
          </p>
        </div>
      </div>

      <button
        type="button"
        id="addProjectBtn"
        onClick={onCreate}
        className="bg-brand hover:bg-brand-hover active:bg-brand-active text-on-brand touch-target flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium shadow-md transition sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm"
      >
        <PlusOutlined />
        <span className="xs:inline hidden">{tt.addPam}</span>
        <span className="xs:hidden">{tt.addPamsm}</span>
      </button>
    </header>
  );
}
