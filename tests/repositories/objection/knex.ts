import Knex from "knex";
import { Model, knexSnakeCaseMappers } from "objection"

export const knex = Knex({
    client: "sqlite3",
    connection: ":memory:",
    ...knexSnakeCaseMappers()
})

Model.knex(knex);

export const BaseModel = Model;


export const objectionOpts = {
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