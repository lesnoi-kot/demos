export function assert(expr: boolean, msg: string = "Assertion error") {
  if (!expr) {
    throw new Error(msg);
  }
}

export function assertValue<T>(
  value: T,
  msg: string = "Assertion error",
): asserts value is NonNullable<T> | never {
  if (!value) {
    throw new Error(msg);
  }
}
