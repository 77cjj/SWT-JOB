/**
 * 深度合并翻译对象：override 覆盖 base，用于新语言在英文基础上做局部翻译。
 */
export type DeepPartial<T> = T extends string
  ? T
  : T extends readonly (infer U)[]
    ? readonly DeepPartial<U>[]
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;

export function mergeTranslations<T extends object>(base: T, override?: DeepPartial<T>): T {
  if (!override) return base;

  const result = { ...base } as T;
  const patch = override as Record<string, unknown>;

  for (const key of Object.keys(patch)) {
    const baseValue = (base as Record<string, unknown>)[key];
    const overrideValue = patch[key];

    if (overrideValue === undefined) continue;

    if (
      baseValue &&
      overrideValue &&
      typeof baseValue === 'object' &&
      typeof overrideValue === 'object' &&
      !Array.isArray(baseValue) &&
      !Array.isArray(overrideValue)
    ) {
      (result as Record<string, unknown>)[key] = mergeTranslations(
        baseValue as object,
        overrideValue as DeepPartial<object>,
      );
    } else {
      (result as Record<string, unknown>)[key] = overrideValue;
    }
  }

  return result;
}
