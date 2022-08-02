import { Manager } from "@makhzan/core";

const MockTrx = "trx";

const MockStartTrx = (isolation = "default") => {
    let done = false;
    let type = `${MockTrx}:${isolation}`
    let status = "running" 
    return {
        done: (async () => done),
        commit: (async () => { done = true; status = "committed" }),
        rollback: (async () => { done = true; status = "failed" }),
        type: () => type,
        status: () => status
    }
};

enum MockTrxResults {
    default = "trx:default",
    readcommitted = "trx:readcommitted",
    serializable = "trx:serializable"
}

class MockRepository1 {
    constructor(
        public trx: ReturnType<typeof MockStartTrx> 
    ) {}
}

class MockRepository2 {
    constructor(
        public trx: ReturnType<typeof MockStartTrx>  
    ) {}
}

const UoW = Manager({
    startTrx: MockStartTrx,
    isolations: {
        readcommitted: "readcommitted",
        serializable: "serializable" 
    }
})
.addRepository("mock1", MockRepository1)
.addRepository("mock2", MockRepository2)
.build();

describe("UoW Repository Manager", () => {
    test("creates instances of the registered repositories", async () => {
        await UoW(async r => {
            expect(r.mock1()).toBeInstanceOf(MockRepository1);
            expect(r.mock2()).toBeInstanceOf(MockRepository2);
        })
    })

    test("passes the generated transaction to the created repository instances", async () => {
        await UoW(async r => {
            expect(r.mock1().trx.type()).toBe(MockTrxResults.default);
            expect(r.mock2().trx.type()).toBe(MockTrxResults.default);
        })
    })

    test("provides the alternative isolation levels", async () => {
        await UoW.readcommitted(async r => {
            expect(r.mock1().trx.type()).toBe(MockTrxResults.readcommitted);
            expect(r.mock2().trx.type()).toBe(MockTrxResults.readcommitted);
        })
        await UoW.serializable(async r => {
            expect(r.mock1().trx.type()).toBe(MockTrxResults.serializable);
            expect(r.mock2().trx.type()).toBe(MockTrxResults.serializable);
        })
    })

    test("returns the transaction callback result", async () => {
        let result = await UoW(async () => "result");
        expect(result).toBe("result");
    })

    test("calls commit and rollback when appropriate", async () => {
        let status = () => "";
        await UoW(async r => {
            status = r.mock1().trx.status;
            expect(status()).toBe("running");
        })
        expect(status()).toBe("committed");
        await UoW(async r => {
            status = r.mock1().trx.status;
            expect(status()).toBe("running");
            throw new Error("oh no!")
        }).catch(_ => {})
        expect(status()).toBe("failed");
    })
})