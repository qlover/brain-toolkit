/**
 * Structural type for create-modal + environments shared env UI.
 *
 * Fields read by PAMFormEnvironments, PAMFormEnvironmentBlock,
 * PAMFormEnvImportPanel, and PAMFormEnvironmentVarRow.
 */
export type PAMEnvFormI18n = {
  readonly envTip: string;
  readonly envVarImportEmpty: string;
  readonly envVarImportResult: string;
  readonly mulitEnv: string;
  readonly envAdd: string;
  readonly envDirectTitle: string;
  readonly envVarImportInvalid: string;
  readonly placeholderEnvName: string;
  readonly collapsed: string;
  readonly uncollapsed: string;
  readonly envDelete: string;
  readonly envUrlTitle: string;
  readonly placeholderEnvUrl: string;
  readonly envVarTitle: string;
  readonly envVarImport: string;
  readonly envVarImportFile: string;
  readonly envVarAdd: string;
  readonly noEnvVar: string;
  readonly envVarImportPlaceholder: string;
  readonly envVarImportCancel: string;
  readonly envVarImportConfirm: string;
  readonly placeholderEnvVar: string;
  readonly envVarSensitivePlaceholder: string;
  readonly placehoderEnvValue: string;
  readonly envVarSensitiveLocked: string;
  readonly envVarSensitive: string;
};
