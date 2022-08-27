import { ModelClass, Model } from "objection";
interface Transaction {
    trx?: any;
}
declare type MatchQuery<T> = Partial<T> | Partial<T>[];
export declare abstract class BaseRepository<T> {
    protected trx: any;
    protected abstract modelClass: ModelClass<Model>;
    protected abstract mapResult: (data: any | any[]) => T | T[] | undefined;
    constructor({ trx }: Transaction);
    protected q(): import("objection").QueryBuilder<Model, Model[]>;
    protected matchQuery(match?: MatchQuery<T>): import("objection").QueryBuilder<Model, Model[]>;
    insert(data: T): Promise<T>;
    insertMany(data: T[]): Promise<Awaited<T>[]>;
    fetch(match?: MatchQuery<T>): Promise<T[]>;
    fetchOne(match?: MatchQuery<T>): Promise<T | undefined>;
    update(data: Partial<T>, match?: MatchQuery<T>): Promise<number>;
    updateAndFetch(data: Partial<T>, match?: MatchQuery<T>): Promise<T[]>;
    delete(match?: MatchQuery<T>): Promise<number>;
}
declare type PaginationOptions = {
    page: number;
    size: number;
};
export declare abstract class PaginationRepository<T> extends BaseRepository<T> {
    paginate({ page, size }?: PaginationOptions, match?: MatchQuery<T>): Promise<{
        paginate: {
            page: number;
            size: number;
            total: number;
        };
        results: T[];
    }>;
}
export {};
