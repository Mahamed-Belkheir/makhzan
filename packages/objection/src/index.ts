import { ModelClass, Model } from "objection"

interface Transaction {
    trx?: any
}

type MatchQuery<T> = Partial<T> | Partial<T>[]

export abstract class BaseRepository<T> {
    protected trx: any
    protected abstract modelClass: ModelClass<Model>;
    protected abstract mapResult: (data: any | any[]) => T | T[] | undefined;

    constructor(
        { trx }: Transaction
    ) {
        this.trx = trx;
    }

    protected q() {
        return this.modelClass.query().transacting(this.trx);
    }

    protected matchQuery(match?: MatchQuery<T>) {
        let q = this.q()
        if (Array.isArray(match)) {
            q.where(match[0])
            for (let i = 1; i < match.length; i++) {
                q.orWhere(match[i])
            }
        } else if (match) {
            q.where(match)
        }
        return q;
    }

    public async insert(data: T) {
        return this.q().insert(data).then(this.mapResult) as Promise<T>; 
    }

    public async insertMany(data: T[]) {
        return Promise.all(data.map(d => this.insert(d)))
    }

    public async fetch(match?: MatchQuery<T>) {
        return this.matchQuery(match).then(this.mapResult) as Promise<T[]>;
    }
    public async fetchOne(match?: MatchQuery<T>) {
        return this.matchQuery(match).first().then(this.mapResult) as Promise<T | undefined>;
    }
    public async update(data: Partial<T>, match?: MatchQuery<T>) {
        return this.matchQuery(match).update(data);
    }
    public async updateAndFetch(data: Partial<T>, match?: MatchQuery<T>) {
        await this.update(data, match);
        return this.fetch(match);
    }
    public async delete(match?: MatchQuery<T>) {
        return this.matchQuery(match).delete();
    }
}

type PaginationOptions = {
    page: number
    size: number
}

export abstract class PaginationRepository<T> extends BaseRepository<T> {
    public async paginate({ page, size }: PaginationOptions = { page: 1, size: 20},  match?: MatchQuery<T>) {
        let q = this.matchQuery(match);
        let [ total, results ] =  await Promise.all([
            q.clone().resultSize(),
            q.offset((page-1) * size).limit(size).then(this.mapResult) as Promise<T[]>
        ])
        return {
            paginate: {
                page, size, total
            },
            results
        }
    }
}