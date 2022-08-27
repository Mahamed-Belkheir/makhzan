"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationRepository = exports.BaseRepository = void 0;
class BaseRepository {
    constructor({ trx }) {
        this.trx = trx;
    }
    q() {
        return this.modelClass.query().transacting(this.trx);
    }
    matchQuery(match) {
        let q = this.q();
        if (Array.isArray(match)) {
            q.where(match[0]);
            for (let i = 1; i < match.length; i++) {
                q.orWhere(match[i]);
            }
        }
        else if (match) {
            q.where(match);
        }
        return q;
    }
    async insert(data) {
        console.log("inserting:", data);
        return this.q().insert(data).debug().then(this.mapResult);
    }
    async insertMany(data) {
        return Promise.all(data.map(d => this.insert(d)));
    }
    async fetch(match) {
        return this.matchQuery(match).then(this.mapResult);
    }
    async fetchOne(match) {
        return this.matchQuery(match).first().then(this.mapResult);
    }
    async update(data, match) {
        return this.matchQuery(match).debug().update(data);
    }
    async updateAndFetch(data, match) {
        await this.update(data, match);
        return this.fetch(match);
    }
    async delete(match) {
        return this.matchQuery(match).delete();
    }
}
exports.BaseRepository = BaseRepository;
class PaginationRepository extends BaseRepository {
    async paginate({ page, size } = { page: 1, size: 20 }, match) {
        let q = this.matchQuery(match);
        let [total, results] = await Promise.all([
            q.clone().resultSize(),
            q.offset((page - 1) * size).limit(size).then(this.mapResult)
        ]);
        return {
            paginate: {
                page, size, total
            },
            results
        };
    }
}
exports.PaginationRepository = PaginationRepository;
