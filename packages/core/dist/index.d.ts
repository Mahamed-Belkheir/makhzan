export declare type ManagerConfig = {
    startTrx: (isolation?: string) => Promise<TransactionObject> | TransactionObject;
    isolations: unknown;
};
export interface TransactionObject {
    commit(): Promise<void>;
    rollback(): Promise<void>;
    done(): Promise<boolean>;
}
export declare type factory<T> = <V>(callback: (r: T) => Promise<V>) => Promise<V>;
export declare type TransactionFactory<I, T> = factory<T> & {
    [k in keyof I]: factory<T>;
};
export declare type TrxCallback = <T>(repos: any) => T;
export declare type RepositoryClass = abstract new (trx: any) => any;
interface ManagerBuilder<Isolations = {}, Repos = {}> {
    addRepository: <Key extends PropertyKey, Value extends RepositoryClass>(key: Key, value: Value) => ManagerBuilder<Isolations, Repos & {
        [K in Key]: () => InstanceType<Value>;
    }>;
    repositories: Repos;
    build: () => TransactionFactory<Isolations, Repos>;
}
export declare const Manager: <T extends ManagerConfig>(db: T) => ManagerBuilder<T["isolations"], {}>;
export {};
