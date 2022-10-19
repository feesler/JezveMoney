import { App } from '../../Application.js';
import { api } from '../../model/api.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    Transaction,
} from '../../model/Transaction.js';

export const createTransactions = async () => {
    const {
        ACC_3,
        ACC_RUB,
        ACC_USD,
        ACC_EUR,
    } = App.scenario;
    const { MARIA, IVAN } = App.scenario;
    const {
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
    }, {
        type: EXPENSE,
        src_id: ACC_RUB,
        src_amount: '780',
        dest_amount: '10',
        dest_curr: EUR,
        comment: 'кккк',
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
    }, {
        type: INCOME,
        dest_id: ACC_EUR,
        src_amount: '287',
        dest_amount: '4',
        src_curr: RUB,
        comment: 'dddd',
    }, {
        type: INCOME,
        dest_id: ACC_EUR,
        dest_amount: '33',
        comment: '11 ho',
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
        src_amount: '990.99',
        src_curr: RUB,
        comment: 'ппп ppp',
    }, {
        type: DEBT,
        op: 2,
        person_id: IVAN,
        acc_id: ACC_USD,
        src_amount: '105',
        comment: '6050 кккк',
    }, {
        type: DEBT,
        op: 1,
        person_id: MARIA,
        acc_id: ACC_EUR,
        src_amount: '4',
        comment: '111 кккк',
    }];

    const multi = [];
    for (const transaction of data) {
        const extracted = Transaction.extract(transaction, App.state);
        for (const date of App.dateList) {
            multi.push({
                ...extracted,
                date,
            });
        }
    }

    await api.transaction.createMultiple(multi);

    await App.state.fetch();
};
