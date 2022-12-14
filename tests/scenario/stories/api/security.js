import { setBlock } from 'jezve-test';
import { App } from '../../../Application.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../../../model/Transaction.js';
import * as AccountApiTests from '../../../run/api/account.js';
import * as PersonApiTests from '../../../run/api/person.js';
import * as CategoryApiTests from '../../../run/api/category.js';
import * as TransactionApiTests from '../../../run/api/transaction.js';

const prepareTests = async () => {
    setBlock('Prepare data for security tests', 2);

    const { RUB, USD } = App.scenario;

    [
        App.scenario.API_USER_ACC_RUB,
        App.scenario.API_USER_ACC_USD,
    ] = await App.scenario.runner.runGroup(AccountApiTests.create, [{
        name: 'RUB',
        curr_id: RUB,
        initbalance: 100.1,
        icon_id: 5,
        flags: 0,
    }, {
        name: 'USD',
        curr_id: USD,
        initbalance: 50,
        icon_id: 2,
        flags: 0,
    }]);

    [
        App.scenario.API_USER_PERSON,
    ] = await App.scenario.runner.runGroup(PersonApiTests.create, [{
        name: 'API user Person',
        flags: 0,
    }]);

    [
        App.scenario.API_USER_CATEGORY,
    ] = await App.scenario.runner.runGroup(CategoryApiTests.create, [{
        name: 'API user Category',
        parent_id: 0,
        type: EXPENSE,
    }]);

    [
        App.scenario.API_USER_TRANSACTION,
    ] = await App.scenario.runner.runGroup(TransactionApiTests.extractAndCreate, [{
        type: EXPENSE,
        src_id: App.scenario.API_USER_ACC_RUB,
        src_amount: 100,
    }]);
};

const accountsTests = async () => {
    setBlock('Accounts security', 2);

    const { EUR } = App.scenario;

    await AccountApiTests.update({
        id: App.scenario.API_USER_ACC_RUB,
        name: 'EUR',
        curr_id: EUR,
        initbalance: 10,
        icon_id: 2,
        flags: 0,
    });
    await AccountApiTests.del(App.scenario.API_USER_ACC_RUB);
};

const personsTests = async () => {
    setBlock('Persons security', 2);

    await PersonApiTests.update({
        id: App.scenario.API_USER_PERSON,
        name: 'API Person',
        flags: 0,
    });
    await PersonApiTests.del(App.scenario.API_USER_PERSON);
};

const categoriesTests = async () => {
    setBlock('Categories security', 2);

    await CategoryApiTests.update({
        id: App.scenario.API_USER_CATEGORY,
        name: 'API Category',
        parent_id: 0,
        type: EXPENSE,
    });
    await PersonApiTests.del(App.scenario.API_USER_CATEGORY);
};

const createTransaction = async () => {
    setBlock('Create', 3);

    const { RUB } = App.scenario;
    const data = [{
        type: EXPENSE,
        src_id: App.scenario.API_USER_ACC_RUB,
        dest_id: 0,
        src_curr: RUB,
        dest_curr: RUB,
        src_amount: 100,
        dest_amount: 100,
    }, {
        type: EXPENSE,
        src_id: App.scenario.ACC_RUB,
        dest_id: 0,
        src_curr: RUB,
        dest_curr: RUB,
        src_amount: 100,
        dest_amount: 100,
        category_id: App.scenario.API_USER_CATEGORY,
    }, {
        type: INCOME,
        src_id: 0,
        dest_id: App.scenario.API_USER_ACC_RUB,
        src_curr: RUB,
        dest_curr: RUB,
        src_amount: 100,
        dest_amount: 100,
    }, {
        type: TRANSFER,
        src_id: App.scenario.CASH_RUB,
        dest_id: App.scenario.API_USER_ACC_RUB,
        src_curr: RUB,
        dest_curr: RUB,
        src_amount: 100,
        dest_amount: 100,
    }, {
        type: DEBT,
        op: 1,
        person_id: App.scenario.API_USER_PERSON,
        acc_id: 0,
        src_curr: RUB,
        dest_curr: RUB,
        src_amount: 100,
        dest_amount: 100,
    }];

    await App.scenario.runner.runGroup(TransactionApiTests.create, data);
};

const updateTransaction = async () => {
    setBlock('Update', 3);

    const { RUB } = App.scenario;

    const data = [{
        id: App.scenario.TR_EXPENSE_1,
        src_id: App.scenario.API_USER_ACC_RUB,
    }, {
        id: App.scenario.TR_EXPENSE_1,
        category_id: App.scenario.API_USER_CATEGORY,
    }, {
        id: App.scenario.TR_INCOME_1,
        dest_id: App.scenario.API_USER_ACC_RUB,
    }, {
        id: App.scenario.TR_TRANSFER_1,
        src_id: App.scenario.API_USER_ACC_RUB,
        dest_id: App.scenario.API_USER_ACC_USD,
    }, {
        // Trying to update transaction of another user
        id: App.scenario.API_USER_TRANSACTION,
        type: EXPENSE,
        src_id: App.scenario.CASH_RUB,
        dest_id: 0,
        src_curr: RUB,
        dest_curr: RUB,
        src_amount: 100,
        dest_amount: 100,
    }, {
        // Trying to set person of another user
        id: App.scenario.TR_DEBT_1,
        person_id: App.scenario.API_USER_PERSON,
    }, {
        // Trying to set account of another user
        id: App.scenario.TR_DEBT_2,
        acc_id: App.scenario.API_USER_ACC_RUB,
    }, {
        // Trying to set both person and account of another user
        id: App.scenario.TR_DEBT_3,
        person_id: App.scenario.API_USER_PERSON,
        acc_id: App.scenario.API_USER_ACC_RUB,
    }];

    await App.scenario.runner.runGroup(TransactionApiTests.update, data);
};

const deleteTransaction = async () => {
    setBlock('Delete', 3);

    const data = [
        [App.scenario.API_USER_TRANSACTION],
    ];

    await App.scenario.runner.runGroup(TransactionApiTests.del, data);
};

const transactionsTests = async () => {
    setBlock('Transaction security', 2);

    await createTransaction();
    await updateTransaction();
    await deleteTransaction();
};

export const apiSecurityTests = {
    async prepare() {
        await prepareTests();
    },

    async run() {
        await accountsTests();
        await personsTests();
        await categoriesTests();
        await transactionsTests();
    },
};
