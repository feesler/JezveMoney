import { assert, setBlock } from 'jezve-test';
import { App } from '../../../Application.js';
import { ACCOUNT_TYPE_OTHER } from '../../../model/AccountsList.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../../../model/Transaction.js';
import * as accountActions from '../../../actions/api/account.js';
import * as personActions from '../../../actions/api/person.js';
import * as categoryActions from '../../../actions/api/category.js';
import * as transactionActions from '../../../actions/api/transaction.js';

const prepareTests = async () => {
    setBlock('Prepare data for security tests', 2);

    const { RUB, USD } = App.scenario;

    [
        App.scenario.API_USER_ACC_RUB,
        App.scenario.API_USER_ACC_USD,
    ] = await App.scenario.runner.runGroup(accountActions.create, [{
        type: ACCOUNT_TYPE_OTHER,
        name: 'RUB',
        curr_id: RUB,
        initbalance: 100.1,
        icon_id: 5,
    }, {
        type: ACCOUNT_TYPE_OTHER,
        name: 'USD',
        curr_id: USD,
        initbalance: 50,
        icon_id: 2,
    }]);

    assert(
        App.scenario.API_USER_ACC_RUB && App.scenario.API_USER_ACC_USD,
        'Failed to create accounts',
    );

    [
        App.scenario.API_USER_PERSON,
    ] = await App.scenario.runner.runGroup(personActions.create, [{
        name: 'API user Person',
    }]);
    assert(App.scenario.API_USER_PERSON, 'Failed to create person');

    [
        App.scenario.API_USER_CATEGORY,
    ] = await App.scenario.runner.runGroup(categoryActions.create, [{
        name: 'API user Category',
        type: EXPENSE,
    }]);
    assert(App.scenario.API_USER_CATEGORY, 'Failed to create category');

    [
        App.scenario.API_USER_TRANSACTION,
    ] = await App.scenario.runner.runGroup(transactionActions.extractAndCreate, [{
        type: EXPENSE,
        src_id: App.scenario.API_USER_ACC_RUB,
        src_amount: 100,
    }]);
    assert(App.scenario.API_USER_TRANSACTION, 'Failed to create transaction');
};

const accountsTests = async () => {
    setBlock('Accounts security', 2);

    const { EUR, API_USER_ACC_RUB } = App.scenario;

    await accountActions.update({
        id: API_USER_ACC_RUB,
        name: 'EUR',
        curr_id: EUR,
        initbalance: 10,
        icon_id: 2,
    });
    await accountActions.del(API_USER_ACC_RUB);
    await accountActions.setPos({ id: API_USER_ACC_RUB, pos: 1 });
};

const personsTests = async () => {
    setBlock('Persons security', 2);

    const { API_USER_PERSON } = App.scenario;

    await personActions.update({
        id: API_USER_PERSON,
        name: 'API Person',
    });
    await personActions.del(API_USER_PERSON);
    await personActions.setPos({ id: API_USER_PERSON, pos: 1 });
};

const categoriesTests = async () => {
    setBlock('Categories security', 2);

    const { API_USER_CATEGORY } = App.scenario;

    await categoryActions.update({
        id: API_USER_CATEGORY,
        name: 'API Category',
        type: EXPENSE,
    });
    await categoryActions.del(API_USER_CATEGORY);
    await categoryActions.setPos({ id: API_USER_CATEGORY, pos: 1, parent_id: 0 });
};

const createTransaction = async () => {
    setBlock('Create', 3);

    const {
        RUB,
        ACC_RUB,
        CASH_RUB,
        API_USER_ACC_RUB,
        API_USER_CATEGORY,
        API_USER_PERSON,
    } = App.scenario;

    const data = [{
        type: EXPENSE,
        src_id: API_USER_ACC_RUB,
        dest_id: 0,
        src_curr: RUB,
        dest_curr: RUB,
        src_amount: 100,
        dest_amount: 100,
    }, {
        type: EXPENSE,
        src_id: ACC_RUB,
        dest_id: 0,
        src_curr: RUB,
        dest_curr: RUB,
        src_amount: 100,
        dest_amount: 100,
        category_id: API_USER_CATEGORY,
    }, {
        type: INCOME,
        src_id: 0,
        dest_id: API_USER_ACC_RUB,
        src_curr: RUB,
        dest_curr: RUB,
        src_amount: 100,
        dest_amount: 100,
    }, {
        type: TRANSFER,
        src_id: CASH_RUB,
        dest_id: API_USER_ACC_RUB,
        src_curr: RUB,
        dest_curr: RUB,
        src_amount: 100,
        dest_amount: 100,
    }, {
        type: DEBT,
        op: 1,
        person_id: API_USER_PERSON,
        acc_id: 0,
        src_curr: RUB,
        dest_curr: RUB,
        src_amount: 100,
        dest_amount: 100,
    }];

    await App.scenario.runner.runGroup(transactionActions.create, data);
};

const updateTransaction = async () => {
    setBlock('Update', 3);

    const {
        RUB,
        CASH_RUB,
        TR_EXPENSE_1,
        TR_INCOME_1,
        TR_TRANSFER_1,
        TR_DEBT_1,
        TR_DEBT_2,
        TR_DEBT_3,
        API_USER_ACC_RUB,
        API_USER_ACC_USD,
        API_USER_PERSON,
        API_USER_CATEGORY,
        API_USER_TRANSACTION,
    } = App.scenario;

    const data = [{
        id: TR_EXPENSE_1,
        src_id: API_USER_ACC_RUB,
    }, {
        id: TR_EXPENSE_1,
        category_id: API_USER_CATEGORY,
    }, {
        id: TR_INCOME_1,
        dest_id: API_USER_ACC_RUB,
    }, {
        id: TR_TRANSFER_1,
        src_id: API_USER_ACC_RUB,
        dest_id: API_USER_ACC_USD,
    }, {
        // Trying to update transaction of another user
        id: API_USER_TRANSACTION,
        type: EXPENSE,
        src_id: CASH_RUB,
        dest_id: 0,
        src_curr: RUB,
        dest_curr: RUB,
        src_amount: 100,
        dest_amount: 100,
    }, {
        // Trying to set person of another user
        id: TR_DEBT_1,
        person_id: API_USER_PERSON,
    }, {
        // Trying to set account of another user
        id: TR_DEBT_2,
        acc_id: API_USER_ACC_RUB,
    }, {
        // Trying to set both person and account of another user
        id: TR_DEBT_3,
        person_id: API_USER_PERSON,
        acc_id: API_USER_ACC_RUB,
    }];

    await App.scenario.runner.runGroup(transactionActions.update, data);
};

const deleteTransaction = async () => {
    setBlock('Delete', 3);

    const data = [
        [App.scenario.API_USER_TRANSACTION],
    ];

    await App.scenario.runner.runGroup(transactionActions.del, data);
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
