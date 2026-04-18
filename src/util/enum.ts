export function getEnumKey<T>(
  obj: Record<string, string | number>,
  value: string | number,
) {
  return Object.keys(obj).find((key) => obj[key] === value) as T;
}
