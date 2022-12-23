import { test, assert } from 'jezve-test';
import * as TransactionTests from './index.js';
import { DEBT } from '../../model/Transaction.js';
import { App } from '../../Application.js';

export const submit = async (params) => {
    if ('acc' in params) {
        await TransactionTests.runAction({ action: 'changeAccountByPos', data: params.acc });
    }

    if ('person' in params) {
        await TransactionTests.runAction({ action: 'changePersonByPos', data: params.person });
    }

    if ('debtType' in params) {
        await TransactionTests.runAction({ action: 'swapSourceAndDest', data: params.debtType });
    }

    if ('srcCurr' in params) {
        await TransactionTests.runAction({ action: 'changeSourceCurrency', data: params.srcCurr });
    }

    if ('destCurr' in params) {
        await TransactionTests.runAction({ action: 'changeDestCurrency', data: params.destCurr });
    }

    assert(('srcAmount' in params) || ('destAmount' in params), 'No amount value not specified');

    if ('srcAmount' in params) {
        await TransactionTests.runAction({ action: 'inputSrcAmount', data: params.srcAmount });
    }

    if ('destAmount' in params) {
        await TransactionTests.runAction({ action: 'inputDestAmount', data: params.destAmount });
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
    await TransactionTests.create(DEBT, params, submit);
};

export const update = async (params) => {
    await TransactionTests.update(DEBT, params, async (submitParams) => {
        await test('Initial state of update debt view', () => {
            const { debtType, noAccount, isDiffCurr } = App.view.model;

            if (isDiffCurr) {
                App.view.model.state = (debtType) ? 10 : 16;
            } else if (debtType) {
                App.view.model.state = (noAccount) ? 6 : 0;
            } else {
                App.view.model.state = (noAccount) ? 7 : 3;
            }

            const expected = App.view.getExpectedState();
            return App.view.checkState(expected);
        });

        return submit(submitParams);
    });
};
