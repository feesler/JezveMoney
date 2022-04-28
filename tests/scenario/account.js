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

async function updateAccountTests() {
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

async function deleteAccountTests() {
    setBlock('Delete accounts', 2);

    const data = [
        [0, 1],
    ];

    await scenario.runner.runGroup(AccountTests.del, data);
}

async function hideAccountsTest() {
    setBlock('Hide accounts', 2);

    const data = [
        [0],
        [0, 4],
    ];

    await scenario.runner.runGroup(AccountTests.hide, data);
}

async function showAccountsTest() {
    setBlock('Show accounts', 2);

    const data = [
        [5],
        [0, 6],
    ];

    await scenario.runner.runGroup(AccountTests.show, data);
}

async function exportAccountsTest() {
    setBlock('Export accounts', 2);

    const data = [
        [0],
        [0, 1],
    ];

    await scenario.runner.runGroup(AccountTests.exportTest, data);
}

async function toggleAccountsTest() {
    setBlock('Toggle select accounts', 2);

    const data = [
        [0],
        [1, 2],
    ];

    await scenario.runner.runGroup(AccountTests.toggleSelect, data);
}

export async function accountTests() {
    setBlock('Accounts', 1);

    scenario = this;

    await AccountTests.stateLoop();

    await createAccountTests();
    await deleteAccountTests();
}

export async function postTransactionAccountTests() {
    await hideAccountsTest();
    await toggleAccountsTest();
    await showAccountsTest();
    await exportAccountsTest();
    await updateAccountTests();
    await deleteAccountTests();
}
