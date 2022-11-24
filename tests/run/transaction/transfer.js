import { test, assert } from 'jezve-test';
import * as TransactionTests from './index.js';
import { TRANSFER } from '../../model/Transaction.js';
import { App } from '../../Application.js';

export const submit = async (params) => {
    if ('srcAcc' in params) {
        await TransactionTests.runAction({ action: 'changeSrcAccountByPos', data: params.srcAcc });
    }
    if ('destAcc' in params) {
        await TransactionTests.runAction({ action: 'changeDestAccountByPos', data: params.destAcc });
    }

    assert('srcAmount' in params, 'Source amount value not specified');

    await TransactionTests.runAction({ action: 'inputSrcAmount', data: params.srcAmount });

    if ('destAmount' in params) {
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
    await TransactionTests.create(TRANSFER, params, submit);
};

/** Update transfer transaction and check results */
export const update = async (params) => {
    await TransactionTests.update(TRANSFER, params, async (submitParams) => {
        const origTransaction = App.view.getExpectedTransaction();
        const isDiff = (origTransaction.src_curr !== origTransaction.dest_curr);

        await test('Initial state of update transfer view', () => {
            App.view.model.state = (isDiff) ? 3 : 0;
            const expected = App.view.getExpectedState();
            return App.view.checkState(expected);
        });

        return submit(submitParams);
    });
};
