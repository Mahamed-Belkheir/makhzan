import { RepositorySetup } from "../index.spec";
import { objectionOpts } from "./knex";
import { PurchaseRepository, UserRepository } from "./repository";
import { setupTables as objectionBefore, teardownTablesAndDestroyKnex as objectionAfter  } from "./setup";

export const ObjectionSetup: RepositorySetup = {
    name: "objection",
    opts: objectionOpts,
    repositories: {
        users: UserRepository,
        purchases: PurchaseRepository
    },
    before: objectionBefore,
    after: objectionAfter
}