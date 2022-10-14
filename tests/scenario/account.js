import { setBlock } from 'jezve-test';
import * as AccountTests from '../run/account.js';
import { App } from '../Application.js';
import { api } from '../model/api.js';

const create = async () => {
    setBlock('Create accounts', 2);

    const { RUB, EUR } = App.scenario;

    const data = [{
        name: 'acc_1',
        initbalance: 1000.01,
        curr_id: RUB,
    }, {
        name: 'acc_2',
        initbalance: '1000.01',
        curr_id: EUR,
    }, {
        // Try to submit account with empty name
        name: '',
        initbalance: '100',
    }, {
        // Try to submit account with existing name
        name: 'Acc_1',
        initbalance: '1000',
    }, {
        // Try to submit account with empty initial balance
        name: 'acc',
        initbalance: '',
    }];

    await App.scenario.runner.runGroup(AccountTests.create, data);
};

const update = async () => {
    setBlock('Update accounts', 2);

    const { RUB, USD } = App.scenario;
    const data = [{
        pos: 0,
        icon_id: 1,
        curr_id: USD,
    }, {
        pos: 0,
        curr_id: RUB,
    }, {
        // Try to submit account with empty name
        pos: 0,
        name: '',
    }, {
        // Try to submit account with existing name
        pos: 1,
        name: 'Acc_1',
    }, {
        // Try to update case in account name
        pos: 0,
        name: 'Acc_1',
    }];

    await App.scenario.runner.runGroup(AccountTests.update, data);
};

const del = async () => {
    setBlock('Delete accounts', 2);

    const data = [
        [0, 1],
    ];

    await App.scenario.runner.runGroup(AccountTests.del, data);
};

const deleteFromUpdate = async () => {
    setBlock('Delete account from update view', 2);

    const data = [
        0,
    ];

    await App.scenario.runner.runGroup(AccountTests.delFromUpdate, data);
};

const hide = async () => {
    setBlock('Hide accounts', 2);

    const data = [
        [0],
        [0, 4],
    ];

    await App.scenario.runner.runGroup(AccountTests.hide, data);
};

const show = async () => {
    setBlock('Show accounts', 2);

    const data = [
        [5],
        [0, 5],
    ];

    await App.scenario.runner.runGroup(AccountTests.show, data);
};

const exportCSV = async () => {
    setBlock('Export accounts', 2);

    const data = [
        [0],
        [0, 1],
    ];

    await App.scenario.runner.runGroup(AccountTests.exportTest, data);
};

const toggle = async () => {
    setBlock('Toggle select accounts', 2);

    const data = [
        [0],
        [1, 2],
    ];

    await App.scenario.runner.runGroup(AccountTests.toggleSelect, data);
};

const prepare = async () => {
    await App.scenario.prepareTestUser();

    await api.profile.resetData({
        accounts: true,
        persons: true,
    });
    await App.state.fetch();
};

const prepareTransactions = async () => {
    await api.profile.resetData({
        accounts: true,
        persons: true,
    });
    await App.state.fetch();
    await App.scenario.createTestData();

    await App.goToMainView();
};

export const accountTests = {
    /** Run account view tests */
    async run() {
        setBlock('Accounts', 1);

        await prepare();

        await AccountTests.securityTests();
        await AccountTests.stateLoop();

        await create();
        await del();

        await prepareTransactions();

        await hide();
        await toggle();
        await show();
        await exportCSV();
        await update();
        await del();
        await deleteFromUpdate();
    },
};
