export class PurchasesUnavailable {

}

export class InsufficientBalance extends Error {

}

export class User {
    constructor(
        public name: string,
        public balance: number,
        public id?: number,
        public purchases?: Purchase[],
    ) { }

    public totalPurchasesCost() {
        if (!this.purchases) {
            throw new PurchasesUnavailable();
        }
        return this.purchases.reduce((t, p) => t+p.totalCost, 0);
    }

}


export class Purchase {
    constructor(
        public item: string,
        public userId: number,
        public totalCost: number,
        public id?: number
    ) { }
}

export interface IUserRepository {
    insert(data: User): Promise<User>;
    insertMany(data: User[]): Promise<Awaited<User>[]>;
    fetch(match?: Partial<User>| Partial<User>[]): Promise<User[]>;
    fetchOne(match?: Partial<User>| Partial<User>[]): Promise<User | undefined>;
    update(data: Partial<User>, match?: Partial<User>| Partial<User>[]): Promise<number>;
    updateAndFetch(data: Partial<User>, match?: Partial<User>| Partial<User>[]): Promise<User[]>;
    delete(match?: Partial<User>| Partial<User>[]): Promise<number>;
    fetchWithPurchases(match?: Partial<User>| Partial<User>[]): Promise<Required<User>[]>
}

export interface IPurchaseRepository {
    insert(data: Purchase): Promise<Purchase>;
    insertMany(data: Purchase[]): Promise<Awaited<Purchase>[]>;
    fetch(match?: Partial<Purchase>| Partial<Purchase>[]): Promise<Purchase[]>;
    fetchOne(match?: Partial<Purchase>| Partial<Purchase>[]): Promise<Purchase | undefined>;
    update(data: Partial<Purchase>, match?: Partial<Purchase>| Partial<Purchase>[]): Promise<number>;
    updateAndFetch(data: Partial<Purchase>, match?: Partial<Purchase>| Partial<Purchase>[]): Promise<Purchase[]>;
    delete(match?: Partial<Purchase>| Partial<Purchase>[]): Promise<number>;
    paginate(opts: {
        page: number;
        size: number;
    }, match?: Partial<Purchase>| Partial<Purchase>[]): Promise<{
        paginate: {
            page: number;
            size: number;
            total: number;
        };
        results: Purchase[];
    }>;
}