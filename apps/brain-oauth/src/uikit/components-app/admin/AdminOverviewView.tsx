'use client';

import { clsx } from 'clsx';
import { useLocale } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { LocaleLink } from '@/uikit/components/LocaleLink';
import { readAppApiJson } from '@/uikit/components-app/developer/apps/readAppApiJson';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { useUserAuth } from '@/uikit/hook/useUserAuth';
import type { AdminOverview } from '@shared/admin/adminDashboard';
import { isBrainAdminUser } from '@shared/auth/brainAdmin';
import { admin18n, adminShellI18n } from '@config/i18n-mapping/admin18n';
import { API_ADMIN_OVERVIEW, ROUTE_REQUEST_LOGS } from '@config/route';
import { fill, formatTime, localeTag, readLog } from './adminFormat';
import { LogMethod, ResultPill } from './AdminLogBits';

interface Trend {
  text: string;
  tone?: 'up' | 'down';
}

function signed(value: number, digits = 1): string {
  const text = `${Math.abs(value).toFixed(digits)}%`;
  return value > 0 ? `+${text}` : value < 0 ? `-${text}` : text;
}

export function AdminOverviewView() {
  const tt = useI18nMapping(admin18n);
  const shell = useI18nMapping(adminShellI18n);
  const locale = useLocale();
  const { user } = useUserAuth();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const tz = new Date().getTimezoneOffset();
      const response = await fetch(`${API_ADMIN_OVERVIEW}?tzOffset=${tz}`, {
        credentials: 'include'
      });
      setData(await readAppApiJson<AdminOverview>(response));
    } catch (error) {
      console.error('Load admin overview error:', error);
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const ownScope = data ? data.scope === 'own' : !isBrainAdminUser(user);

  const vsYesterday = (
    today: number | null,
    yesterday: number | null,
    delta: (t: number, y: number) => number,
    higherIsBetter: boolean
  ): Trend => {
    if (today === null || yesterday === null || yesterday === 0) {
      return { text: tt.statNoCompare };
    }
    const value = delta(today, yesterday);
    const good = higherIsBetter ? value > 0 : value < 0;
    return {
      text: fill(tt.statVsYesterday, { delta: signed(value) }),
      tone: value === 0 ? undefined : good ? 'up' : 'down'
    };
  };

  const stats: { key: string; label: string; value: string; trend: Trend }[] =
    [];
  if (data) {
    if (data.users) {
      stats.push({
        key: 'users',
        label: tt.statUsers,
        value: String(data.users.total),
        trend: {
          text: fill(tt.statUsersTrend, { n: data.users.newThisWeek }),
          tone: data.users.newThisWeek > 0 ? 'up' : undefined
        }
      });
    }
    stats.push(
      {
        key: 'apps',
        label: tt.statApps,
        value: String(data.apps.total),
        trend: { text: fill(tt.statAppsTrend, { n: data.apps.public }) }
      },
      {
        key: 'auth',
        label: tt.statAuth,
        value: String(data.authorizations.today),
        trend: vsYesterday(
          data.authorizations.today,
          data.authorizations.yesterday,
          (t, y) => ((t - y) / y) * 100,
          true
        )
      },
      {
        key: 'fail',
        label: tt.statFail,
        value: String(data.failures.today),
        trend: vsYesterday(
          data.failures.today,
          data.failures.yesterday,
          (t, y) => ((t - y) / y) * 100,
          false
        )
      }
    );
  }

  const maxDaily = Math.max(1, ...(data?.daily.map((d) => d.count) ?? []));

  return (
    <div data-testid="AdminOverviewView">
      <div className="brain-console-head">
        <div>
          <h1 className="brain-title">{tt.title}</h1>
          <p className="brain-desc">
            {ownScope ? tt.descriptionOwn : tt.description}
          </p>
        </div>
      </div>

      {failed ? (
        <div className="brain-card flat brain-empty">
          <div className="brain-empty-sphere" aria-hidden />
          <p>{shell.loadFailed}</p>
        </div>
      ) : !data ? (
        <div className="brain-empty" aria-busy>
          <span className="brain-spinner" aria-hidden />
        </div>
      ) : (
        <>
          <div className="brain-stats">
            {stats.map((stat) => (
              <div
                data-testid="AdminOverviewView"
                key={stat.key}
                className="brain-card flat brain-stat"
              >
                <span className="brain-label">{stat.label}</span>
                <div className="brain-stat-num">{stat.value}</div>
                <div className={clsx('brain-stat-trend', stat.trend.tone)}>
                  {stat.trend.text}
                </div>
              </div>
            ))}
          </div>

          <div className="brain-admin-two">
            <div className="brain-card flat">
              <h2 className="brain-card-title">
                <span>{tt.chartTitle}</span>
                <span className="brain-sub">{tt.chartSub}</span>
              </h2>
              <div className="brain-bars">
                {data.daily.map((day) => {
                  const label = new Date(day.date).toLocaleDateString(
                    localeTag(locale),
                    { weekday: 'short' }
                  );
                  return (
                    <div
                      data-testid="AdminOverviewView"
                      key={day.date}
                      title={`${label} · ${day.count}`}
                    >
                      <b>{day.count}</b>
                      <i
                        style={{
                          height: `${Math.round((day.count / maxDaily) * 110)}px`
                        }}
                      />
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="brain-card flat">
              <h2 className="brain-card-title">
                <span>{tt.recentTitle}</span>
                <LocaleLink
                  href={ROUTE_REQUEST_LOGS}
                  title={tt.viewAll}
                  className="brain-link"
                >
                  {tt.viewAll}
                </LocaleLink>
              </h2>
              {data.recent.length === 0 ? (
                <p className="brain-sub m-0">{tt.recentEmpty}</p>
              ) : (
                <div className="brain-recent">
                  {data.recent.map((row) => {
                    const log = readLog(row);
                    return (
                      <div data-testid="AdminOverviewView" key={row.id}>
                        <ResultPill success={row.success} status={log.status} />
                        <LogMethod method={log.method} />
                        <span className="brain-recent-path">{log.path}</span>
                        <time dateTime={row.created_at}>
                          {formatTime(row.created_at, locale)}
                        </time>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
