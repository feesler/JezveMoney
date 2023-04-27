import { assert, setBlock } from 'jezve-test';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    LIMIT_CHANGE,
} from '../../../model/Transaction.js';
import { App } from '../../../Application.js';
import * as Actions from '../../../actions/api/transaction.js';
import { dateToSeconds, formatProps } from '../../../common.js';

const create = async () => {
    setBlock('Create transactions', 2);

    const {
        RUB,
        USD,
        EUR,
        BTC,
        ACC_RUB,
        ACC_USD,
        CASH_RUB,
        ACCOUNT_3,
        BTC_CREDIT,
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
        type: LIMIT_CHANGE,
        src_id: 0,
        dest_id: ACCOUNT_3,
        src_amount: 100,
        dest_amount: 100,
        src_curr: USD,
        dest_curr: USD,
    }, {
        type: LIMIT_CHANGE,
        src_id: BTC_CREDIT,
        dest_id: 0,
        src_amount: 0.01,
        dest_amount: 0.01,
        src_curr: BTC,
        dest_curr: BTC,
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

    const res = await App.scenario.runner.runGroup(Actions.extractAndCreate, data);
    // Double check all transactions created
    res.forEach((item) => assert(item, 'Failed to create transaction'));

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
        App.scenario.TR_LIMIT_1,
        App.scenario.TR_LIMIT_2,
    ] = res;
};

const createWithChainedRequest = async () => {
    setBlock('Create transactions with chained request', 2);

    const { EUR, ACC_RUB } = App.scenario;

    const data = [{
        type: EXPENSE,
        src_id: ACC_RUB,
        src_amount: 10,
        comment: 'Chained',
        returnState: {
            transactions: {},
        },
    }, {
        type: EXPENSE,
        src_id: ACC_RUB,
        src_amount: 4588,
        dest_amount: 50,
        dest_curr: EUR,
        comment: 'Chained 2',
        returnState: {
            transactions: {
                type: EXPENSE,
            },
        },
    }];

    const res = await App.scenario.runner.runGroup(Actions.extractAndCreate, data);
    // Double check all transactions created
    res.forEach((item) => assert(item, 'Failed to create transaction'));

    [
        App.scenario.TR_EXPENSE_CHAINED_1,
        App.scenario.TR_EXPENSE_CHAINED_2,
    ] = res;
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
        src_amount: 100,
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
        src_amount: 6500,
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

    const res = await App.scenario.runner.runGroup(Actions.extractAndCreate, data);
    // Double check all transactions not created
    res.forEach((item, index) => {
        assert(!item, `Created transaction with invalid data: { ${formatProps(data[index])} }`);
    });
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

    await Actions.extractAndCreateMultiple(data);
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

    await App.scenario.runner.runGroup(Actions.extractAndCreateMultiple, data);
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
    }, {
        id: App.scenario.TR_LIMIT_1,
        src_amount: 150,
        dest_amount: 150,
    }];

    await App.scenario.runner.runGroup(Actions.update, data);
};

const updateWithChainedRequest = async () => {
    setBlock('Update transactions with chained request', 3);

    const {
        USD,
        CASH_RUB,
        TR_EXPENSE_CHAINED_1,
        TR_EXPENSE_CHAINED_2,
    } = App.scenario;

    const data = [{
        id: TR_EXPENSE_CHAINED_1,
        src_id: CASH_RUB,
        returnState: {
            transactions: { onPage: 20 },
        },
    }, {
        id: TR_EXPENSE_CHAINED_2,
        dest_amount: 58,
        dest_curr: USD,
        returnState: {
            transactions: { range: 2 },
        },
    }];

    await App.scenario.runner.runGroup(Actions.update, data);
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

    await App.scenario.runner.runGroup(Actions.update, data);
};

const del = async () => {
    setBlock('Delete transactions', 2);

    const {
        TR_EXPENSE_2,
        TR_INCOME_1,
        TR_TRANSFER_1,
        TR_DEBT_3,
        TR_LIMIT_1,
    } = App.scenario;

    const data = [
        { id: TR_EXPENSE_2 },
        { id: TR_INCOME_1 },
        { id: [TR_TRANSFER_1, TR_DEBT_3, TR_LIMIT_1] },
    ];

    await App.scenario.runner.runGroup(Actions.del, data);
};

const delWithChainedRequest = async () => {
    setBlock('Delete transactions with chained request', 2);

    const data = [
        {
            id: [App.scenario.TR_TRANSFER_1, App.scenario.TR_DEBT_3],
            returnState: {
                transactions: {},
                accounts: { visibility: 'all' },
                persons: { visibility: 'all' },
            },
        },
    ];

    await App.scenario.runner.runGroup(Actions.del, data);
};

const delInvalid = async () => {
    setBlock('Delete transactions with invalid data', 2);

    const data = [
        null,
        [null, null],
        [],
        [-1],
    ];

    await App.scenario.runner.runGroup(Actions.del, data);
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

    await App.scenario.runner.runGroup(Actions.setCategory, data);
};

const setCategoryWithChainedRequest = async () => {
    setBlock('Set category of transactions with chained request', 2);

    const {
        TR_EXPENSE_CHAINED_1,
        FOOD_CATEGORY,
    } = App.scenario;

    const data = [
        {
            id: TR_EXPENSE_CHAINED_1,
            category_id: FOOD_CATEGORY,
            returnState: {
                transactions: { categories: FOOD_CATEGORY },
                accounts: { visibility: 'all' },
            },
        },
    ];

    await App.scenario.runner.runGroup(Actions.setCategory, data);
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

    await App.scenario.runner.runGroup(Actions.setCategory, data);
};

const setPos = async () => {
    setBlock('Set position', 2);

    const data = [
        { id: App.scenario.TR_EXPENSE_2, pos: 5 },
        { id: App.scenario.TR_INCOME_2, pos: 10 },
        { id: App.scenario.TR_TRANSFER_1, pos: 100 },
    ];

    await App.scenario.runner.runGroup(Actions.setPos, data);
};

const setPosWithChainedRequest = async () => {
    setBlock('Set position with chained request', 2);

    const data = [
        {
            id: App.scenario.TR_EXPENSE_CHAINED_1,
            pos: 15,
            returnState: {
                transactions: {},
            },
        },
    ];

    await App.scenario.runner.runGroup(Actions.setPos, data);
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
        startDate: App.datesSec.monthAgo,
    }, {
        endDate: App.datesSec.yesterday,
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

    return App.scenario.runner.runGroup(Actions.filter, data);
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
        },
        {
            report: 'currency',
            curr_id: RUB,
            group: 'week',
            enddate: App.datesSec.now,
        },
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

    return App.scenario.runner.runGroup(Actions.statistics, data);
};

export const apiTransactionsTests = {
    async createTests() {
        await create();
        await createWithChainedRequest();
        await createInvalid();
        await createMultiple();
        await createMultipleInvalid();
    },

    async updateTests() {
        await update();
        await updateWithChainedRequest();
        await updateInvalid();
        await setCategory();
        await setCategoryWithChainedRequest();
        await setCategoryInvalid();
        await setPos();
        await setPosWithChainedRequest();
    },

    async filterTests() {
        await filter();
        await statistics();
    },

    async deleteTests() {
        await del();
        await delWithChainedRequest();
        await delInvalid();
    },
};
