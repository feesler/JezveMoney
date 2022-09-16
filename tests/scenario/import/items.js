import { setBlock } from 'jezve-test';
import * as ImportTests from '../../run/import/index.js';
import { App } from '../../Application.js';

const runCreateTests = async () => {
    setBlock('Add item', 2);

    await ImportTests.addItem();

    setBlock('Verify new item not created while invalid form is active', 2);
    await ImportTests.addItem();

    await ImportTests.updateItem({
        pos: 0,
        action: { action: 'inputDestAmount', data: '1' },
    });

    setBlock('Save item', 2);
    await ImportTests.saveItem();

    setBlock('Cancel item edit', 2);
    await ImportTests.updateItem({
        pos: 0,
        action: { action: 'inputDestAmount', data: '2' },
    });
    await ImportTests.cancelItem();
};

const runDeleteTests = async () => {
    setBlock('Delete import items', 2);

    await ImportTests.deleteItems([3, 5]);
};

const runStateLoopTests = async () => {
    const { RUB, USD } = App.scenario;

    setBlock('Import item state loop', 2);

    await ImportTests.changeMainAccount(App.scenario.ACC_3);

    await ImportTests.updateItem({
        pos: 0,
        action: [
            { action: 'changeType', data: 'expense' }, // 3-1
            { action: 'changeDestCurrency', data: USD }, // 1-2
            { action: 'changeDestCurrency', data: RUB }, // 2-1
            { action: 'changeType', data: 'income' }, // 1-3
            { action: 'changeType', data: 'expense' }, // 3-1
            { action: 'changeType', data: 'transferfrom' }, // 1-5
            { action: 'changeType', data: 'expense' }, // 5-1
            { action: 'changeType', data: 'transferto' }, // 1-7
            { action: 'changeType', data: 'expense' }, // 7-1
            { action: 'changeType', data: 'debtfrom' }, // 1-9
            { action: 'changeType', data: 'expense' }, // 9-1
            { action: 'changeType', data: 'debtto' }, // 1-10
            { action: 'changeType', data: 'expense' }, // 10-1
            { action: 'changeType', data: 'income' }, // 1-3
            { action: 'changeSourceCurrency', data: USD }, // 3-4
            { action: 'changeType', data: 'expense' }, // 4-2
            { action: 'changeType', data: 'income' }, // 2-4
            { action: 'changeSourceCurrency', data: RUB }, // 4-3
            { action: 'changeType', data: 'transferfrom' }, // 3-5
            { action: 'changeType', data: 'income' }, // 5-3
            { action: 'changeType', data: 'transferto' }, // 3-7
            { action: 'changeType', data: 'income' }, // 7-3
            { action: 'changeType', data: 'debtfrom' }, // 3-9
            { action: 'changeType', data: 'income' }, // 9-3
            { action: 'changeType', data: 'debtto' }, // 3-10
            { action: 'changeType', data: 'income' }, // 10-3
            { action: 'changeSourceCurrency', data: USD }, // 3-4
            { action: 'changeType', data: 'expense' }, // 4-2
            { action: 'changeType', data: 'transferfrom' }, // 2-5
            { action: 'changeType', data: 'transferto' }, // 5-7
            { action: 'changeType', data: 'transferfrom' }, // 7-5
            { action: 'changeType', data: 'debtfrom' }, // 5-9
            { action: 'changeType', data: 'transferfrom' }, // 9-5
            { action: 'changeType', data: 'debtto' }, // 5-10
            { action: 'changeType', data: 'transferfrom' }, // 10-5
            { action: 'changeType', data: 'expense' }, // 5-1
            { action: 'changeDestCurrency', data: USD }, // 1-2
            { action: 'changeType', data: 'transferto' }, // 2-7
            { action: 'changeType', data: 'debtfrom' }, // 7-9
            { action: 'changeType', data: 'transferto' }, // 9-7
            { action: 'changeType', data: 'debtto' }, // 7-10
            { action: 'changeType', data: 'income' }, // 10-3
            { action: 'changeSourceCurrency', data: USD }, // 3-4
            { action: 'changeType', data: 'transferfrom' }, // 4-5
            { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 5-6
            { action: 'changeType', data: 'expense' }, // 6-1
            { action: 'changeType', data: 'transferfrom' }, // 1-5
            { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 5-6
            { action: 'changeType', data: 'income' }, // 6-3
            { action: 'changeType', data: 'transferfrom' }, // 3-5
            { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 5-6
            { action: 'changeTransferAccount', data: App.scenario.ACC_RUB }, // 6-5
            { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 5-6
            { action: 'changeType', data: 'transferto' }, // 6-8
            { action: 'changeType', data: 'expense' }, // 8-1
            { action: 'changeType', data: 'transferto' }, // 1-7
            { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 7-8
            { action: 'changeType', data: 'income' }, // 8-3
            { action: 'changeSourceCurrency', data: USD }, // 3-4
            { action: 'changeType', data: 'transferto' }, // 4-7
            { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 7-8
            { action: 'inputSourceAmount', data: '100' },
            { action: 'inputDestAmount', data: '6000' },
        ],
    });

    /** Prepare items of all states */
    await ImportTests.updateItem({
        pos: 1,
        action: [
            { action: 'changeDestCurrency', data: USD }, // 1-2
            { action: 'inputDestAmount', data: '50.03' },
            { action: 'inputSourceAmount', data: '100' },
        ],
    });
    await ImportTests.updateItem({
        pos: 2,
        action: { action: 'changeType', data: 'income' }, // 1-3
    });
    await ImportTests.updateItem({
        pos: 3,
        action: [
            { action: 'changeDestCurrency', data: USD }, // 1-2
            { action: 'changeType', data: 'income' }, // 2-4
            { action: 'inputDestAmount', data: '500' },
            { action: 'inputSourceAmount', data: '9' },
        ],
    });
    await ImportTests.updateItem({
        pos: 4,
        action: { action: 'changeType', data: 'transferfrom' }, // 1-5
    });
    await ImportTests.updateItem({
        pos: 5,
        action: [
            { action: 'changeType', data: 'transferfrom' }, // 1-5
            { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 5-6
            { action: 'inputDestAmount', data: '0.9' },
            { action: 'inputSourceAmount', data: '50.03' },
        ],
    });
    await ImportTests.updateItem({
        pos: 6,
        action: { action: 'changeType', data: 'transferto' }, // 1-7
    });
    await ImportTests.updateItem({
        pos: 7,
        action: [
            { action: 'changeType', data: 'debtfrom' }, // 1-9
            { action: 'changePerson', data: App.scenario.ALEX },
        ],
    });
    await ImportTests.updateItem({
        pos: 8,
        action: { action: 'changeType', data: 'debtto' }, // 1-10
    });
    await ImportTests.changeMainAccount(App.scenario.ACC_EUR);
    await ImportTests.updateItem({
        pos: 0,
        action: [
            { action: 'changeType', data: 'transferto' },
            { action: 'changeTransferAccount', data: App.scenario.ACC_3 }, // 8-8
        ],
    });
    await ImportTests.changeMainAccount(App.scenario.ACC_3); // for item 0: 8-1
    await ImportTests.updateItem({
        pos: 0,
        action: [
            { action: 'changeType', data: 'transferto' }, // 1-6
            { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 7-8
            { action: 'changeType', data: 'transferfrom' }, // 8-6
            { action: 'changeType', data: 'debtfrom' }, // 6-9
            { action: 'changeType', data: 'debtto' }, // 9-10
            { action: 'changeType', data: 'transferto' }, // 10-7
            { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 7-8
            { action: 'changeType', data: 'debtfrom' }, // 8-9
            { action: 'changeType', data: 'income' }, // 9-3
            { action: 'changeSourceCurrency', data: USD }, // 3-4
            { action: 'changeType', data: 'debtfrom' }, // 4-9
            { action: 'changeType', data: 'income' }, // 9-3
            { action: 'changeSourceCurrency', data: USD }, // 3-4
            { action: 'changeType', data: 'debtto' }, // 4-10
            { action: 'changeType', data: 'debtfrom' }, // 10-9
            { action: 'changeType', data: 'transferfrom' }, // 9-5
            { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 5-6
            { action: 'changeType', data: 'debtto' }, // 6-10
            { action: 'changeType', data: 'transferto' }, // 10-7
            { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 7-8
            { action: 'changeType', data: 'debtto' }, // 8-10
            { action: 'changeType', data: 'expense' }, // 10-1
            { action: 'changeDestCurrency', data: USD }, // 1-2
            { action: 'changeType', data: 'debtfrom' }, // 2-9
            { action: 'changeType', data: 'expense' }, // 9-1
            { action: 'changeDestCurrency', data: USD }, // 1-2
            { action: 'changeType', data: 'debtto' }, // 2-10
        ],
    });

    await ImportTests.updateItem({
        pos: 7,
        action: [
            { action: 'changeType', data: 'debtto' },
            { action: 'changePerson', data: App.scenario.MARIA },
        ],
    });

    await ImportTests.submit();
};

export const importItemsTests = {
    /** Run import item create tests */
    async createTests() {
        await runCreateTests();
    },

    /** Run import item delete tests */
    async deleteTests() {
        await runDeleteTests();
    },

    /** Run import item state loop tests */
    async stateLoopTests() {
        await runStateLoopTests();
    },
};
