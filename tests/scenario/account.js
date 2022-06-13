import { setBlock } from 'jezve-test';
import * as AccountTests from '../run/account.js';

let scenario = null;

const createAccountTests = async () => {
    setBlock('Create accounts', 2);

    const { RUB, EUR } = scenario;

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

    await scenario.runner.runGroup(AccountTests.create, data);
};

const updateTests = async () => {
    setBlock('Update accounts', 2);

    const { RUB, USD } = scenario;
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

    await scenario.runner.runGroup(AccountTests.update, data);
};

const deleteTests = async () => {
    setBlock('Delete accounts', 2);

    const data = [
        [0, 1],
    ];

    await scenario.runner.runGroup(AccountTests.del, data);
};

const deleteFromUpdateTests = async () => {
    setBlock('Delete account from update view', 2);

    const data = [
        0,
    ];

    await scenario.runner.runGroup(AccountTests.delFromUpdate, data);
};

const hideTest = async () => {
    setBlock('Hide accounts', 2);

    const data = [
        [0],
        [0, 4],
    ];

    await scenario.runner.runGroup(AccountTests.hide, data);
};

const showTest = async () => {
    setBlock('Show accounts', 2);

    const data = [
        [6],
        [0, 7],
    ];

    await scenario.runner.runGroup(AccountTests.show, data);
};

const exportTest = async () => {
    setBlock('Export accounts', 2);

    const data = [
        [0],
        [0, 1],
    ];

    await scenario.runner.runGroup(AccountTests.exportTest, data);
};

const toggleTest = async () => {
    setBlock('Toggle select accounts', 2);

    const data = [
        [0],
        [1, 2],
    ];

    await scenario.runner.runGroup(AccountTests.toggleSelect, data);
};

export const accountTests = {
    /** Initialize tests */
    init(scenarioInstance) {
        scenario = scenarioInstance;
    },

    /** Run account view tests */
    async run() {
        setBlock('Accounts', 1);

        await AccountTests.securityTests();
        await AccountTests.stateLoop();

        await createAccountTests();
        await deleteTests();
    },

    /** Run account view tests with transactions */
    async runPostTransaction() {
        setBlock('Accounts with transactions', 1);

        await hideTest();
        await toggleTest();
        await showTest();
        await exportTest();
        await updateTests();
        await deleteTests();
        await deleteFromUpdateTests();
    },

    /** Initialize and run tests */
    async initAndRun(scenarioInstance) {
        this.init(scenarioInstance);
        await this.run();
    },
};
