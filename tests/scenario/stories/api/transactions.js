import { setBlock } from 'jezve-test';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../../../model/Transaction.js';
import { App } from '../../../Application.js';
import * as TransactionApiTests from '../../../run/api/transaction.js';

const create = async () => {
    setBlock('Create', 3);

    const { RUB, USD, EUR } = App.scenario;

    const data = [{
        type: EXPENSE,
        src_id: App.scenario.ACC_RUB,
        src_amount: 100,
        comment: '11',
    }, {
        type: EXPENSE,
        src_id: App.scenario.ACC_RUB,
        src_amount: 7608,
        dest_amount: 100,
        dest_curr: EUR,
        comment: '22',
    }, {
        type: EXPENSE,
        src_id: App.scenario.ACC_USD,
        src_amount: 1,
        date: App.dates.yesterday,
    }, {
        type: INCOME,
        dest_id: App.scenario.ACC_RUB,
        dest_amount: 1000.50,
        comment: 'lalala',
    }, {
        type: INCOME,
        dest_id: App.scenario.ACC_USD,
        src_amount: 6500,
        dest_amount: 100,
        src_curr: RUB,
        comment: 'la',
    }, {
        type: TRANSFER,
        src_id: App.scenario.ACC_RUB,
        dest_id: App.scenario.CASH_RUB,
        src_amount: 500,
        dest_amount: 500,
    }, {
        type: TRANSFER,
        src_id: App.scenario.ACC_RUB,
        dest_id: App.scenario.ACC_USD,
        src_amount: 6500,
        dest_amount: 100,
    }, {
        type: DEBT,
        op: 1,
        person_id: App.scenario.PERSON_X,
        acc_id: 0,
        src_amount: 500,
        src_curr: RUB,
        comment: 'к кк',
    }, {
        type: DEBT,
        op: 2,
        person_id: App.scenario.PERSON_Y,
        acc_id: 0,
        src_amount: 1000,
        src_curr: USD,
        comment: 'к',
    }, {
        type: DEBT,
        op: 1,
        person_id: App.scenario.PERSON_X,
        acc_id: 0,
        src_amount: 500,
        src_curr: RUB,
        comment: 'ппп',
    }, {
        type: DEBT,
        op: 2,
        person_id: App.scenario.PERSON_Y,
        acc_id: 0,
        src_amount: 1000,
        src_curr: USD,
    }, {
        type: DEBT,
        op: 1,
        person_id: App.scenario.PERSON_X,
        acc_id: App.scenario.ACC_RUB,
        src_amount: 100,
        src_curr: RUB,
    }];

    [
        App.scenario.TR_EXPENSE_1,
        App.scenario.TR_EXPENSE_2,
        App.scenario.TR_EXPENSE_3,
        App.scenario.TR_INCOME_1,
        App.scenario.TR_INCOME_2,
        App.scenario.TR_TRANSFER_1,
        App.scenario.TR_TRANSFER_2,
        App.scenario.TR_DEBT_1,
        App.scenario.TR_DEBT_2,
        App.scenario.TR_DEBT_3,
    ] = await App.scenario.runner.runGroup(TransactionApiTests.extractAndCreate, data);

    // Find person account for invalid transaction
    await App.state.fetch();
    const personAccount = App.state.getPersonAccount(App.scenario.PERSON_Y, USD);

    const invData = [{
        type: EXPENSE,
        src_id: 0,
        src_amount: 100,
    }, {
        type: EXPENSE,
        src_id: App.scenario.ACC_RUB,
        src_amount: 0,
    }, {
        type: EXPENSE,
        src_id: 0,
        dest_id: App.scenario.ACC_RUB,
        src_amount: 100,
    }, {
        type: EXPENSE,
        src_id: personAccount.id,
        src_amount: 100,
    }, {
        type: INCOME,
        dest_id: 0,
        dest_amount: 100,
    }, {
        type: INCOME,
        src_id: App.scenario.ACC_RUB,
        dest_id: 0,
        dest_amount: 100,
    }, {
        type: INCOME,
        dest_id: App.scenario.ACC_RUB,
        dest_amount: '',
    }, {
        type: INCOME,
        dest_id: personAccount.id,
        dest_amount: 100,
    }, {
        type: INCOME,
        dest_id: App.scenario.ACC_RUB,
        dest_amount: 99.1,
        date: '1f1f',
    }, {
        type: TRANSFER,
        src_id: 0,
        dest_id: 0,
        src_amount: 100,
    }, {
        type: TRANSFER,
        src_id: App.scenario.ACC_RUB,
        dest_id: 0,
        src_amount: 100,
    }, {
        type: TRANSFER,
        src_id: 0,
        dest_id: App.scenario.ACC_RUB,
        src_amount: 100,
    }, {
        type: TRANSFER,
        src_id: App.scenario.ACC_RUB,
        dest_id: App.scenario.ACC_RUB,
        src_amount: 6500,
        dest_amount: 100,
    }, {
        type: TRANSFER,
        src_id: App.scenario.ACC_USD,
        dest_id: personAccount.id,
        src_amount: 100,
    }, {
        type: DEBT,
        op: 0,
        person_id: App.scenario.PERSON_X,
        acc_id: 0,
        src_amount: 500,
        src_curr: RUB,
    }, {
        type: DEBT,
        op: 1,
        person_id: 0,
        acc_id: 0,
        src_amount: 500,
        src_curr: RUB,
    }, {
        type: DEBT,
        op: 1,
        person_id: App.scenario.PERSON_X,
        acc_id: 0,
        src_amount: '',
        src_curr: RUB,
    }, {
        type: DEBT,
        op: 1,
        person_id: App.scenario.PERSON_X,
        acc_id: 0,
        src_amount: 10,
        src_curr: 9999,
    }];
    await App.scenario.runner.runGroup(TransactionApiTests.create, invData);
};

const createMultiple = async () => {
    setBlock('Create multiple', 3);

    const { RUB, EUR } = App.scenario;

    const data = [{
        type: EXPENSE,
        src_id: App.scenario.ACC_RUB,
        src_amount: 7608,
        dest_amount: 100,
        dest_curr: EUR,
        date: App.dates.yesterday,
        comment: 'multiple expense',
    }, {
        type: INCOME,
        dest_id: App.scenario.ACC_USD,
        src_amount: 6500,
        dest_amount: 100,
        src_curr: RUB,
        comment: 'multiple income',
    }, {
        type: TRANSFER,
        src_id: App.scenario.ACC_RUB,
        dest_id: App.scenario.CASH_RUB,
        src_amount: 500,
        dest_amount: 500,
        comment: 'multiple transfer',
    }, {
        type: DEBT,
        op: 1,
        person_id: App.scenario.PERSON_X,
        acc_id: 0,
        src_amount: 500,
        src_curr: RUB,
        comment: 'multiple debt',
    }];

    await TransactionApiTests.extractAndCreateMultiple(data);

    const invData = [
        null,
        [null],
        [null, null],
        [{
            type: EXPENSE,
            src_id: 0,
            src_amount: 100,
        }, {
            type: EXPENSE,
            src_id: App.scenario.ACC_RUB,
            src_amount: 100,
        }],
        [{
            type: EXPENSE,
            src_id: App.scenario.ACC_RUB,
            src_amount: 100,
        }, null],
    ];
    await App.scenario.runner.runGroup(TransactionApiTests.extractAndCreateMultiple, invData);
};

const update = async () => {
    setBlock('Update', 3);

    const {
        RUB,
        USD,
        EUR,
        PLN,
    } = App.scenario;

    const data = [{
        id: App.scenario.TR_EXPENSE_1,
        src_id: App.scenario.CASH_RUB,
    }, {
        id: App.scenario.TR_EXPENSE_2,
        dest_amount: 7608,
        dest_curr: RUB,
    }, {
        id: App.scenario.TR_EXPENSE_3,
        dest_amount: 0.89,
        dest_curr: EUR,
        date: App.dates.weekAgo,
    }, {
        id: App.scenario.TR_INCOME_1,
        dest_id: App.scenario.CASH_RUB,
    }, {
        id: App.scenario.TR_INCOME_2,
        src_amount: 100,
        src_curr: USD,
    }, {
        id: App.scenario.TR_TRANSFER_1,
        dest_id: App.scenario.ACC_USD,
        dest_curr: USD,
        dest_amount: 8,
    }, {
        id: App.scenario.TR_TRANSFER_2,
        dest_id: App.scenario.CASH_RUB,
        dest_curr: RUB,
        dest_amount: 6500,
        date: App.dates.yesterday,
    }, {
        id: App.scenario.TR_DEBT_1,
        op: 2,
    }, {
        id: App.scenario.TR_DEBT_2,
        person_id: App.scenario.PERSON_Y,
        acc_id: 0,
    }, {
        id: App.scenario.TR_DEBT_3,
        op: 1,
        acc_id: App.scenario.ACC_RUB,
    }];

    await App.scenario.runner.runGroup(TransactionApiTests.update, data);

    // Find person account for invalid transaction
    await App.state.fetch();
    const personAccount = App.state.getPersonAccount(App.scenario.PERSON_Y, USD);

    const invData = [{
        id: App.scenario.TR_EXPENSE_1,
        src_id: 0,
    }, {
        id: App.scenario.TR_EXPENSE_1,
        src_id: personAccount.id,
    }, {
        id: App.scenario.TR_EXPENSE_2,
        dest_amount: 0,
        dest_curr: PLN,
    }, {
        id: App.scenario.TR_EXPENSE_3,
        date: '',
    }, {
        id: App.scenario.TR_INCOME_1,
        dest_id: 0,
    }, {
        id: App.scenario.TR_INCOME_1,
        dest_id: personAccount.id,
    }, {
        id: App.scenario.TR_INCOME_2,
        src_amount: 0,
        src_curr: EUR,
    }, {
        id: App.scenario.TR_TRANSFER_1,
        src_id: 0,
    }, {
        id: App.scenario.TR_TRANSFER_1,
        dest_id: 0,
    }, {
        id: App.scenario.TR_TRANSFER_1,
        dest_id: personAccount.id,
    }, {
        id: App.scenario.TR_TRANSFER_1,
        src_curr: 0,
    }, {
        id: App.scenario.TR_TRANSFER_1,
        dest_curr: 9999,
    }, {
        id: App.scenario.TR_TRANSFER_1,
        dest_id: App.scenario.ACC_USD,
        dest_curr: PLN,
    }, {
        id: App.scenario.TR_TRANSFER_1,
        dest_id: App.scenario.ACC_RUB,
    }, {
        id: App.scenario.TR_TRANSFER_2,
        dest_id: App.scenario.CASH_RUB,
        dest_curr: RUB,
        dest_amount: 0,
        date: 'x',
    }, {
        id: App.scenario.TR_DEBT_1,
        op: 0,
    }, {
        id: App.scenario.TR_DEBT_2,
        person_id: 0,
    }, {
        id: App.scenario.TR_DEBT_3,
        op: 1,
        acc_id: 9999,
    }];

    await App.scenario.runner.runGroup(TransactionApiTests.update, invData);
};

const del = async () => App.scenario.runner.runGroup(TransactionApiTests.del, [
    [App.scenario.TR_EXPENSE_2, App.scenario.TR_TRANSFER_1, App.scenario.TR_DEBT_3],
    [],
    [9999],
]);

const setPos = async () => App.scenario.runner.runGroup(TransactionApiTests.setPos, [
    { id: App.scenario.TR_EXPENSE_2, pos: 5 },
    { id: App.scenario.TR_INCOME_2, pos: 10 },
    { id: App.scenario.TR_TRANSFER_1, pos: 100 },
]);

const filter = async () => {
    setBlock('Filter transactions', 2);

    const data = [{
        order: 'desc',
    }, {
        order: 'asc',
    }, {
        type: DEBT,
    }, {
        type: [EXPENSE, INCOME, TRANSFER],
    }, {
        accounts: App.scenario.ACC_RUB,
    }, {
        accounts: [App.scenario.ACC_RUB, App.scenario.ACC_USD],
    }, {
        accounts: App.scenario.ACC_RUB,
        order: 'desc',
    }, {
        type: DEBT,
        accounts: App.scenario.ACC_RUB,
    }, {
        persons: App.scenario.PERSON_X,
    }, {
        onPage: 10,
    }, {
        onPage: 10,
        page: 2,
    }, {
        startDate: App.dates.now,
        endDate: App.dates.weekAfter,
    }, {
        startDate: App.dates.now,
        endDate: App.dates.weekAfter,
        search: '1',
    }, {
        search: 'la',
    }, {
        search: 'кк',
    }];

    return App.scenario.runner.runGroup(TransactionApiTests.filter, data);
};

const statistics = async () => {
    setBlock('Statistics', 2);

    const { RUB } = App.scenario;

    const data = [
        {},
        { filter: 'account', acc_id: App.scenario.ACC_RUB },
        { filter: 'account', acc_id: App.scenario.ACC_RUB, type: INCOME },
        { filter: 'currency', curr_id: RUB },
        { filter: 'currency', curr_id: RUB, group: 'day' },
        { filter: 'currency', curr_id: RUB, group: 'week' },
        {
            filter: 'currency',
            curr_id: RUB,
            group: 'week',
            stdate: App.dates.monthAgo,
            enddate: App.dates.now,
        },
    ];

    return App.scenario.runner.runGroup(TransactionApiTests.statistics, data);
};

export const apiTransactionsTests = {
    async createTests() {
        await create();
        await createMultiple();
    },

    async updateTests() {
        await update();
        await setPos();
    },

    async filterTests() {
        await filter();
        await statistics();
    },

    async deleteTests() {
        await del();
    },
};
