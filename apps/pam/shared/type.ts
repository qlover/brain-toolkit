export type Join<T extends readonly string[]> = T extends readonly []
  ? ''
  : T extends readonly [infer Head extends string]
    ? Head
    : T extends readonly [
          infer Head extends string,
          ...infer Rest extends string[]
        ]
      ? `${Head},${Join<Rest>}`
      : string;
