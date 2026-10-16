import type { PamCliOutputAdapterInterface } from '../interfaces/PamCliOutputAdapterInterface';
import type {
  PamCliOutputFormatType,
  PamCliResolvedVarType
} from '../interfaces/PamCliTypes';
import { PamCliDotenvUtil } from './PamCliDotenvUtil';

/** Keys that need no quoting in YAML / TOML. */
const BARE_KEY = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * `.env` text: comments and `# pam:sensitive` markers kept (same serializer as pull).
 */
export class PamCliDotenvAdapter implements PamCliOutputAdapterInterface {
  public readonly format = 'dotenv' as const;

  /**
   * @override
   */
  public serialize(variables: readonly PamCliResolvedVarType[]): string {
    return PamCliDotenvUtil.serialize(variables);
  }
}

/**
 * Flat `{ "KEY": "value" }`.
 */
export class PamCliJsonAdapter implements PamCliOutputAdapterInterface {
  public readonly format = 'json' as const;

  /**
   * @override
   */
  public serialize(variables: readonly PamCliResolvedVarType[]): string {
    const record: Record<string, string> = {};
    for (const variable of variables) {
      record[variable.key] = variable.value;
    }
    return `${JSON.stringify(record, null, 2)}\n`;
  }
}

/**
 * Flat YAML mapping; values are double-quoted (JSON string escapes are valid YAML).
 */
export class PamCliYamlAdapter implements PamCliOutputAdapterInterface {
  public readonly format = 'yaml' as const;

  /**
   * @override
   */
  public serialize(variables: readonly PamCliResolvedVarType[]): string {
    if (variables.length === 0) {
      return '{}\n';
    }
    return variables
      .map((variable) => {
        const key = BARE_KEY.test(variable.key)
          ? variable.key
          : JSON.stringify(variable.key);
        return `${key}: ${JSON.stringify(variable.value)}\n`;
      })
      .join('');
  }
}

/**
 * Flat TOML table; values are basic strings with escapes.
 */
export class PamCliTomlAdapter implements PamCliOutputAdapterInterface {
  public readonly format = 'toml' as const;

  /**
   * @override
   */
  public serialize(variables: readonly PamCliResolvedVarType[]): string {
    return variables
      .map((variable) => {
        const key = BARE_KEY.test(variable.key)
          ? variable.key
          : PamCliTomlAdapter.quote(variable.key);
        return `${key} = ${PamCliTomlAdapter.quote(variable.value)}\n`;
      })
      .join('');
  }

  /**
   * TOML basic string (`"..."`).
   *
   * @param value - Raw value
   */
  public static quote(value: string): string {
    let out = '"';
    for (const ch of value) {
      const code = ch.codePointAt(0)!;
      if (ch === '"') {
        out += '\\"';
      } else if (ch === '\\') {
        out += '\\\\';
      } else if (ch === '\n') {
        out += '\\n';
      } else if (ch === '\r') {
        out += '\\r';
      } else if (ch === '\t') {
        out += '\\t';
      } else if (code < 0x20 || code === 0x7f) {
        out += `\\u${code.toString(16).padStart(4, '0')}`;
      } else {
        out += ch;
      }
    }
    return `${out}"`;
  }
}

/**
 * `--format` → adapter. Register new formats here; commands stay unchanged.
 */
export class PamCliOutputAdapterRegistry {
  protected static readonly adapters: Readonly<
    Record<PamCliOutputFormatType, PamCliOutputAdapterInterface>
  > = {
    dotenv: new PamCliDotenvAdapter(),
    json: new PamCliJsonAdapter(),
    yaml: new PamCliYamlAdapter(),
    toml: new PamCliTomlAdapter()
  };

  public static formats(): PamCliOutputFormatType[] {
    return Object.keys(this.adapters) as PamCliOutputFormatType[];
  }

  public static isFormat(value: string): value is PamCliOutputFormatType {
    return Object.prototype.hasOwnProperty.call(this.adapters, value);
  }

  public static get(format: PamCliOutputFormatType): PamCliOutputAdapterInterface {
    return this.adapters[format];
  }
}
