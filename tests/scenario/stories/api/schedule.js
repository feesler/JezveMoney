import { asArray, assert, setBlock } from 'jezve-test';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    LIMIT_CHANGE,
} from '../../../model/Transaction.js';
import { App } from '../../../Application.js';
import * as Actions from '../../../actions/api/schedule.js';
import { dateToSeconds, formatProps } from '../../../common.js';
import {
    INTERVAL_DAY,
    INTERVAL_WEEK,
    INTERVAL_MONTH,
    INTERVAL_YEAR,
} from '../../../model/ScheduledTransaction.js';

const create = async () => {
    setBlock('Create scheduled transactions', 2);

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
        FOOD_CATEGORY,
    } = App.scenario;

    const weekDate1 = new Date(2022, 11, 30);
    const weekDate2 = new Date(2023, 0, 1);

    const personXAccount = App.state.getPersonAccount(PERSON_X, RUB);

    const data = [{
        type: EXPENSE,
        src_id: ACC_RUB,
        src_amount: 100,
        comment: '11',
        start_date: dateToSeconds(weekDate1),
        end_date: null,
        interval_type: INTERVAL_MONTH,
        interval_step: 1,
        interval_offset: 0,
    }, {
        type: EXPENSE,
        src_id: ACC_RUB,
        src_amount: 7608,
        dest_amount: 100,
        dest_curr: EUR,
        comment: '22',
        category_id: FOOD_CATEGORY,
        start_date: App.datesSec.now,
        end_date: App.datesSec.weekAfter,
        interval_type: INTERVAL_DAY,
        interval_step: 2,
        interval_offset: 0,
    }, {
        type: INCOME,
        dest_id: ACC_RUB,
        dest_amount: 1000.50,
        comment: 'Salary',
        start_date: App.datesSec.now,
        end_date: null,
        interval_type: INTERVAL_MONTH,
        interval_step: 1,
        interval_offset: 20,
    }, {
        type: INCOME,
        dest_id: ACC_RUB,
        dest_amount: 456,
        start_date: dateToSeconds(weekDate2),
        end_date: App.datesSec.now,
        interval_type: INTERVAL_WEEK,
        interval_step: 1,
        interval_offset: 2,
    }, {
        type: TRANSFER,
        src_id: ACC_RUB,
        dest_id: CASH_RUB,
        src_amount: 500,
        dest_amount: 500,
        start_date: App.datesSec.now,
        end_date: App.datesSec.weekAfter,
        interval_type: INTERVAL_DAY,
        interval_step: 2,
        interval_offset: 0,
    }, {
        type: TRANSFER,
        src_id: ACC_RUB,
        dest_id: ACC_USD,
        src_amount: 6500,
        dest_amount: 100,
        start_date: App.datesSec.now,
        end_date: null,
        interval_type: INTERVAL_MONTH,
        interval_step: 1,
        interval_offset: 20,
    }, {
        type: DEBT,
        src_id: personXAccount.id,
        dest_id: 0,
        src_amount: 500,
        src_curr: RUB,
        comment: 'к кк',
        start_date: App.datesSec.now,
        end_date: App.datesSec.weekAfter,
        interval_type: INTERVAL_DAY,
        interval_step: 2,
        interval_offset: 0,
    }, {
        type: DEBT,
        src_id: ACC_RUB,
        dest_id: personXAccount.id,
        dest_amount: 1000,
        dest_curr: RUB,
        comment: 'к',
        start_date: App.datesSec.now,
        end_date: null,
        interval_type: INTERVAL_YEAR,
        interval_step: 1,
        interval_offset: 20,
    }, {
        type: LIMIT_CHANGE,
        src_id: 0,
        dest_id: ACCOUNT_3,
        src_amount: 100,
        dest_amount: 100,
        src_curr: USD,
        dest_curr: USD,
        start_date: App.datesSec.now,
        end_date: App.datesSec.weekAfter,
        interval_type: INTERVAL_DAY,
        interval_step: 2,
        interval_offset: 0,
    }, {
        type: LIMIT_CHANGE,
        src_id: BTC_CREDIT,
        dest_id: 0,
        src_amount: 0.01,
        dest_amount: 0.01,
        src_curr: BTC,
        dest_curr: BTC,
        start_date: App.datesSec.now,
        end_date: null,
        interval_type: INTERVAL_MONTH,
        interval_step: 1,
        interval_offset: 20,
    }];

    const res = await App.scenario.runner.runGroup(async (params) => {
        const item = await Actions.extractAndCreate(params);
        // Double check all transactions created
        assert(item, 'Failed to create scheduled transaction');
        return item;
    }, data);

    [
        App.scenario.SCHEDULED_TR_EXPENSE_1,
        App.scenario.SCHEDULED_TR_EXPENSE_2,
        App.scenario.SCHEDULED_TR_INCOME_1,
        App.scenario.SCHEDULED_TR_INCOME_2,
        App.scenario.SCHEDULED_TR_TRANSFER_1,
        App.scenario.SCHEDULED_TR_TRANSFER_2,
        App.scenario.SCHEDULED_TR_DEBT_1,
        App.scenario.SCHEDULED_TR_DEBT_2,
        App.scenario.SCHEDULED_TR_LIMIT_1,
        App.scenario.SCHEDULED_TR_LIMIT_2,
    ] = res;

    [
        App.scenario.REMINDER_EXPENSE_1_1,
        App.scenario.REMINDER_EXPENSE_1_2,
    ] = App.state.reminders.getRemindersBySchedule(App.scenario.SCHEDULED_TR_EXPENSE_1, true);
    [
        App.scenario.REMINDER_INCOME_2_1,
        App.scenario.REMINDER_INCOME_2_2,
    ] = App.state.reminders.getRemindersBySchedule(App.scenario.SCHEDULED_TR_INCOME_2, true);
    [
        App.scenario.REMINDER_TRANSFER_1_1,
    ] = App.state.reminders.getRemindersBySchedule(App.scenario.SCHEDULED_TR_TRANSFER_1, true);
    [
        App.scenario.REMINDER_DEBT_1_1,
    ] = App.state.reminders.getRemindersBySchedule(App.scenario.SCHEDULED_TR_DEBT_1, true);
    [
        App.scenario.REMINDER_LIMIT_1_1,
    ] = App.state.reminders.getRemindersBySchedule(App.scenario.SCHEDULED_TR_LIMIT_1, true);

    const reminderIds = [
        'REMINDER_EXPENSE_1_1',
        'REMINDER_EXPENSE_1_2',
        'REMINDER_INCOME_2_1',
        'REMINDER_INCOME_2_2',
        'REMINDER_TRANSFER_1_1',
        'REMINDER_DEBT_1_1',
        'REMINDER_LIMIT_1_1',
    ];

    reminderIds.forEach((id) => assert(App.scenario[id], `Reminder '${id}' not found`));
};

const createWithChainedRequest = async () => {
    setBlock('Create scheduled transactions with chained request', 2);

    const { ACC_RUB } = App.scenario;

    const data = [{
        type: EXPENSE,
        src_id: ACC_RUB,
        src_amount: 10,
        comment: 'Chained',
        start_date: App.datesSec.now,
        end_date: null,
        interval_type: INTERVAL_MONTH,
        interval_step: 1,
        interval_offset: 20,
        returnState: {
            schedule: {},
        },
    }];

    const res = await App.scenario.runner.runGroup(async (params) => {
        const item = await Actions.extractAndCreate(params);
        // Double check all transactions created
        assert(item, 'Failed to create scheduled transaction');
        return item;
    }, data);

    [
        App.scenario.SCHEDULED_TR_EXPENSE_CHAINED_1,
    ] = res;
};

const createInvalid = async () => {
    setBlock('Create scheduled transactions with invalid data', 2);

    const {
        RUB,
        USD,
        EUR,
        ACC_RUB,
        CASH_RUB,
        ACC_USD,
        PERSON_X,
        PERSON_Y,
    } = App.scenario;

    const personXAccount = App.state.getPersonAccount(PERSON_X, RUB);
    const personYAccount = App.state.getPersonAccount(PERSON_Y, USD);

    const data = [{ // Invalid source account
        type: EXPENSE,
        src_id: 0,
        src_amount: 100,
    }, { // Invalid source amount
        type: EXPENSE,
        src_id: ACC_RUB,
        src_amount: 0,
    }, { // Invalid category
        type: EXPENSE,
        src_id: ACC_RUB,
        src_amount: 10,
        category_id: -1,
    }, { // Invalid source amount
        type: EXPENSE,
        src_id: ACC_RUB,
        src_amount: -100,
    }, { // Invalid amounts
        type: EXPENSE,
        src_id: ACC_RUB,
        src_amount: 100,
        dest_amount: 1000,
    }, { // Invalid accounts
        type: EXPENSE,
        src_id: 0,
        dest_id: ACC_RUB,
        src_amount: 100,
    }, { // Invalid accounts
        type: EXPENSE,
        src_id: personYAccount.id,
        src_amount: 100,
    }, {
        type: INCOME,
        dest_id: 0,
        dest_amount: 100,
    }, { // Invalid accounts
        type: INCOME,
        src_id: ACC_RUB,
        dest_id: 0,
        dest_amount: 100,
    }, { // Invalid destination amount
        type: INCOME,
        dest_id: ACC_RUB,
        dest_amount: '',
    }, { // Invalid destination amount
        type: INCOME,
        dest_id: ACC_RUB,
        dest_amount: -100,
    }, { // Invalid accounts
        type: INCOME,
        dest_id: personYAccount.id,
        dest_amount: 100,
    }, { // Invalid accounts
        type: TRANSFER,
        src_id: 0,
        dest_id: 0,
        src_amount: 100,
    }, { // Invalid accounts
        type: TRANSFER,
        src_id: ACC_RUB,
        dest_id: 0,
        src_amount: 100,
    }, { // Invalid accounts
        type: TRANSFER,
        src_id: 0,
        dest_id: ACC_RUB,
        src_amount: 100,
    }, { // Invalid accounts
        type: TRANSFER,
        src_id: ACC_RUB,
        dest_id: ACC_RUB,
        src_amount: 100,
        dest_amount: 100,
    }, { // Invalid source amount
        type: TRANSFER,
        src_id: ACC_RUB,
        dest_id: CASH_RUB,
        src_amount: 0,
    }, { // Invalid source amount
        type: TRANSFER,
        src_id: ACC_RUB,
        dest_id: CASH_RUB,
        src_amount: -100,
    }, { // Invalid amounts
        type: TRANSFER,
        src_id: ACC_RUB,
        dest_id: CASH_RUB,
        src_amount: 6500,
        dest_amount: 100,
    }, { // Invalid accounts
        type: TRANSFER,
        src_id: ACC_USD,
        dest_id: personYAccount.id,
        src_amount: 100,
    }, { // Invalid accounts
        type: DEBT,
        src_id: ACC_RUB,
        dest_id: 0,
        src_amount: 500,
        src_curr: RUB,
    }, { // Invalid accounts
        type: DEBT,
        src_id: 0,
        dest_id: ACC_RUB,
        src_amount: 500,
        src_curr: RUB,
    }, { // Invalid accounts
        type: DEBT,
        src_id: 0,
        dest_id: 0,
        src_amount: 500,
        src_curr: RUB,
    }, { // Invalid source amount
        type: DEBT,
        src_id: 0,
        dest_id: personXAccount.id,
        src_amount: '',
        src_curr: RUB,
    }, { // Invalid source amount
        type: DEBT,
        src_id: personXAccount.id,
        dest_id: 0,
        src_amount: -100,
        src_curr: RUB,
    }, { // Invalid source currency
        type: DEBT,
        src_id: personXAccount.id,
        dest_id: 0,
        src_amount: 10,
        src_curr: 9999,
    }, { // Invalid destination currency
        type: DEBT,
        src_id: personXAccount.id,
        dest_id: ACC_RUB,
        src_amount: 10,
        src_curr: RUB,
        dest_amount: 9,
        dest_curr: EUR,
    }, { // Invalid start date
        type: DEBT,
        src_id: personXAccount.id,
        src_amount: 10,
        start_date: null,
        end_date: null,
        interval_type: INTERVAL_DAY,
        interval_step: 1,
        interval_offset: 0,
    }, { // Invalid start date
        type: DEBT,
        src_id: personXAccount.id,
        src_amount: 10,
        start_date: 'x',
        end_date: null,
        interval_type: INTERVAL_DAY,
        interval_step: 1,
        interval_offset: 0,
    }, { // Invalid end date
        type: DEBT,
        src_id: personXAccount.id,
        src_amount: 10,
        start_date: App.datesSec.now,
        end_date: App.datesSec.monthAgo,
        interval_type: INTERVAL_DAY,
        interval_step: 1,
        interval_offset: 0,
    }, { // Invalid interval step
        type: DEBT,
        src_id: personXAccount.id,
        src_amount: 10,
        start_date: App.datesSec.now,
        end_date: App.datesSec.monthAgo,
        interval_type: INTERVAL_DAY,
        interval_step: -1,
        interval_offset: 0,
    }, { // Invalid interval offset
        type: DEBT,
        src_id: personXAccount.id,
        src_amount: 10,
        start_date: App.datesSec.now,
        end_date: App.datesSec.monthAgo,
        interval_type: INTERVAL_DAY,
        interval_step: 1,
        interval_offset: 3,
    }];

    await App.scenario.runner.runGroup(async (params) => {
        const item = await Actions.extractAndCreate(params);
        // Double check all transactions not created
        assert(!item, `Created scheduled transaction with invalid data: { ${formatProps(params)} }`);
    }, data);
};

const createMultiple = async () => {
    setBlock('Create multiple scheduled transactions', 2);

    const {
        RUB,
        EUR,
        ACC_RUB,
        CASH_RUB,
        ACC_USD,
        PERSON_X,
        FOOD_CATEGORY,
    } = App.scenario;

    const personXAccount = App.state.getPersonAccount(PERSON_X, RUB);

    const data = [{
        type: EXPENSE,
        src_id: ACC_RUB,
        src_amount: 7608,
        dest_amount: 100,
        dest_curr: EUR,
        comment: 'multiple expense',
        category_id: FOOD_CATEGORY,
        start_date: App.datesSec.now,
        end_date: null,
        interval_type: INTERVAL_MONTH,
        interval_step: 1,
        interval_offset: 20,
    }, {
        type: INCOME,
        dest_id: ACC_USD,
        src_amount: 6500,
        dest_amount: 100,
        src_curr: RUB,
        comment: 'multiple income',
        start_date: App.datesSec.now,
        end_date: null,
        interval_type: INTERVAL_MONTH,
        interval_step: 1,
        interval_offset: 20,
    }, {
        type: TRANSFER,
        src_id: ACC_RUB,
        dest_id: CASH_RUB,
        src_amount: 500,
        dest_amount: 500,
        comment: 'multiple transfer',
        start_date: App.datesSec.now,
        end_date: null,
        interval_type: INTERVAL_MONTH,
        interval_step: 1,
        interval_offset: 20,
    }, {
        type: DEBT,
        src_id: personXAccount.id,
        dest_id: 0,
        src_amount: 500,
        dest_amount: 500,
        src_curr: RUB,
        comment: 'multiple debt',
        start_date: App.datesSec.now,
        end_date: null,
        interval_type: INTERVAL_MONTH,
        interval_step: 1,
        interval_offset: 20,
    }];

    const ids = await Actions.extractAndCreateMultiple(data);
    assert.isArray(ids, 'Invalid result for create multiple scheduled transactions');
    ids.forEach((id) => assert(id, 'Failed to create multiple scheduled transactions'));
};

const createMultipleInvalid = async () => {
    setBlock('Create multiple scheduled transactions with invalid data', 2);

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

    await App.scenario.runner.runGroup(async (params) => {
        const res = await Actions.extractAndCreateMultiple(params);
        assert(!res, `Created multiple scheduled transactions with invalid data: { ${formatProps(params)} }`);
    }, data);
};

const update = async () => {
    setBlock('Update scheduled transactions', 3);

    const {
        RUB,
        USD,
        CASH_RUB,
        ACC_USD,
        PERSON_X,
        PERSON_Y,
        TRANSPORT_CATEGORY,
    } = App.scenario;

    const personXAccount = App.state.getPersonAccount(PERSON_X, RUB);
    const personYAccount = App.state.getPersonAccount(PERSON_Y, USD);

    const data = [{
        id: App.scenario.SCHEDULED_TR_EXPENSE_1,
        src_id: App.scenario.CASH_RUB,
    }, {
        id: App.scenario.SCHEDULED_TR_EXPENSE_2,
        dest_amount: 7608,
        dest_curr: RUB,
        category_id: TRANSPORT_CATEGORY,
    }, {
        id: App.scenario.SCHEDULED_TR_INCOME_1,
        dest_id: CASH_RUB,
    }, {
        id: App.scenario.SCHEDULED_TR_INCOME_2,
        src_amount: 100,
        src_curr: USD,
    }, {
        id: App.scenario.SCHEDULED_TR_TRANSFER_1,
        dest_id: ACC_USD,
        dest_curr: USD,
        dest_amount: 8,
    }, {
        id: App.scenario.SCHEDULED_TR_TRANSFER_2,
        dest_id: CASH_RUB,
        dest_curr: RUB,
        dest_amount: 6500,
        start_date: App.datesSec.yesterday,
    }, {
        id: App.scenario.SCHEDULED_TR_DEBT_1,
        src_id: 0,
        dest_id: personXAccount.id,
    }, {
        id: App.scenario.SCHEDULED_TR_DEBT_2,
        src_id: 0,
        dest_id: personYAccount.id,
        src_curr: personYAccount.curr_id,
        dest_curr: personYAccount.curr_id,
    }, {
        id: App.scenario.SCHEDULED_TR_LIMIT_1,
        src_amount: 150,
        dest_amount: 150,
    }];

    await App.scenario.runner.runGroup(async (params) => {
        const res = await Actions.update(params);
        assert(res, `Failed to update scheduled transaction: { ${formatProps(params)} }`);
    }, data);
};

const updateWithChainedRequest = async () => {
    setBlock('Update scheduled transactions with chained request', 3);

    const {
        CASH_RUB,
        SCHEDULED_TR_EXPENSE_CHAINED_1,
    } = App.scenario;

    const data = [{
        id: SCHEDULED_TR_EXPENSE_CHAINED_1,
        src_id: CASH_RUB,
        returnState: {
            transactions: { onPage: 20 },
        },
    }];

    await App.scenario.runner.runGroup(async (params) => {
        const res = await Actions.update(params);
        assert(res, 'Failed to update scheduled transaction with chained request');
    }, data);
};

const updateInvalid = async () => {
    setBlock('Update scheduled transactions with invalid data', 2);

    const {
        RUB,
        USD,
        EUR,
        PLN,
        ACC_RUB,
        CASH_RUB,
        ACC_USD,
        PERSON_X,
        PERSON_Y,
    } = App.scenario;

    const personXAccount = App.state.getPersonAccount(PERSON_X, RUB);
    const personYAccount = App.state.getPersonAccount(PERSON_Y, USD);

    const data = [{
        id: -1,
    }, {
        id: App.scenario.SCHEDULED_TR_EXPENSE_1,
        src_id: 0,
    }, {
        id: App.scenario.SCHEDULED_TR_EXPENSE_1,
        src_id: personYAccount.id,
    }, {
        id: App.scenario.SCHEDULED_TR_EXPENSE_2,
        dest_amount: 0,
        dest_curr: PLN,
    }, {
        id: App.scenario.SCHEDULED_TR_EXPENSE_3,
        start_date: '',
    }, {
        id: App.scenario.SCHEDULED_TR_INCOME_1,
        dest_id: 0,
    }, {
        id: App.scenario.SCHEDULED_TR_INCOME_1,
        dest_id: personYAccount.id,
    }, {
        id: App.scenario.SCHEDULED_TR_INCOME_2,
        src_amount: 0,
        src_curr: EUR,
    }, {
        id: App.scenario.SCHEDULED_TR_TRANSFER_1,
        src_id: 0,
    }, {
        id: App.scenario.SCHEDULED_TR_TRANSFER_1,
        dest_id: 0,
    }, {
        id: App.scenario.SCHEDULED_TR_TRANSFER_1,
        dest_id: personYAccount.id,
    }, {
        id: App.scenario.SCHEDULED_TR_TRANSFER_1,
        src_curr: 0,
    }, {
        id: App.scenario.SCHEDULED_TR_TRANSFER_1,
        dest_curr: 9999,
    }, {
        id: App.scenario.SCHEDULED_TR_TRANSFER_1,
        dest_id: ACC_USD,
        dest_curr: PLN,
    }, {
        id: App.scenario.SCHEDULED_TR_TRANSFER_1,
        dest_id: ACC_RUB,
    }, {
        id: App.scenario.SCHEDULED_TR_TRANSFER_2,
        dest_id: CASH_RUB,
        dest_curr: RUB,
        dest_amount: 0,
        end_date: 'x',
    }, {
        id: App.scenario.SCHEDULED_TR_DEBT_1,
        src_id: ACC_RUB,
        dest_id: CASH_RUB,
    }, {
        id: App.scenario.SCHEDULED_TR_DEBT_2,
        src_id: personXAccount.id,
        dest_id: personYAccount.id,
        src_curr: personXAccount.curr_id,
        dest_curr: personYAccount.curr_id,
    }];

    await App.scenario.runner.runGroup(async (params) => {
        const res = await Actions.update(params);
        assert(!res, `Updated scheduled transaction with invalid data: { ${formatProps(params)} }`);
    }, data);
};

const read = async () => {
    setBlock('Read scheduled transactions by ids', 2);

    const data = [
        App.scenario.SCHEDULED_TR_EXPENSE_1,
        [App.scenario.SCHEDULED_TR_INCOME_1, App.scenario.SCHEDULED_TR_INCOME_1],
    ];

    await App.scenario.runner.runGroup(async (params) => {
        const res = await Actions.read(params);
        const ids = asArray(params);

        assert(
            Array.isArray(res)
            && res.length === ids.length
            && res.every((item) => !!item),
            `Failed to read scheduled transactions: { ${formatProps(params)} }`,
        );
    }, data);
};

const list = async () => {
    setBlock('Scheduled transactions list', 2);

    const data = [
        {},
    ];

    await App.scenario.runner.runGroup(Actions.list, data);
};

const del = async () => {
    setBlock('Delete scheduled transactions', 2);

    const {
        SCHEDULED_TR_EXPENSE_2,
        SCHEDULED_TR_TRANSFER_1,
        SCHEDULED_TR_DEBT_1,
    } = App.scenario;

    const data = [
        { id: SCHEDULED_TR_EXPENSE_2 },
        { id: [SCHEDULED_TR_TRANSFER_1, SCHEDULED_TR_DEBT_1] },
    ];

    await App.scenario.runner.runGroup(async (params) => {
        const res = await Actions.del(params);
        assert(res, `Failed to delete scheduled transactions: { ${formatProps(params)} }`);
    }, data);
};

const delWithChainedRequest = async () => {
    setBlock('Delete scheduled transactions with chained request', 2);

    const { SCHEDULED_TR_LIMIT_1 } = App.scenario;

    const data = [
        {
            id: [SCHEDULED_TR_LIMIT_1],
            returnState: {
                transactions: {},
                accounts: { visibility: 'all' },
                persons: { visibility: 'all' },
            },
        },
    ];

    await App.scenario.runner.runGroup(async (params) => {
        const res = await Actions.del(params);
        assert(res, `Failed to delete scheduled transactions with chained request: { ${formatProps(params)} }`);
    }, data);
};

const delInvalid = async () => {
    setBlock('Delete scheduled transactions with invalid data', 2);

    const data = [
        null,
        [null, null],
        [],
        [-1],
    ];

    await App.scenario.runner.runGroup(async (params) => {
        const res = await Actions.del(params);
        assert(!res, `Deleted scheduled transactions with invalid data: { ${formatProps(params)} }`);
    }, data);
};

export const apiScheduleTests = {
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
    },

    async listTests() {
        await read();
        await list();
    },

    async deleteTests() {
        await del();
        await delWithChainedRequest();
        await delInvalid();
    },
};
