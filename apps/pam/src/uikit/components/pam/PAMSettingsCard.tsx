import {
  SettingsCard,
  type SettingsCardProps
} from '@brain-toolkit/next-app-kit/client';
import React from 'react';

export type PAMSettingsCardProps = SettingsCardProps;

/**
 * Vercel-style settings section card with optional per-section Save.
 *
 * @example
 * <PAMSettingsCard title="Name" description="..." onSave={save} saveLabel="Save">
 *   <input />
 * </PAMSettingsCard>
 */
export const PAMSettingsCard: React.FC<PAMSettingsCardProps> = ({
  testId = 'PAMSettingsCard',
  ...props
}) => <SettingsCard testId={testId} {...props} />;
