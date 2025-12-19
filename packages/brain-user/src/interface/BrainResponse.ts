export type BrainResponse<T> = T & {
  /**
   * 当有这个属性的时候表示发生了错误
   */
  non_field_errors?: string[];
};

