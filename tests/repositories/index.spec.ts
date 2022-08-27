import { Manager, ManagerConfig } from "@makhzan/core";
import { InsufficientBalance, IPurchaseRepository, IUserRepository, Purchase, User } from "./domain/entity";
import { ObjectionSetup } from "./objection";


export type RepositorySetup = {
    name: string,
    opts: ManagerConfig,
    repositories: {
        users:  new (trx: any) => IUserRepository,
        purchases:  new (trx: any) => IPurchaseRepository
    },
    before: () => Promise<void>
    after: () => Promise<void>
}

const plugins: RepositorySetup[] = [
    ObjectionSetup,
]

const users = [
    new User("john", 500),
    new User("alice", 500),
    new User("bob", 500),
    new User("sam", 500),
    new User("kibb", 500),
]


for (let plugin of plugins) {
    describe(`Base Repository | ${plugin.name}`, () => {
        const UoW = Manager(plugin.opts)
        .addRepository("users", plugin.repositories.users)
        .addRepository("purchases", plugin.repositories.purchases)
        .build()

        beforeAll(plugin.before);
        afterAll(plugin.after);
    
        describe("basic repository methods", () => {
            it("can create items", async () => {
                let fetchedUsers = await UoW(r => r.users().insertMany(users) as Promise<User[]>)
                expect(fetchedUsers.length).toBe(users.length);
                fetchedUsers.forEach(u => {
                    expect(u.id).toBeDefined()
                })
            })
        
            it("can read items", async () => {
                let john = await UoW(r => r.users().fetchOne({ name: "john" }));
                expect({...john, id: undefined}).toMatchObject(users[0]);

                let twoUsers = await (UoW(r => r.users().fetch([{ name: "sam" }, { name: "kibb" }])));
                expect(twoUsers!.length).toBe(2);

                twoUsers!.forEach(u => {
                    expect(users.find(x => x.name == u.name)).toBeDefined()
                })
            })
        
            it("can update items", async () => {
                let [john] = await UoW(r => r.users().updateAndFetch({balance: 1000}, { name: "john" }));
                expect(john).toMatchObject({ name: "john", balance: 1000 });

                let johnFetched = await UoW(r => r.users().fetchOne({ name: "john" }));
                expect(johnFetched).toMatchObject(john);
            })
        
            it("can delete items", async () => {
                let deleted = await UoW(r => r.users().delete({ name: "bob" }));
                expect(deleted).toBe(1);
                let notFound = await UoW(r => r.users().fetchOne({ name: "bob" }));
                expect(notFound).toBeUndefined();

            })
        })

        describe("more repository methods", () => {
            it("paginate Repository can paginate results", async () => {
                let john = await UoW(r => r.users().fetchOne({ name: "john" }));
                if (john == undefined) {
                    throw new Error("john not found");
                }
                let johnsId = john!.id!

                await UoW(async r => {
                    await r.purchases().insertMany([
                        new Purchase("thing", johnsId, 100),
                        new Purchase("thing", johnsId, 100),
                        new Purchase("thing", johnsId, 100),
                        new Purchase("thing", johnsId, 100),
                        new Purchase("thing", johnsId, 100),
                        new Purchase("thing", johnsId, 100),
                        new Purchase("thing", johnsId, 100),
                        new Purchase("thing", johnsId, 100),
                        new Purchase("thing", johnsId, 100),
                        new Purchase("thing", johnsId, 100),
                    ])

                    let data = await r.purchases().paginate({ page: 1, size: 5 })
                    expect(data.paginate.page).toBe(1);
                    expect(data.paginate.size).toBe(5);
                    expect(data.paginate.total).toBe(10);
                    expect(data.results!.length).toBe(5)
                    
                })
            })

            it("custom method 'fetch with join' maps results correctly", async () => {
                let [john] = await UoW(r => r.users().fetchWithPurchases({ name: "john" }));
                let purchases = await UoW(r => r.purchases().fetch({userId: john.id}))
                expect(purchases.length).toBe(10);
                expect(john.purchases).toBeDefined();
                expect(john.purchases.length).toBe(10);
            })
        })

        describe("Methods are within the same transaction context", () => {
            it("commits successful transactions", async () => {
                await UoW(async r => {
                    let sam = await r.users().fetchOne({ name: "sam" });
                    if (!sam) throw new Error("sam not found")
                    let newPurchase = new Purchase("new subscription", sam.id!, 500);
                    sam.balance! -= newPurchase.totalCost;
                    console.log(sam, newPurchase);
                    await r.users().update({ balance: sam.balance }, { name: sam.name });
                    console.log('before throw');
                    let fetchedSam = r.users().fetchWithPurchases({ name: "sam" }) as any;
                    console.log(fetchedSam)
                    expect(sam.balance).toBe(0);
                    if (sam.balance < 0) {
                        console.log("throwing error!")
                        throw new InsufficientBalance();
                    }
                    await r.purchases().insert(newPurchase);
                    console.log('done with transactions or something')
                });
                let [sam] = await UoW(r => r.users().fetchWithPurchases({ name: "sam" }));
                expect(sam.balance).toBe(0);
                expect(sam.purchases.length).toBe(1);
            })

            it("rollbacks transactions with errors", async () => {
                let didThrow = false;
                await UoW(async r => {
                    let alice = await r.users().fetchOne({ name: "alice" });
                    if (!alice) throw new Error("alice not found");
                    let newPurchase = new Purchase("new subscription", alice.id!, 1500);
                    alice.balance! -= newPurchase.totalCost;
                    await r.users().update({balance: alice.balance}, {name: alice.name});
                    if ((alice.balance! - newPurchase.totalCost) < 0) {
                        throw new InsufficientBalance();
                    }
                    await r.purchases().insert(newPurchase);
                }).catch(e => {
                    didThrow = true;
                    expect(e).toBeInstanceOf(InsufficientBalance);
                });
                expect(didThrow).toBeTruthy();
                let [alice] = await UoW(r => r.users().fetchWithPurchases({ name: "alice" }));
                expect(alice.balance).toBe(500);
                expect(alice.purchases.length).toBe(0);
            })

        })
    })
}