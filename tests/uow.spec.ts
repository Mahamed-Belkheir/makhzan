import { Manager } from "@makhzan/core";

const MockTrx = "trx";

const MockStartTrx = (isolation = "default") => MockTrx+":"+isolation;

enum MockTrxResults {
    default = "trx:default",
    readcommitted = "trx:readcommitted",
    serializable = "trx:serializable"
}

class MockRepository1 {
    constructor(
        public trx: any 
    ) {}
}

class MockRepository2 {
    constructor(
        public trx: any 
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
        await UoW(r => {
            expect(r.mock1()).toBeInstanceOf(MockRepository1);
            expect(r.mock2()).toBeInstanceOf(MockRepository2);
        })
    })

    test("passes the generated transaction to the created repository instances", async () => {
        await UoW(r => {
            expect(r.mock1().trx).toBe(MockTrxResults.default);
            expect(r.mock2().trx).toBe(MockTrxResults.default);
        })
    })

    test("provides the alternative isolation levels", async () => {
        await UoW.readcommitted(r => {
            expect(r.mock1().trx).toBe(MockTrxResults.readcommitted);
            expect(r.mock2().trx).toBe(MockTrxResults.readcommitted);
        })
        await UoW.serializable(r => {
            expect(r.mock1().trx).toBe(MockTrxResults.serializable);
            expect(r.mock2().trx).toBe(MockTrxResults.serializable);
        })
    })

    test("returns the transaction callback result", async () => {
        let result = await UoW(async () => "result");
        expect(result).toBe("result");
    })
})