import { Manager } from "@makhzan/core";
import Knex from "knex";

let knex = Knex({
    client: "sqlite3",
    connection: ":memory:"
})

class InsufficientBalance extends Error {

}

beforeAll(async () => {
    await knex.schema
    .createTable("users", t => {
        t.increments("id").primary();
        t.string("name");
        t.bigInteger("balance");
    })
    .createTable("purchases", t => {
        t.increments("id").primary();
        t.integer("user_id").references("users.id");
        t.string("item");
        t.integer("total_cost");
    })
})

afterAll(async () => {
    await knex.schema
    .dropTable("users")
    .dropTable("purchases")

    await knex.destroy()
})



const opts = {
    startTrx: async (isolationLevel?: string ) => {
        if (isolationLevel != "serializable") {
            isolationLevel = undefined;
        }
        let trx = await knex.transaction({ isolationLevel });
        return {
            trx,
            async commit() {
                await trx.commit()
            },
            async rollback() {
                await trx.rollback()
            },
            async done() {
                return trx.isCompleted()
            }
        }
    },
    isolations: {
        serializable: "serializable"
    }
}


class BaseRepository {
    trx: any
    protected tableName = ""
    constructor(
        {trx}:  any
    ) {
        this.trx = trx;
    }

    private q() {
        return knex(this.tableName).transacting(this.trx);
    }

    insert(data: any) {
        return this.q().insert(data);
    }

    update(where: any, data: any) {
        return this.q().where(where).update(data);
    }

    findOne(where: any) {
        return this.q().where(where).first();
    }
}

class UserRepository extends BaseRepository {
    protected tableName: string = "users"
}

class PurchaseRepository extends BaseRepository {
    protected tableName: string = "purchases"
}

const UoW = Manager(opts)
.addRepository("users", UserRepository)
.addRepository("purchases", PurchaseRepository)
.build();


describe.only("UoW Repository Manager | knex", () => {
    it("can retrieve results", async () => {
        let userData = { name: "bob", balance: 100 };
        await knex("users").insert(userData);

        let userResult = await UoW(r => r.users().findOne({ name: "bob" }));
        expect(userResult).toMatchObject(userData);
    })
    it("can save results", async () => {
        let userData = { name: "alice", balance: 200 };
        await UoW(r => r.users().insert(userData));

        let userResult = await knex("users").where({ name: "alice" }).first();
        expect(userResult).toMatchObject(userData);

        await UoW(async r => {
            let bob = await r.users().findOne({name: "bob"});
            let alice = await r.users().findOne({name: "alice"});
            bob.balance -= 100;
            alice.balance += 100;
            await r.users().update({id: bob.id}, bob);
            await r.users().update({id: alice.id}, alice);
        })

        let alice = await knex("users").where({ name: "alice" }).first();
        expect(alice.balance).toBe(300) 
        let bob = await knex("users").where({ name: "bob" }).first();
        expect(bob.balance).toBe(0) 
    })
    it("does not save results from rollbacks", async () => {
        let didThrow = false;
        try {
            await UoW(async r => {
                let bob = await r.users().findOne({name: "bob"});
                let alice = await r.users().findOne({name: "alice"});
                bob.balance -= 100;
                if (bob.balance < 100) {
                    throw new InsufficientBalance();
                }
                alice.balance += 100;
                await r.users().update({id: bob.id}, bob);
                await r.users().update({id: alice.id}, alice);
            })
        } catch (e) {
            didThrow = true;
            expect(e).toBeInstanceOf(InsufficientBalance)
        }
        expect(didThrow).toBeTruthy();
        let alice = await knex("users").where({ name: "alice" }).first();
        expect(alice.balance).toBe(300) 
        let bob = await knex("users").where({ name: "bob" }).first();
        expect(bob.balance).toBe(0) 
    })
})