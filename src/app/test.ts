// type CustomReturnType<T extends (...arg: any[]) => any> = T extends (
//   ...arg: any[]
// ) => infer R
//   ? R
//   : never;

//   type CustomAwaited<T> = T  extends Promise<infer p> ? p : T;

// type A =CustomAwaited<CustomReturnType<typeof fetch>>;

// type KeyValueSplitter <T extends string> = T extends ` ${infer k}_${infer v}`? {
//     key:k,
//     value:v
// }: never

// type A = KeyValueSplitter<" name_zhangsan">;

// type O = {
//   readonly name: string;
//   age?: number;
// };

// type New<T extends Record<string, any>> = {
//   -readonly [P in keyof T as `getUser${Capitalize<P & string>}`]-?:() => T[P];
// };

// const a: New<O> = {
//     getUserName: () => "zhangsan",
//     getUserAge: () => 45
    
// };

// a.name = "ssss";
// a.age = 45;
