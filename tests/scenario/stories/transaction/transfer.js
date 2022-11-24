import { test, setBlock } from 'jezve-test';
import { App } from '../../../Application.js';
import { TRANSFER } from '../../../model/Transaction.js';
import * as TransactionTests from '../../../run/transaction/index.js';

export const stateLoop = async () => {
    await App.state.fetch();

    const [ACC_3, ACC_RUB, ACC_USD, ACC_EUR, CARD_RUB] = App.state.getAccountIndexesByNames([
        'ACC_3', 'ACC_RUB', 'ACC_USD', 'ACC_EUR', 'CARD_RUB',
    ]);

    // Navigate to create income view
    await App.goToMainView();
    await App.view.goToNewTransactionByAccount(0);
    await App.view.changeTransactionType(TRANSFER);

    setBlock('Transfer loop', 2);
    await test('Initial state of new transfer view', () => {
        App.view.model.state = 0;
        const expected = App.view.getExpectedState();
        return App.view.checkState(expected);
    });

    // Input source amount
    const saInputData = [
        '1',
        '1.',
        '1.0',
        '1.01',
        '1.010',
        '1.0101',
        '',
        '.',
        '.0',
        '.09',
        '',
    ];
    await TransactionTests.runGroup('inputSrcAmount', saInputData);

    await TransactionTests.runActions([
        // Transition 7: Change destination account to another one with same currency
        //  as source (EUR)
        { action: 'changeDestAccountByPos', data: ACC_3 },
        // Transition 5: Change source account to another one with same currency as
        //  destination (USD)
        { action: 'changeSrcAccountByPos', data: ACC_3 },
        // Transition 1: Click by source balance and move from State 0 to State 1
        { action: 'clickSrcResultBalance' },
    ]);

    // Input source result balance
    const srbInputData = [
        '400',
        '400.',
        '400.9',
        '400.99',
        '400.990',
        '400.9901',
        '',
        '.',
        '.0',
        '.01',
    ];
    await TransactionTests.runGroup('inputResBalance', srbInputData);

    await TransactionTests.runActions([
        // Transition 11: Change source account to another one with same currency as destination
        //  and stay on State 1
        { action: 'changeSrcAccountByPos', data: CARD_RUB },
        // Transition 13: Change destination account to another one with same currency as source
        //  and stay on State 1
        { action: 'changeDestAccountByPos', data: CARD_RUB },
        // Transition 9: Click by destination balance and move from State 1 to State 2
        { action: 'clickDestResultBalance' },
    ]);

    // Input destination result balance
    const drbInputData = [
        '600',
        '600.',
        '600.9',
        '600.90',
        '600.901',
        '600.9010',
        '600.90101',
        '',
        '.',
        '.0',
    ];
    await TransactionTests.runGroup('inputDestResBalance', drbInputData);

    await TransactionTests.runActions([
        // Transition 15: Change source account to another one with same currency and stay
        //  on State 2
        { action: 'changeSrcAccountByPos', data: CARD_RUB },
        // Transition 17: Change destination account to another one with same currency and
        //  stay on State 2
        { action: 'changeDestAccountByPos', data: CARD_RUB },
        // Transition 16: Change source account to another one with different currency (USD) and
        //  move from State 2 to State 5
        { action: 'changeSrcAccountByPos', data: ACC_USD },
        // Transition 26: Change source account to another one with different currency (EUR) and
        //  stay on State 5
        { action: 'changeSrcAccountByPos', data: ACC_EUR },
        // Swap source and destination accounts
        { action: 'swapSourceAndDest' },
        { action: 'swapSourceAndDest' },
        // Transition 28: Change destination account to another one with different currency and
        //  stay on State 5
        { action: 'changeDestAccountByPos', data: ACC_3 },
        // Transition 27: Change source account to another one with same currency as destination
        //  (RUB) and move from State 5 to State 2
        { action: 'changeSrcAccountByPos', data: ACC_RUB },
        // Transition 18: Change destination account to another one with different currency than
        //  source (USD) and move from State 2 to State 5
        { action: 'changeDestAccountByPos', data: ACC_USD },
        // Transition 29: Change destination account to another one with same currency as source
        //  and move from State 5 to State 2
        { action: 'changeDestAccountByPos', data: ACC_3 },
        // Transition 10: Click by source balance and move from State 1 to State 2
        { action: 'clickSrcResultBalance' },
        // Transition 2: Click by source amount and move from State 1 to State 0
        { action: 'clickSrcAmount' },
        // Transition 6: Change source account to another one with different currency than
        //  destination (USD) and move from State 0 to State 3
        { action: 'changeSrcAccountByPos', data: ACC_USD },
        // Input different source and destination amount
        { action: 'inputSrcAmount', data: '111' },
        { action: 'inputDestAmount', data: '222' },
        // Transition 43: Change source account to another one with different currency than
        //  destination (RUB) and stay on State 3
        { action: 'changeSrcAccountByPos', data: ACC_EUR },
        // Transition 41: Change destination account to another one with same currency as source
        //  (EUR) and stay on State 3
        { action: 'changeDestAccountByPos', data: ACC_EUR },
        // Transition 44: Change source account to another one with same currency as destination
        //  (EUR -> RUB) and move from State 3 to State 0
        { action: 'changeSrcAccountByPos', data: ACC_EUR },
        { action: 'changeSrcAccountByPos', data: ACC_3 },
        // Transition 8: Change destination account to another one with different currency than
        //  source (USD) and move from State 0 to State 3
        { action: 'changeDestAccountByPos', data: ACC_USD },
        // Transition 42: Change destination account to another one with same currency as source
        //  (RUB) and move from State 3 to State 0
        { action: 'changeDestAccountByPos', data: ACC_RUB },
        // Transition 12: Change source account to another one with different currency than
        //  destination (EUR) and move from State 1 to State 4
        { action: 'clickSrcResultBalance' }, // move from State 0 to State 1
        { action: 'changeSrcAccountByPos', data: ACC_EUR },
        // Transition 36: Change source account to another one with different currency than
        //  destination (USD) and stay on State 4
        { action: 'changeSrcAccountByPos', data: ACC_RUB },
        // Transition 38: Change destination account to another one with different currency
        //  than source (RUB) and stay on State 4
        { action: 'changeDestAccountByPos', data: ACC_EUR },
        // Transition 39: Change destination account to another one with same currency as source
        //  (RUB) and move from State 4 to State 1
        { action: 'changeDestAccountByPos', data: ACC_3 },
        // Transition 14: Change destination account to another one with different currency than
        //  source (USD) and move from State 1 to State 4
        { action: 'changeDestAccountByPos', data: ACC_USD },
        // Transition 32: Click by destination result balance and move from State 4 to State 6
        { action: 'clickDestResultBalance' },
        // Transition 49: Change source account to another one with different currency than
        //  destination (EUR) and stay on State 6
        { action: 'changeSrcAccountByPos', data: ACC_EUR },
        // Transition 47: Change destination account to another one with different currency
        //  than source (RUB) and stay on State 6
        { action: 'changeDestAccountByPos', data: ACC_3 },
        // Transition 20: Click by source amount and move from State 6 to State 5
        { action: 'clickSrcAmount' },
        // Transition 19: Click by source result balance and move from State 5 to State 6
        { action: 'clickSrcResultBalance' },
        // Transition 45: Click by exchange rate and move from State 6 to State 8
        { action: 'clickExchRate' },
    ]);

    // Input exchange rate
    const exInputData = [
        '1.09',
        '3.09',
        '.',
        '.0',
        '.09',
        '.090101',
    ];
    await TransactionTests.runGroup('inputExchRate', exInputData);

    // Toggle direction of exchange rate and stay on State 8
    await TransactionTests.runAction({ action: 'toggleExchange' });
    // Input backexchange rate
    const backExchInputData = [
        '66.5',
        '166.56',
    ];
    await TransactionTests.runGroup('inputExchRate', backExchInputData);
    // Toggle direction of exchange rate and stay on State 8
    await TransactionTests.runAction({ action: 'toggleExchange' });

    await TransactionTests.runActions([
        // Transition 51: Change source account to another one with different currency than
        //  destination (USD) and stay on State 6
        { action: 'changeSrcAccountByPos', data: ACC_USD },
        // Transition 53: Change destination account to another one with different currency
        //  than source (EUR) and stay on State 6
        { action: 'changeDestAccountByPos', data: ACC_EUR },
        // Transition 23: Click by source amount and move from State 8 to State 7
        { action: 'clickSrcAmount' },
        // Transition 57: Change source account to another one with different currency than
        //  destination (RUB) and stay on State 7
        { action: 'changeSrcAccountByPos', data: ACC_3 },
        // Transition 59: Change destination account to another one with different currency
        //  than source (USD) and stay on State 7
        { action: 'changeDestAccountByPos', data: ACC_USD },
        // Transition 22: Click by source result balance and move from State 7 to State 8
        { action: 'clickSrcResultBalance' },
        // Transition 46: Click by destination result balance and move from State 8 to State 6
        { action: 'clickDestResultBalance' },
        // Transition 33: Click by destination amount and move from State 6 to State 4
        { action: 'clickDestAmount' },
        // Transition 37: Change source account to another one with same currency as destination
        //  (RUB) and from State 4 to State 1
        { action: 'changeSrcAccountByPos', data: ACC_EUR }, // change source to EUR first
        { action: 'changeDestAccountByPos', data: CARD_RUB }, // change destination to RUB
        { action: 'changeSrcAccountByPos', data: ACC_3 },
        // Transition 21: Click by exchange rate and move from State 5 to State 7
        { action: 'clickSrcAmount' }, // move from State 1 to State 0
        { action: 'clickDestResultBalance' }, // move from State 0 to State 2
        { action: 'changeDestAccountByPos', data: ACC_USD }, // move from State 2 to State 5
        { action: 'clickExchRate' }, // move from State 5 to State 7
        // Transition 55: Click by destination amount and move from State 7 to State 3
        { action: 'clickDestAmount' },
        // Transition 25: Click by destination result balance and move from State 3 to State 5
        { action: 'clickDestResultBalance' },
        // Transition 56: Click by destination result balance and move from State 7 to State 5
        { action: 'clickExchRate' }, // move from State 5 to State 7
        { action: 'clickDestResultBalance' },
        // Transition 24: Click by destination amount and move from State 5 to State 3
        { action: 'clickDestAmount' },
        // Transition 40: Click by exchange rate and move from State 3 to State 7
        { action: 'clickExchRate' },
        // Transition 60: Change destination account to another one with same currency as source
        //  (RUB) and move from State 7 to State 0
        { action: 'changeDestAccountByPos', data: ACC_RUB },
        // Transition 58: Change source account to another one with same currency as destination
        //  (RUB) and from State 7 to State 0
        { action: 'clickDestResultBalance' }, // move from State 0 to State 2
        { action: 'changeSrcAccountByPos', data: ACC_USD }, // move from State 2 to State 5
        { action: 'clickExchRate' }, // move from State 5 to State 7
        { action: 'changeSrcAccountByPos', data: ACC_3 },
        // Transition 30: Click by source amount and move from State 4 to State 3
        { action: 'clickSrcResultBalance' }, // move from State 0 to State 1
        { action: 'changeSrcAccountByPos', data: ACC_EUR }, // move from State 1 to State 4
        { action: 'clickSrcAmount' },
        // Transition 31: Click by source result balance and move from State 3 to State 4
        { action: 'clickSrcResultBalance' },
        // Transition 34: Click by exchange rate and move from State 4 to State 8
        { action: 'clickExchRate' },
        // Transition 35: Click by destination amount and move from State 8 to State 4
        { action: 'clickDestAmount' },
        // Transition 52: Change source account to another one with same currency as destination
        //  (RUB) and from State 8 to State 1
        { action: 'clickExchRate' }, // move from State 4 to State 8
        { action: 'changeSrcAccountByPos', data: ACC_3 },
        // Transition 54: Change destination account to another one with same currency as source
        //  (RUB) and move from State 8 to State 1
        { action: 'changeDestAccountByPos', data: ACC_USD }, // move from State 1 to State 4
        { action: 'clickExchRate' }, // move from State 4 to State 8
        { action: 'changeDestAccountByPos', data: ACC_RUB },
        // Transition 50: Change source account to another one with same currency as destination
        //  (RUB) and from State 6 to State 1
        { action: 'changeSrcAccountByPos', data: ACC_USD }, // move from State 1 to State 4
        { action: 'clickDestResultBalance' }, // move from State 4 to State 6
        { action: 'changeSrcAccountByPos', data: ACC_3 },
        // Transition 48: Change destination account to another one with same currency as source
        //  (RUB) and move from State 1 to State 2
        { action: 'changeDestAccountByPos', data: ACC_USD }, // move from State 1 to State 4
        { action: 'clickDestResultBalance' }, // move from State 4 to State 6
        { action: 'changeDestAccountByPos', data: ACC_RUB },
    ]);
};
