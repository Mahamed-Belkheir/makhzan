import { BaseRepository, PaginationRepository } from "@makhzan/objection";
import { ModelClass, Model } from "objection";
import { PurchaseObjectionModel, UserObjectionModel } from "./models";
import { Purchase, User } from "../domain/entity";

export class UserRepository extends BaseRepository<User> {
    protected modelClass: ModelClass<Model> = UserObjectionModel
    protected mapResult = (data: any) => {
        if (!data) return undefined;
        if (Array.isArray(data)) {
            return data.map(d => {
                return new User(
                    d.name,
                    d.balance,
                    d.id,
                    d.purchases
                )
            })
        }
        return new User(
            data.name,
            data.balance,
            data.id,
            data.purchases
        )
    }

    public fetchWithPurchases(match: Partial<User> | Partial<User>[]) {
        return this.matchQuery(match).withGraphJoined('[purchases]').then(this.mapResult) as Promise<Required<User>[]>;
    }
}

export class PurchaseRepository extends PaginationRepository<Purchase> {
    protected modelClass: ModelClass<Model> = PurchaseObjectionModel;
    protected mapResult = (data: any) => {
        if (!data) return undefined;;
        if (Array.isArray(data)) {
            return data.map(d => {
                return new Purchase(
                    d.item,
                    d.userId,
                    d.totalCost,
                    d.id
                )
            })
        }
        return new Purchase(
            data.item,
            data.userId,
            data.totalCost,
            data.id
        )
    }
}