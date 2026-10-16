import type {
  PamCliOutputFormatType,
  PamCliResolvedVarType
} from './PamCliTypes';

/**
 * Serializes resolved variables into one output format (`pamenv render`).
 * Adapters never write files.
 */
export interface PamCliOutputAdapterInterface {
  /** Matches `--format`. */
  readonly format: PamCliOutputFormatType;

  /**
   * @param variables - Ordered variables
   * @returns Text ending with a newline
   */
  serialize(variables: readonly PamCliResolvedVarType[]): string;
}
