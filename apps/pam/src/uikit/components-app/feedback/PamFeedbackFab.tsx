'use client';

import { ResponsiveModal } from '@brain-toolkit/next-app-kit/client';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useMemo, useState, type ReactNode } from 'react';
import { PamFeedbackForm } from '@/uikit/components-app/feedback/PamFeedbackForm';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { useUserAuth } from '@/uikit/hook/useUserAuth';
import { feedbackFormI18n } from '@config/i18n-mapping/feedbackFormI18n';
import { PamUserFeedbackCategory } from '@schemas/PamUserFeedbackSchema';

/**
 * 登录后全局浮动反馈入口：打开 Modal 提交（主站与 Admin 共用）。
 */
export function PamFeedbackFab(): ReactNode {
  const { success } = useUserAuth();
  const [open, setOpen] = useState(false);
  const tt = useI18nMapping(feedbackFormI18n);

  const formLabels = useMemo(
    () => ({
      category: tt.category,
      body: tt.body,
      bodyPlaceholder: tt.bodyPlaceholder,
      screenshots: tt.screenshots,
      screenshotsAdd: tt.screenshotsAdd,
      deviceNotice: tt.deviceNotice,
      submit: tt.submit,
      submitting: tt.submitting,
      success: tt.success,
      screenshotsError: tt.screenshotsError,
      error: tt.error,
      categories: {
        [PamUserFeedbackCategory.bug]: tt.categoryBug,
        [PamUserFeedbackCategory.ux]: tt.categoryUx,
        [PamUserFeedbackCategory.feature]: tt.categoryFeature,
        [PamUserFeedbackCategory.performance]: tt.categoryPerformance,
        [PamUserFeedbackCategory.content]: tt.categoryContent,
        [PamUserFeedbackCategory.other]: tt.categoryOther
      }
    }),
    [tt]
  );

  if (!success) {
    return null;
  }

  return (
    <div data-testid="PamFeedbackFab">
      <button
        type="button"
        data-testid="PamFeedbackFabButton"
        aria-label={tt.fab}
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-40 inline-flex items-center justify-center gap-2 rounded-full bg-brand p-3 text-sm font-medium text-on-brand shadow-lg transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:right-6 sm:bottom-6 sm:px-4 sm:py-3"
      >
        <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden />
        <span className="hidden sm:inline">{tt.fab}</span>
      </button>
      <ResponsiveModal
        open={open}
        title={tt.modalTitle}
        onClose={() => setOpen(false)}
        closeLabel={tt.close}
        showFullscreenToggle={false}
        bodyClassName="px-4 py-4 sm:px-6 sm:py-5"
      >
        <PamFeedbackForm
          labels={formLabels}
          onSubmitted={() => setOpen(false)}
        />
      </ResponsiveModal>
    </div>
  );
}
