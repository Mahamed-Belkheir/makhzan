export type ManagerConfig = {
    startTrx: (isolation?: string) => Promise<TransactionObject> | TransactionObject,
    isolations: unknown
}

export interface TransactionObject {
    commit(): Promise<void>
    rollback(): Promise<void>
    done(): Promise<boolean>
}

export type factory<T> = <V>(callback: (r: T) => Promise<V>) => Promise<V>

export type TransactionFactory<I, T> = factory<T> & {
    [k in keyof I]: factory<T>
}

export type TrxCallback = <T>(repos: any) => T

export type RepositoryClass = abstract new (trx: any) => any

interface ManagerBuilder<Isolations = {}, Repos = {}> {
    addRepository: <Key extends PropertyKey, Value extends RepositoryClass>(
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
                try {
                    let result = await callback(p)
                    if (!await trx.done()) {
                        await trx.commit()
                    }
                    return result;
                } catch(e) {
                    if (!await trx.done()) {
                        await trx.rollback()
                    }
                    throw e;
                }
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