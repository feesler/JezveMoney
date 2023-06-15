import { App } from '../../Application.js';
import { dateToSeconds } from '../../common.js';
import { api } from '../../model/api.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    LIMIT_CHANGE,
    Transaction,
} from '../../model/Transaction.js';

export const createTransactions = async () => {
    const {
        ACC_3,
        ACC_RUB,
        ACC_USD,
        ACC_EUR,
        CREDIT_CARD,
        BTC_CREDIT,
        MARIA,
        IVAN,
        FOOD_CATEGORY,
        INVEST_CATEGORY,
        TAXES_CATEGORY,
        TRANSPORT_CATEGORY,
        CAFE_CATEGORY,
        RUB,
        USD,
        EUR,
        PLN,
    } = App.scenario;

    const data = [{
        type: EXPENSE,
        src_id: ACC_3,
        src_amount: '500',
        comment: 'lalala',
        category_id: FOOD_CATEGORY,
    }, {
        type: EXPENSE,
        src_id: ACC_3,
        src_amount: '500',
        dest_curr: USD,
        comment: 'lalala',
    }, {
        type: EXPENSE,
        src_id: ACC_RUB,
        src_amount: '100',
        comment: 'hohoho',
        category_id: TRANSPORT_CATEGORY,
    }, {
        type: EXPENSE,
        src_id: ACC_RUB,
        src_amount: '780',
        dest_amount: '10',
        dest_curr: EUR,
        comment: 'кккк',
        category_id: CAFE_CATEGORY,
    }, {
        type: EXPENSE,
        src_id: ACC_USD,
        src_amount: '50',
        comment: '1111',
    }, {
        type: INCOME,
        dest_id: ACC_EUR,
        src_amount: '7500',
        dest_amount: '100',
        src_curr: RUB,
        comment: '232323',
    }, {
        type: INCOME,
        dest_id: ACC_3,
        src_amount: '1000000',
        dest_amount: '64000',
        src_curr: PLN,
        comment: '111 кккк',
    }, {
        type: INCOME,
        dest_id: ACC_3,
        dest_amount: '100',
        comment: '22222',
    }, {
        type: INCOME,
        dest_id: ACC_RUB,
        src_amount: '7013.21',
        dest_amount: '5000',
        src_curr: USD,
        comment: '33333',
        category_id: INVEST_CATEGORY,
    }, {
        type: INCOME,
        dest_id: ACC_EUR,
        src_amount: '287',
        dest_amount: '4',
        src_curr: RUB,
        comment: 'dddd',
        category_id: TAXES_CATEGORY,
    }, {
        type: INCOME,
        dest_id: ACC_EUR,
        dest_amount: '33',
        comment: '11 ho',
        category_id: INVEST_CATEGORY,
    }, {
        type: TRANSFER,
        src_id: ACC_3,
        dest_id: ACC_RUB,
        src_amount: '300',
        comment: 'd4',
    }, {
        type: TRANSFER,
        src_id: ACC_3,
        dest_id: ACC_USD,
        src_amount: '6500',
        dest_amount: '100',
        comment: 'g6',
    }, {
        type: TRANSFER,
        src_id: ACC_RUB,
        dest_id: ACC_3,
        src_amount: '800.01',
        comment: 'x0',
    }, {
        type: TRANSFER,
        src_id: ACC_RUB,
        dest_id: ACC_USD,
        src_amount: '7',
        dest_amount: '0.08',
        comment: 'l2',
    }, {
        type: TRANSFER,
        src_id: ACC_EUR,
        dest_id: ACC_USD,
        src_amount: '5.0301',
        dest_amount: '4.7614',
        comment: 'i1',
    }, {
        type: DEBT,
        op: 1,
        person_id: MARIA,
        src_amount: '1050',
        src_curr: RUB,
        comment: '111 кккк',
    }, {
        type: DEBT,
        op: 1,
        person_id: IVAN,
        acc_id: ACC_RUB,
        src_amount: '780',
        comment: '--**',
    }, {
        type: DEBT,
        op: 2,
        person_id: MARIA,
        dest_amount: '990.99',
        dest_curr: RUB,
        comment: 'ппп ppp',
    }, {
        type: DEBT,
        op: 2,
        person_id: IVAN,
        acc_id: ACC_USD,
        dest_amount: '105',
        comment: '6050 кккк',
    }, {
        type: DEBT,
        op: 1,
        person_id: MARIA,
        acc_id: ACC_EUR,
        src_amount: '4',
        comment: '111 кккк',
    }, {
        type: LIMIT_CHANGE,
        dest_id: CREDIT_CARD,
        src_amount: '10000',
        dest_amount: '10000',
        comment: 'Credit limit update',
    }, {
        type: LIMIT_CHANGE,
        src_id: BTC_CREDIT,
        dest_id: 0,
        src_amount: '0.01',
        dest_amount: '0.01',
        comment: 'Credit limit update',
    }];

    const multi = [];
    let lastExpense = null;
    for (const transaction of data) {
        const extracted = Transaction.extract(transaction, App.state);
        for (const date of App.dateSecList) {
            multi.push({
                ...extracted,
                date,
            });
        }
        if (transaction.type === EXPENSE) {
            lastExpense = multi[multi.length - 1];
        }
    }

    // Add transaction year after latest for statistics tests
    multi.push({
        ...lastExpense,
        date: dateToSeconds(App.dates.yearAfter),
    });

    // Statistics group by week tests
    const w1date1 = new Date(2012, 11, 30);
    const w1date2 = new Date(2012, 11, 31);

    // Week changed before year: 2012-12-30 (52) -> 2012-12-31 (1)
    const extracted1 = Transaction.extract({
        type: EXPENSE,
        src_id: ACC_3,
        src_amount: '444',
        comment: 'week 52',
        date: dateToSeconds(w1date1),
    }, App.state);

    const extracted2 = Transaction.extract({
        type: EXPENSE,
        src_id: ACC_3,
        src_amount: '555',
        comment: 'week 1',
        date: dateToSeconds(w1date2),
    }, App.state);

    multi.push(extracted1, extracted2);

    // Week not changed: 2022-12-30 (52) -> 2023-1-1 (52)
    const w2date1 = new Date(2022, 11, 30);
    const w2date2 = new Date(2023, 0, 1);

    const extracted21 = Transaction.extract({
        type: EXPENSE,
        src_id: ACC_3,
        src_amount: '777',
        comment: 'week 52',
        date: dateToSeconds(w2date1),
    }, App.state);

    const extracted22 = Transaction.extract({
        type: EXPENSE,
        src_id: ACC_3,
        src_amount: '888',
        comment: 'week 52 in next year',
        date: dateToSeconds(w2date2),
    }, App.state);

    multi.push(extracted21, extracted22);

    await api.transaction.create({ data: multi });

    await App.state.fetch();
};
