import { setBlock } from 'jezve-test';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../../../model/Transaction.js';
import { App } from '../../../Application.js';
import * as TransactionApiTests from '../../../run/api/transaction.js';
import { dateToSeconds } from '../../../common.js';

const create = async () => {
    setBlock('Create transactions', 2);

    const {
        RUB,
        USD,
        EUR,
        ACC_RUB,
        ACC_USD,
        CASH_RUB,
        PERSON_X,
        PERSON_Y,
        FOOD_CATEGORY,
    } = App.scenario;

    const weekDate1 = new Date(2022, 11, 30);
    const weekDate2 = new Date(2023, 0, 1);

    const data = [{
        type: EXPENSE,
        src_id: ACC_RUB,
        src_amount: 100,
        comment: '11',
    }, {
        type: EXPENSE,
        src_id: ACC_RUB,
        src_amount: 7608,
        dest_amount: 100,
        dest_curr: EUR,
        comment: '22',
        category_id: FOOD_CATEGORY,
    }, {
        type: EXPENSE,
        src_id: ACC_USD,
        src_amount: 1,
        date: App.datesSec.yesterday,
        category_id: FOOD_CATEGORY,
    }, {
        type: INCOME,
        dest_id: ACC_RUB,
        dest_amount: 1000.50,
        comment: 'lalala',
    }, {
        type: INCOME,
        dest_id: ACC_USD,
        src_amount: 6500,
        dest_amount: 100,
        src_curr: RUB,
        comment: 'la',
    }, {
        type: TRANSFER,
        src_id: ACC_RUB,
        dest_id: CASH_RUB,
        src_amount: 500,
        dest_amount: 500,
    }, {
        type: TRANSFER,
        src_id: ACC_RUB,
        dest_id: ACC_USD,
        src_amount: 6500,
        dest_amount: 100,
    }, {
        type: DEBT,
        op: 1,
        person_id: PERSON_X,
        acc_id: 0,
        src_amount: 500,
        src_curr: RUB,
        comment: 'к кк',
    }, {
        type: DEBT,
        op: 2,
        person_id: PERSON_Y,
        acc_id: 0,
        dest_amount: 1000,
        dest_curr: USD,
        comment: 'к',
    }, {
        type: DEBT,
        op: 1,
        person_id: PERSON_X,
        acc_id: 0,
        src_amount: 500,
        src_curr: RUB,
        comment: 'ппп',
    }, {
        type: DEBT,
        op: 2,
        person_id: PERSON_Y,
        acc_id: 0,
        dest_amount: 1000,
        dest_curr: USD,
        category_id: FOOD_CATEGORY,
    }, {
        type: DEBT,
        op: 1,
        person_id: PERSON_X,
        acc_id: ACC_RUB,
        src_amount: 100,
        src_curr: RUB,
    }, {
        type: DEBT,
        op: 1,
        person_id: PERSON_X,
        acc_id: ACC_RUB,
        src_amount: 100,
        src_curr: USD,
        dest_amount: 6500,
        dest_curr: RUB,
    }, {
        type: DEBT,
        op: 2,
        person_id: PERSON_X,
        acc_id: ACC_USD,
        src_amount: 100,
        src_curr: USD,
        dest_amount: 91,
        dest_curr: EUR,
    }, {
        type: EXPENSE,
        src_id: ACC_RUB,
        src_amount: 123,
        date: dateToSeconds(weekDate1),
    }, {
        type: EXPENSE,
        src_id: ACC_RUB,
        src_amount: 456,
        date: dateToSeconds(weekDate2),
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
        App.scenario.TR_DEBT_4,
        App.scenario.TR_DEBT_5,
        App.scenario.TR_DEBT_6,
        App.scenario.TR_DEBT_7,
    ] = await App.scenario.runner.runGroup(TransactionApiTests.extractAndCreate, data);
};

const createInvalid = async () => {
    setBlock('Create transactions with invalid data', 2);

    const {
        RUB,
        USD,
        EUR,
        ACC_RUB,
        CASH_RUB,
        ACC_USD,
        PERSON_X,
    } = App.scenario;

    // Find person account for invalid transaction
    await App.state.fetch();
    const personAccount = App.state.getPersonAccount(App.scenario.PERSON_Y, USD);

    const data = [{
        type: EXPENSE,
        src_id: 0,
        src_amount: 100,
    }, {
        type: EXPENSE,
        src_id: ACC_RUB,
        src_amount: 0,
    }, {
        type: EXPENSE,
        src_id: ACC_RUB,
        src_amount: 10,
        category_id: -1,
    }, {
        type: EXPENSE,
        src_id: ACC_RUB,
        src_amount: -100,
    }, {
        type: EXPENSE,
        src_id: ACC_RUB,
        src_amount: 100,
        dest_amount: 1000,
    }, {
        type: EXPENSE,
        src_id: 0,
        dest_id: ACC_RUB,
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
        src_id: ACC_RUB,
        dest_id: 0,
        dest_amount: 100,
    }, {
        type: INCOME,
        dest_id: ACC_RUB,
        dest_amount: '',
    }, {
        type: INCOME,
        dest_id: ACC_RUB,
        dest_amount: -100,
    }, {
        type: INCOME,
        dest_id: personAccount.id,
        dest_amount: 100,
    }, {
        type: INCOME,
        dest_id: ACC_RUB,
        dest_amount: 99.1,
        date: '1f1f',
    }, {
        type: TRANSFER,
        src_id: 0,
        dest_id: 0,
        src_amount: 100,
    }, {
        type: TRANSFER,
        src_id: ACC_RUB,
        dest_id: 0,
        src_amount: 100,
    }, {
        type: TRANSFER,
        src_id: 0,
        dest_id: ACC_RUB,
        src_amount: 100,
    }, {
        type: TRANSFER,
        src_id: ACC_RUB,
        dest_id: ACC_RUB,
        src_amount: 6500,
        dest_amount: 100,
    }, {
        type: TRANSFER,
        src_id: ACC_RUB,
        dest_id: CASH_RUB,
        src_amount: 0,
    }, {
        type: TRANSFER,
        src_id: ACC_RUB,
        dest_id: CASH_RUB,
        src_amount: -100,
    }, {
        type: TRANSFER,
        src_id: ACC_RUB,
        dest_id: CASH_RUB,
        src_amount: 100,
        dest_amount: 100,
    }, {
        type: TRANSFER,
        src_id: ACC_USD,
        dest_id: personAccount.id,
        src_amount: 100,
    }, {
        type: DEBT,
        op: 0,
        person_id: PERSON_X,
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
        person_id: PERSON_X,
        acc_id: 0,
        src_amount: '',
        src_curr: RUB,
    }, {
        type: DEBT,
        op: 1,
        person_id: PERSON_X,
        acc_id: 0,
        src_amount: -100,
        src_curr: RUB,
    }, {
        type: DEBT,
        op: 1,
        person_id: PERSON_X,
        acc_id: 0,
        src_amount: 10,
        src_curr: 9999,
    }, {
        type: DEBT,
        op: 1,
        person_id: PERSON_X,
        acc_id: ACC_RUB,
        src_amount: 10,
        src_curr: USD,
        dest_amount: 9,
        dest_curr: EUR,
    }];

    await App.scenario.runner.runGroup(TransactionApiTests.extractAndCreate, data);
};

const createMultiple = async () => {
    setBlock('Create multiple transactions', 2);

    const {
        RUB,
        EUR,
        ACC_RUB,
        CASH_RUB,
        ACC_USD,
        PERSON_X,
        FOOD_CATEGORY,
    } = App.scenario;

    const data = [{
        type: EXPENSE,
        src_id: ACC_RUB,
        src_amount: 7608,
        dest_amount: 100,
        dest_curr: EUR,
        date: App.datesSec.yesterday,
        comment: 'multiple expense',
        category_id: FOOD_CATEGORY,
    }, {
        type: INCOME,
        dest_id: ACC_USD,
        src_amount: 6500,
        dest_amount: 100,
        src_curr: RUB,
        comment: 'multiple income',
    }, {
        type: TRANSFER,
        src_id: ACC_RUB,
        dest_id: CASH_RUB,
        src_amount: 500,
        dest_amount: 500,
        comment: 'multiple transfer',
    }, {
        type: DEBT,
        op: 1,
        person_id: PERSON_X,
        acc_id: 0,
        src_amount: 500,
        src_curr: RUB,
        comment: 'multiple debt',
    }];

    // Add transaction year after latest for statistics tests
    const now = new Date();
    const yearAfter = dateToSeconds(
        new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
    );
    const [expenseItem] = data;
    data.push({
        ...expenseItem,
        date: yearAfter,
    });

    await TransactionApiTests.extractAndCreateMultiple(data);
};

const createMultipleInvalid = async () => {
    setBlock('Create multiple transactions with invalid data', 2);

    const data = [
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

    await App.scenario.runner.runGroup(TransactionApiTests.extractAndCreateMultiple, data);
};

const update = async () => {
    setBlock('Update transactions', 3);

    const {
        RUB,
        USD,
        EUR,
        ACC_RUB,
        CASH_RUB,
        ACC_USD,
        PERSON_Y,
        TRANSPORT_CATEGORY,
    } = App.scenario;

    const data = [{
        id: App.scenario.TR_EXPENSE_1,
        src_id: App.scenario.CASH_RUB,
    }, {
        id: App.scenario.TR_EXPENSE_2,
        dest_amount: 7608,
        dest_curr: RUB,
        category_id: TRANSPORT_CATEGORY,
    }, {
        id: App.scenario.TR_EXPENSE_3,
        dest_amount: 0.89,
        dest_curr: EUR,
        date: App.datesSec.weekAgo,
    }, {
        id: App.scenario.TR_INCOME_1,
        dest_id: CASH_RUB,
    }, {
        id: App.scenario.TR_INCOME_2,
        src_amount: 100,
        src_curr: USD,
    }, {
        id: App.scenario.TR_TRANSFER_1,
        dest_id: ACC_USD,
        dest_curr: USD,
        dest_amount: 8,
    }, {
        id: App.scenario.TR_TRANSFER_2,
        dest_id: CASH_RUB,
        dest_curr: RUB,
        dest_amount: 6500,
        date: App.datesSec.yesterday,
    }, {
        id: App.scenario.TR_DEBT_1,
        op: 2,
    }, {
        id: App.scenario.TR_DEBT_2,
        person_id: PERSON_Y,
        acc_id: 0,
    }, {
        id: App.scenario.TR_DEBT_3,
        op: 1,
        acc_id: ACC_RUB,
    }, {
        id: App.scenario.TR_DEBT_6,
        src_curr: EUR,
    }];

    await App.scenario.runner.runGroup(TransactionApiTests.update, data);
};

const updateInvalid = async () => {
    setBlock('Update transactions with invalid data', 2);

    const {
        RUB,
        USD,
        EUR,
        PLN,
        ACC_RUB,
        CASH_RUB,
        ACC_USD,
    } = App.scenario;

    // Find person account for invalid transaction
    await App.state.fetch();
    const personAccount = App.state.getPersonAccount(App.scenario.PERSON_Y, USD);

    const data = [{
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
        dest_id: ACC_USD,
        dest_curr: PLN,
    }, {
        id: App.scenario.TR_TRANSFER_1,
        dest_id: ACC_RUB,
    }, {
        id: App.scenario.TR_TRANSFER_2,
        dest_id: CASH_RUB,
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
        acc_id: -1,
    }, {
        id: App.scenario.TR_DEBT_7,
        src_curr: EUR,
    }];

    await App.scenario.runner.runGroup(TransactionApiTests.update, data);
};

const del = async () => {
    setBlock('Delete transactions', 2);

    const data = [
        [App.scenario.TR_EXPENSE_2],
        [App.scenario.TR_TRANSFER_1, App.scenario.TR_DEBT_3],
    ];

    await App.scenario.runner.runGroup(TransactionApiTests.del, data);
};

const delInvalid = async () => {
    setBlock('Delete transactions with invalid data', 2);

    const data = [
        null,
        [null, null],
        [],
        [-1],
    ];

    await App.scenario.runner.runGroup(TransactionApiTests.del, data);
};

const setCategory = async () => {
    setBlock('Set category of transactions', 2);

    const {
        TR_EXPENSE_1,
        TR_EXPENSE_2,
        TR_EXPENSE_3,
        CAFE_CATEGORY,
        FOOD_CATEGORY,
    } = App.scenario;

    const data = [
        { id: TR_EXPENSE_1, category_id: CAFE_CATEGORY },
        { id: [TR_EXPENSE_2, TR_EXPENSE_3], category_id: FOOD_CATEGORY },
        { id: [TR_EXPENSE_2], category_id: 0 },
    ];

    await App.scenario.runner.runGroup(TransactionApiTests.setPos, data);
};

const setCategoryInvalid = async () => {
    setBlock('Set category of transactions with invalid data', 2);

    const {
        TR_EXPENSE_1,
        CAFE_CATEGORY,
    } = App.scenario;

    const data = [
        { id: null, category_id: CAFE_CATEGORY },
        { id: [null, null], category_id: CAFE_CATEGORY },
        { id: [-1], category_id: CAFE_CATEGORY },
        { id: [TR_EXPENSE_1], category_id: null },
        { id: [TR_EXPENSE_1], category_id: -1 },
    ];

    await App.scenario.runner.runGroup(TransactionApiTests.setPos, data);
};

const setPos = async () => {
    setBlock('Set position of transaction', 2);

    const data = [
        { id: App.scenario.TR_EXPENSE_2, pos: 5 },
        { id: App.scenario.TR_INCOME_2, pos: 10 },
        { id: App.scenario.TR_TRANSFER_1, pos: 100 },
    ];

    await App.scenario.runner.runGroup(TransactionApiTests.setPos, data);
};

const filter = async () => {
    setBlock('Filter transactions', 2);

    const {
        ACC_RUB,
        ACC_USD,
        PERSON_X,
        TRANSPORT_CATEGORY,
    } = App.scenario;

    const data = [{
        order: 'desc',
    }, {
        order: 'asc',
    }, {
        type: DEBT,
    }, {
        type: [EXPENSE, INCOME, TRANSFER],
    }, {
        accounts: ACC_RUB,
    }, {
        accounts: [ACC_RUB, ACC_USD],
    }, {
        accounts: ACC_RUB,
        order: 'desc',
    }, {
        type: DEBT,
        accounts: ACC_RUB,
    }, {
        persons: PERSON_X,
    }, {
        categories: 0,
    }, {
        categories: TRANSPORT_CATEGORY,
    }, {
        categories: [0, TRANSPORT_CATEGORY],
    }, {
        onPage: 10,
    }, {
        onPage: 10,
        page: 2,
    }, {
        startDate: App.datesSec.now,
        endDate: App.datesSec.weekAfter,
    }, {
        startDate: App.datesSec.now,
        endDate: App.datesSec.weekAfter,
        search: '1',
    }, {
        search: 'la',
    }, {
        search: 'кк',
    }];

    return App.scenario.runner.runGroup(TransactionApiTests.filter, data);
};

const statistics = async () => {
    setBlock('Statistics', 1);

    const {
        RUB,
        ACC_RUB,
        FOOD_CATEGORY,
        BIKE_CATEGORY,
    } = App.scenario;

    const data = [
        {},
        { report: 'account', acc_id: ACC_RUB },
        { report: 'account', acc_id: ACC_RUB, type: INCOME },
        { report: 'currency', curr_id: RUB },
        { report: 'currency', curr_id: RUB, group: 'day' },
        { report: 'currency', curr_id: RUB, group: 'week' },
        {
            report: 'currency',
            curr_id: RUB,
            group: 'week',
            stdate: App.datesSec.monthAgo,
            enddate: App.datesSec.now,
        },
        {
            report: 'account',
            acc_id: ACC_RUB,
            group: 'week',
            type: EXPENSE,
        },
        {
            report: 'account',
            acc_id: ACC_RUB,
            group: 'month',
            type: EXPENSE,
        },
        {
            report: 'account',
            acc_id: ACC_RUB,
            group: 'year',
            type: EXPENSE,
        },
        {
            report: 'category',
            category_id: 0,
            group: 'day',
            type: EXPENSE,
        },
        {
            report: 'category',
            category_id: FOOD_CATEGORY,
            group: 'day',
            type: EXPENSE,
        },
        {
            report: 'category',
            category_id: [FOOD_CATEGORY, BIKE_CATEGORY],
            group: 'day',
            type: EXPENSE,
        },
        {
            report: 'category',
            group: 'week',
            type: EXPENSE,
        },
    ];

    return App.scenario.runner.runGroup(TransactionApiTests.statistics, data);
};

export const apiTransactionsTests = {
    async createTests() {
        await create();
        await createInvalid();
        await createMultiple();
        await createMultipleInvalid();
    },

    async updateTests() {
        await update();
        await updateInvalid();
        await setCategory();
        await setCategoryInvalid();
        await setPos();
    },

    async filterTests() {
        await filter();
        await statistics();
    },

    async deleteTests() {
        await del();
        await delInvalid();
    },
};
