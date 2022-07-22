# Makhzan Core

Makhzan (Store or Repository in Arabic) is a Unit of Work and Repository abstraction layer.
The Core package includes a generic Unit of Work implementation, flexible enough to work
with any classes you provide.

# Setup
installation: `npm i @makhzan/core` or `yarn add @makhzan/core`

```ts
import { Manager } from "@makhzan/core"
// placeholders for your own code
import { UserRepository, AccountRepository } from "./repositories"
import { DBConn } from "./db"
import { knex } from "knex";

// using a low level lib like node-postgres
let startTrx = (isolation?: string) => {
        let q = "BEGIN" 
        if (isolation === "serializable")
            q += " TRANSACTION ISOLATION LEVEL SERIALIZABLE";
        return DBConn.query(q);
}

// example using knex
let startTrx = (isolationLevel?: string) => {
        return knex.transaction({ isolationLevel });
}

let UoW = Manager({
    // replace with your own DB layer's transaction code
    startTrx,
    isolations: {
        serialzable: "serializable",
        repeatableReads: "repeatable read"
    }
})
.addRepository("users", UserRepository)
.addRepository("accounts", AccountRepository)
.build();
```

The manager builds a Unit of Work function, it requires the following:
- ManagerConfig parameter
    this sets up the manager to create transactions, it includes two parameters:
    - startTrx
        A callback that takes an optional string parameter, which is the selected isolation level
    - isolations
        an object with transaction isolation levels, the keys are how you access the isolation level from the resulting UoW instance, the values are what gets passed to the startTrx callback when used, this is optional if no specific isolation level is required.
- addRepository
    this adds new repositories that you're able to access through the UoW callback, the first parameter is the key to access them, the second parameter is the repository class, the only requirement is that you provide a class that expects the same transaction object you're returning from the startTrx callback as its first constructor parameter



# Usage

The generated UoW instance is a function that takes a callback, with its parameter being the repositories you've
registered while setting it up, they'll be available as function calls as they're instantiated on demand and injected with the
current transaction reference.


```ts
let newBalance = await UoW(async r => {
    let user = await r.users().findById(userId);
    let account = await r.accounts().findByAccountNumber(user.accountNo);
    account.deduct(200, "new service subscription");
    await r.accounts().save(account);
    return account.currentBalance();
})

```
Every repository referenced inside the UoW callback shares the same transaction reference, as such, would be an atomic operation.
The UoW function returns the value returned by the given callback, so you can use whatever values you recieve after you're done with your transaction, the UoW is a generic function and as such the return value is type safe. (in our example, currentBalance returns a `number` and `newBalance` will be of type number).

Isolation levels defined earlier are available as methods under the UoW instance, the previous example can be run serializably:
```ts
let newBalance = await UoW.serialzable(async r => {
    // snip
})
```
The UoW type keeps track of both isolations and repositories provided, so you will have compiler and IDE support when using them.