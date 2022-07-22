export type ManagerConfig = {
    startTrx: (isolation?: string) => any,
    isolations: unknown
}

type factory<T> = <V>(callback: (r: T) => V | Promise<V>) => V | Promise<V>

type TransactionFactory<I, T> = factory<T> & {
    [k in keyof I]: factory<T>
}

type TrxCallback = <T>(repos: any) => T

type Class = abstract new (...args: any) => any

interface ManagerBuilder<Isolations = {}, Repos = {}> {
    addRepository: <Key extends PropertyKey, Value extends Class>(
      key: Key,
      value: Value
    ) => ManagerBuilder<Isolations, Repos & { [K in Key]: () => InstanceType<Value> }>;
    repositories: Repos;
    build: () => TransactionFactory<Isolations, Repos>
}

export const Manager = <T extends ManagerConfig>(db: T): ManagerBuilder<T['isolations']> => {
    return {
        addRepository(key, repository) {
            //@ts-ignore
            this.repositories[key] = repository;
            return this;
        },
        repositories: {},
        build() {            
            let TrxFac = async (callback: TrxCallback, isolation?: string) => {
                let trx = await db.startTrx(isolation)
                let p = new Proxy(this.repositories, {
                    get(target: any, key: any) {
                        return () => new target[key](trx)
                    }
                })
                return callback(p)
            }
            let trx = (callback: TrxCallback) => TrxFac(callback)
            if (typeof db.isolations == "object") {
                for (let key in db.isolations) {
                    // @ts-ignore
                    trx[key] = (callback: TrxCallback) => TrxFac(callback, db.isolations[key])
                }
            }
            return trx;
        }
    } as ManagerBuilder<T["isolations"]>
} 