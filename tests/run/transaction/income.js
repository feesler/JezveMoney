import { test, assert } from 'jezve-test';
import * as TransactionTests from './index.js';
import { INCOME } from '../../model/Transaction.js';
import { App } from '../../Application.js';

export const submit = async (params) => {
    if ('destAcc' in params) {
        await TransactionTests.runAction({ action: 'changeDestAccountByPos', data: params.destAcc });
    }

    if ('srcCurr' in params) {
        await TransactionTests.runAction({ action: 'changeSourceCurrency', data: params.srcCurr });
    }

    assert('srcAmount' in params, 'Source amount value not specified');

    await TransactionTests.runAction({ action: 'inputSrcAmount', data: params.srcAmount });

    if ('srcCurr' in params && 'destAmount' in params) {
        await TransactionTests.runAction({ action: 'inputDestAmount', data: params.destAmount });
    }

    if ('date' in params) {
        await TransactionTests.runAction({ action: 'changeDate', data: params.date });
    }

    if ('comment' in params) {
        await TransactionTests.runAction({ action: 'inputComment', data: params.comment });
    }

    return TransactionTests.submit();
};

export const create = async (params) => {
    await TransactionTests.create(INCOME, params, submit);
};

/** Update income transaction and check results */
export const update = async (params) => {
    await TransactionTests.update(INCOME, params, async (submitParams) => {
        const origTransaction = App.view.getExpectedTransaction();
        const isDiff = (origTransaction.src_curr !== origTransaction.dest_curr);

        await test('Initial state of update income view', () => {
            App.view.model.state = (isDiff) ? 2 : 0;
            const expected = App.view.getExpectedState();
            return App.view.checkState(expected);
        });

        return submit(submitParams);
    });
};
