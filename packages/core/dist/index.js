"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Manager = void 0;
const Manager = (db) => {
    return {
        addRepository(key, repository) {
            //@ts-ignore
            this.repositories[key] = repository;
            return this;
        },
        repositories: {},
        build() {
            let TrxFac = async (callback, isolation) => {
                let trx = await db.startTrx(isolation);
                let p = new Proxy(this.repositories, {
                    get(target, key) {
                        return () => new target[key](trx);
                    }
                });
                return callback(p);
            };
            let trx = (callback) => TrxFac(callback);
            if (typeof db.isolations == "object") {
                for (let key in db.isolations) {
                    // @ts-ignore
                    trx[key] = (callback) => TrxFac(callback, db.isolations[key]);
                }
            }
            return trx;
        }
    };
};
exports.Manager = Manager;
