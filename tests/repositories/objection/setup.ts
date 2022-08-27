import { knex } from "./knex";

export async function setupTables() {
    return knex.schema
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
}

export async function teardownTablesAndDestroyKnex() {
    await knex.schema
    .dropTable("users")
    .dropTable("purchases")

    await knex.destroy()

}