import * as AccountTests from '../run/account.js';
import { setBlock } from '../env.js';

let scenario = null;

async function createAccountTests() {
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
        // Try to submit account with empty initial balance
        name: 'acc',
        initbalance: '',
    }];

    await scenario.runner.runGroup(AccountTests.create, data);
}

async function updateTests() {
    setBlock('Update accounts', 2);

    const { RUB, USD } = scenario;
    const data = [{
        pos: 0,
        icon_id: 1,
        curr_id: USD,
    }, {
        pos: 0,
        curr_id: RUB,
    }];

    await scenario.runner.runGroup(AccountTests.update, data);
}

async function deleteTests() {
    setBlock('Delete accounts', 2);

    const data = [
        [0, 1],
    ];

    await scenario.runner.runGroup(AccountTests.del, data);
}

async function deleteFromUpdateTests() {
    setBlock('Delete account from update view', 2);

    const data = [
        0,
    ];

    await scenario.runner.runGroup(AccountTests.delFromUpdate, data);
}

async function hideTest() {
    setBlock('Hide accounts', 2);

    const data = [
        [0],
        [0, 4],
    ];

    await scenario.runner.runGroup(AccountTests.hide, data);
}

async function showTest() {
    setBlock('Show accounts', 2);

    const data = [
        [6],
        [0, 7],
    ];

    await scenario.runner.runGroup(AccountTests.show, data);
}

async function exportTest() {
    setBlock('Export accounts', 2);

    const data = [
        [0],
        [0, 1],
    ];

    await scenario.runner.runGroup(AccountTests.exportTest, data);
}

async function toggleTest() {
    setBlock('Toggle select accounts', 2);

    const data = [
        [0],
        [1, 2],
    ];

    await scenario.runner.runGroup(AccountTests.toggleSelect, data);
}

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
