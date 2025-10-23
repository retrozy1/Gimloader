export type FunctionKeys<T extends object> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];