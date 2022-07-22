export declare type ManagerConfig = {
    startTrx: (isolation?: string) => any;
    isolations: unknown;
};
declare type factory<T> = <V>(callback: (r: T) => V | Promise<V>) => V | Promise<V>;
declare type TransactionFactory<I, T> = factory<T> & {
    [k in keyof I]: factory<T>;
};
declare type Class = abstract new (...args: any) => any;
interface ManagerBuilder<Isolations = {}, Repos = {}> {
    addRepository: <Key extends PropertyKey, Value extends Class>(key: Key, value: Value) => ManagerBuilder<Isolations, Repos & {
        [K in Key]: () => InstanceType<Value>;
    }>;
    repositories: Repos;
    build: () => TransactionFactory<Isolations, Repos>;
}
export declare const Manager: <T extends ManagerConfig>(db: T) => ManagerBuilder<T["isolations"], {}>;
export {};
