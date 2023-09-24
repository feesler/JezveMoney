import { App } from '../../Application.js';
import { api } from '../../model/api.js';
import { ScheduledTransaction } from '../../model/ScheduledTransaction.js';
import {
    INTERVAL_DAY,
    INTERVAL_WEEK,
    INTERVAL_MONTH,
    INTERVAL_YEAR,
    INTERVAL_NONE,
    dateToSeconds,
} from '../../common.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    LIMIT_CHANGE,
} from '../../model/Transaction.js';

export const createScheduledTransactions = async () => {
    const {
        RUB,
        USD,
        EUR,
        BTC,
        ACC_RUB,
        CARD_RUB,
        ACC_USD,
        BTC_CREDIT,
        CREDIT_CARD,
        MARIA,
        FOOD_CATEGORY,
        INVEST_CATEGORY,
    } = App.scenario;

    const weekDate1 = new Date(2022, 11, 30);
    const weekDate2 = new Date(2023, 0, 1);

    const personAccount = App.state.getPersonAccount(MARIA, RUB);

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
        type: EXPENSE,
        src_id: ACC_RUB,
        src_amount: 100000,
        comment: 'One time expense',
        category_id: INVEST_CATEGORY,
        start_date: App.datesSec.weekAfter,
        end_date: null,
        interval_type: INTERVAL_NONE,
        interval_step: 0,
        interval_offset: 0,
    }, {
        type: INCOME,
        dest_id: ACC_RUB,
        dest_amount: 100000,
        comment: 'Salary',
        start_date: App.datesSec.monthAgo,
        end_date: null,
        interval_type: INTERVAL_MONTH,
        interval_step: 1,
        interval_offset: App.dates.now.getDate() - 1,
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
        dest_id: CARD_RUB,
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
        src_id: personAccount.id,
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
        dest_id: personAccount.id,
        dest_amount: 1000,
        dest_curr: RUB,
        comment: 'Annual debt',
        start_date: App.datesSec.now,
        end_date: null,
        interval_type: INTERVAL_YEAR,
        interval_step: 1,
        interval_offset: 20,
    }, {
        type: LIMIT_CHANGE,
        src_id: 0,
        dest_id: CREDIT_CARD,
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
        comment: 'Limit update',
        start_date: App.datesSec.now,
        end_date: null,
        interval_type: INTERVAL_MONTH,
        interval_step: 1,
        interval_offset: 20,
    }, {
        type: EXPENSE,
        src_id: ACC_RUB,
        src_amount: 1000,
        comment: 'Once in two years',
        start_date: dateToSeconds(new Date(2020, 2, 3)),
        end_date: null,
        interval_type: INTERVAL_YEAR,
        interval_step: 2,
        interval_offset: 23,
    }];

    const multi = data.map((item) => (
        ScheduledTransaction.extract(item, App.state)
    ));

    await api.schedule.create({ data: multi });
    await App.state.fetch();
};
