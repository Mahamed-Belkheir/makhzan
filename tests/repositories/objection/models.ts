import { RelationMappings, RelationMappingsThunk } from "objection";
import { BaseModel } from "./knex";


export class UserObjectionModel extends BaseModel {
    static tableName = "users";

    static relationMappings: RelationMappings | RelationMappingsThunk = () => ({
        purchases: {
            modelClass: PurchaseObjectionModel,
            relation: BaseModel.HasManyRelation,
            join: {
                from: "users.id",
                to: "purchases.user_id"
            },
        }
    })
}

export class PurchaseObjectionModel extends BaseModel {
    static tableName = "purchases";
    static relationMappings: RelationMappings | RelationMappingsThunk = () => ({
        user: {
            modelClass: UserObjectionModel,
            relation: BaseModel.BelongsToOneRelation,
            join: {
                from: "purchases.user_id",
                to: "users.id"
            }
        }
    })
}