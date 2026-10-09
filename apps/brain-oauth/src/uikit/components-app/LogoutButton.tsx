'use client';

import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { Button, Tooltip } from '@qlover/next-kit/client';
import { clsx } from 'clsx';
import { useCallback } from 'react';
import {
  COMMON_LOGOUT_DIALOG_CONTENT,
  COMMON_LOGOUT_DIALOG_TITLE
} from '@config/i18n-identifier/common/common';
import { I } from '@config/ioc-identifiter';
import { useI18nMapping } from '../hook/useI18nMapping';
import { useIOC } from '../hook/useIOC';

/** Confirm dialog, then sign out and go to login. Returns the dialog title too. */
export function useLogoutConfirm(): { title: string; confirm: () => void } {
  const dialogHandler = useIOC(I.DialogHandler);
  const userService = useIOC(I.UserServiceInterface);
  const routerService = useIOC(I.RouterServiceInterface);

  const tt = useI18nMapping({
    title: COMMON_LOGOUT_DIALOG_TITLE,
    content: COMMON_LOGOUT_DIALOG_CONTENT
  });

  const confirm = useCallback(() => {
    dialogHandler.confirm({
      title: tt.title,
      content: tt.content,
      onOk: async () => {
        await userService.logout();
        routerService.gotoLogin();
      }
    });
  }, [tt, dialogHandler, userService, routerService]);

  return { title: tt.title, confirm };
}

export function LogoutButton(props: { showLabel?: boolean }) {
  const { showLabel = false } = props;
  const { title, confirm } = useLogoutConfirm();

  return (
    <Tooltip title={title} placement="bottom">
      <Button
        variant={showLabel ? 'header' : 'ghost'}
        aria-label={title}
        data-testid="LogoutIcon"
        className={clsx(
          !showLabel &&
            'text-primary-text hover:text-red-500 hover:bg-transparent border-0 bg-transparent p-0 shadow-none',
          showLabel && 'hover:text-red-500 hover:border-red-500/40'
        )}
        onClick={confirm}
      >
        <ArrowRightOnRectangleIcon
          className={showLabel ? 'h-4 w-4' : 'h-5 w-5'}
        />
        {showLabel && <span className="max-sm:hidden inline">{title}</span>}
      </Button>
    </Tooltip>
  );
}
