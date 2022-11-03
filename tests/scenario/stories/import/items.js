import { setBlock } from 'jezve-test';
import * as ImportTests from '../../../run/import/index.js';
import { App } from '../../../Application.js';

const create = async () => {
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

const del = async () => {
    setBlock('Delete import items', 2);

    await ImportTests.deleteItems([3, 5]);
};

const stateLoop = async () => {
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

    await ImportTests.enableItems({ index: 2, value: true });
    await ImportTests.updateItem({
        pos: 2,
        action: { action: 'changeType', data: 'income' }, // 1-3
    });
    await ImportTests.enableItems({ index: 3, value: true });
    await ImportTests.updateItem({
        pos: 3,
        action: [
            { action: 'changeDestCurrency', data: USD }, // 1-2
            { action: 'changeType', data: 'income' }, // 2-4
            { action: 'inputDestAmount', data: '500' },
            { action: 'inputSourceAmount', data: '9' },
        ],
    });
    await ImportTests.enableItems({ index: 4, value: true });
    await ImportTests.updateItem({
        pos: 4,
        action: { action: 'changeType', data: 'transferfrom' }, // 1-5
    });
    await ImportTests.enableItems({ index: 5, value: true });
    await ImportTests.updateItem({
        pos: 5,
        action: [
            { action: 'changeType', data: 'transferfrom' }, // 1-5
            { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 5-6
            { action: 'inputDestAmount', data: '0.9' },
            { action: 'inputSourceAmount', data: '50.03' },
        ],
    });
    await ImportTests.enableItems({ index: 6, value: true });
    await ImportTests.updateItem({
        pos: 6,
        action: { action: 'changeType', data: 'transferto' }, // 1-7
    });
    await ImportTests.enableItems({ index: 7, value: true });
    await ImportTests.updateItem({
        pos: 7,
        action: [
            { action: 'changeType', data: 'debtfrom' }, // 1-9
            { action: 'changePerson', data: App.scenario.IVAN },
        ],
    });
    await ImportTests.enableItems({ index: 8, value: true });
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

const submit = async () => {
    setBlock('Submit import transactions', 1);

    // Disable all items except 0 and 1 and submit
    // As result two first transactions will be found as similar
    await ImportTests.enableItems({
        index: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        value: false,
    });
    await ImportTests.submit();
    // Verify submit is disabled for empty list
    setBlock('Verify submit is disabled for empty list', 2);
    await ImportTests.submit();

    setBlock('Verify invalid items are not submitted', 2);
    // Empty amount
    await ImportTests.addItem();
    await ImportTests.submit();

    // Zero amount
    await ImportTests.updateItem({
        pos: 0,
        action: { action: 'inputDestAmount', data: '0' },
    });
    await ImportTests.submit();

    // Valid amount, different currencies and empty source amount
    await ImportTests.updateItem({
        pos: 0,
        action: [
            { action: 'inputDestAmount', data: '1' },
            { action: 'changeDestCurrency', data: App.scenario.USD },
            { action: 'inputSourceAmount', data: '' },
        ],
    });
    await ImportTests.submit();

    // Empty date
    await ImportTests.updateItem({
        pos: 0,
        action: [
            { action: 'inputSourceAmount', data: '2' },
            { action: 'inputDate', data: '' },
        ],
    });
    await ImportTests.submit();

    // Invalid date
    await ImportTests.updateItem({
        pos: 0,
        action: { action: 'inputDate', data: '2.ssa' },
    });
    await ImportTests.submit();

    // Correct date
    await ImportTests.updateItem({
        pos: 0,
        action: { action: 'inputDate', data: App.dates.now },
    });
    await ImportTests.submit();

    // Verify submit is disabled for list with no enabled items
    setBlock('Verify submit is disabled for list with no enabled items', 2);
    await ImportTests.uploadFile(App.scenario.cardFile);
    await ImportTests.submitUploaded({
        ...App.scenario.cardFile,
        template: 0,
    });
    await ImportTests.enableItems({
        index: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
        value: false,
    });
    await ImportTests.submit();
};

const uploadAccount = async () => {
    setBlock('Upload CSV with invalid account', 2);
    await ImportTests.uploadFile(App.scenario.cardFile);
    await ImportTests.submitUploaded({
        ...App.scenario.cardFile,
        account: App.scenario.ACC_USD,
    });

    setBlock('Check main account is updated after select it at upload dialog', 2);
    await ImportTests.changeMainAccount(App.scenario.ACC_RUB);
};

const convert = async () => {
    setBlock('Convert transactions', 2);

    const { cardFile } = App.scenario;
    await ImportTests.uploadFile(cardFile);
    await ImportTests.submitUploaded(cardFile);
    await ImportTests.deleteAllItems();
};

const pagination = async () => {
    setBlock('Check pagination', 2);

    const { cardFile } = App.scenario;
    await ImportTests.uploadFile(cardFile);
    await ImportTests.submitUploaded(cardFile);
    await ImportTests.uploadFile(cardFile);
    await ImportTests.submitUploaded(cardFile);
    await ImportTests.addItem();
    await ImportTests.goToPrevPage();
    await ImportTests.submit();
    await ImportTests.deleteAllItems();
};

const select = async () => {
    setBlock('Select items', 2);

    const { cardFile } = App.scenario;
    await ImportTests.uploadFile(cardFile);
    await ImportTests.submitUploaded(cardFile);
    await ImportTests.toggleSelectItems([0, 1]);
    await ImportTests.toggleSelectItems([0, 1]);
    await ImportTests.selectAllItems();
    await ImportTests.deselectAllItems();
    await ImportTests.toggleSelectItems([0, 1, 2]);
    await ImportTests.enableSelectedItems(false);
    await ImportTests.enableSelectedItems(true);
    await ImportTests.deleteSelectedItems();

    await ImportTests.deleteAllItems();
};

const checkSimilar = async () => {
    setBlock('Enable/disable check similar transactions', 1);

    const { cardFile } = App.scenario;

    // Check option change is correctly update already uploaded transactions
    await ImportTests.uploadFile(cardFile);
    await ImportTests.submitUploaded({
        ...cardFile,
        account: App.scenario.ACC_RUB,
    });
    await ImportTests.enableCheckSimilar(false);
    await ImportTests.enableCheckSimilar(true);
    await ImportTests.enableCheckSimilar(false);
    // Check option change is correctly affect on new uploaded transactions
    await ImportTests.deleteAllItems();
    await ImportTests.uploadFile(cardFile);
    await ImportTests.submitUploaded({
        ...cardFile,
        account: App.scenario.ACC_RUB,
    });
    await ImportTests.enableCheckSimilar(true);
    await ImportTests.deleteAllItems();
};

const enableDisableRules = async () => {
    setBlock('Enable/disable rules', 1);

    const { cardFile } = App.scenario;

    await ImportTests.uploadFile(cardFile);
    await ImportTests.submitUploaded({
        ...cardFile,
        account: App.scenario.ACC_RUB,
    });

    await ImportTests.enableRules(false);
    await ImportTests.enableRules(true);
};

export const importItemsTests = {
    async run() {
        await create();
        await uploadAccount();
        await convert();
        await pagination();
        await select();
        await checkSimilar();
        await enableDisableRules();
        await del();
        await submit();
        await stateLoop();
    },
};
