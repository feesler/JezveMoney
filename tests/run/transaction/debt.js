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

    assert('srcAmount' in params, 'Source amount value not specified');

    await TransactionTests.runAction({ action: 'inputSrcAmount', data: params.srcAmount });

    if ('date' in params) {
        await TransactionTests.runAction({ action: 'changeDate', data: params.date });
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
        let expState;
        if (App.view.model.noAccount) {
            expState = (App.view.model.debtType) ? 6 : 7;
        } else {
            expState = (App.view.model.debtType) ? 0 : 3;
        }

        await test('Initial state of update debt view', () => {
            App.view.setExpectedState(expState);
            return App.view.checkState();
        });

        return submit(submitParams);
    });
};
