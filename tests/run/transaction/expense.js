import { test, assert } from 'jezve-test';
import * as TransactionTests from './index.js';
import { EXPENSE } from '../../model/Transaction.js';
import { App } from '../../Application.js';

export const submit = async (params) => {
    if ('srcAcc' in params) {
        await TransactionTests.runAction({ action: 'changeSrcAccountByPos', data: params.srcAcc });
    }

    if ('destCurr' in params) {
        await TransactionTests.runAction({ action: 'changeDestCurrency', data: params.destCurr });
    }

    assert('destAmount' in params, 'Destination amount value not specified');

    await TransactionTests.runAction({ action: 'inputDestAmount', data: params.destAmount });

    if ('destCurr' in params && 'srcAmount' in params) {
        await TransactionTests.runAction({ action: 'inputSrcAmount', data: params.srcAmount });
    }

    if ('date' in params) {
        await TransactionTests.runAction({ action: 'changeDate', data: params.date });
    }

    if ('category' in params) {
        await TransactionTests.runAction({ action: 'changeCategory', data: params.category });
    }

    if ('comment' in params) {
        await TransactionTests.runAction({ action: 'inputComment', data: params.comment });
    }

    return TransactionTests.submit();
};

export const create = async (params) => {
    await TransactionTests.create(EXPENSE, params, submit);
};

/** Update expense transaction and check results */
export const update = async (params) => {
    await TransactionTests.update(EXPENSE, params, async (submitParams) => {
        const origTransaction = App.view.getExpectedTransaction();
        const isDiff = (origTransaction.src_curr !== origTransaction.dest_curr);

        await test('Initial state of update expense view', () => {
            App.view.model.state = (isDiff) ? 2 : 0;
            const expected = App.view.getExpectedState();
            return App.view.checkState(expected);
        });

        return submit(submitParams);
    });
};
