export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function promiseWithCancel() {
  let cancel = () => {};
  const p = new Promise<never>((_, rej) => {
    cancel = rej;
  });
  Object.defineProperty(p, "cancel", { value: cancel, writable: false });
  return p as Promise<never> & { cancel: VoidFunction };
}
