import { test, setBlock, assert } from 'jezve-test';
import { App } from '../../../Application.js';
import { TransactionView } from '../../../view/TransactionView.js';
import * as TransactionTests from '../../../run/transaction.js';

export const stateLoop = async () => {
    await App.state.fetch();

    const {
        RUB,
        USD,
        EUR,
        ACC_3,
        ACC_RUB,
        ACC_USD,
        ACC_EUR,
        CARD_RUB,
        MARIA,
        IVAN,
    } = App.scenario;

    // Navigate to create debt view
    await App.goToMainView();
    await App.view.goToNewTransactionByPerson(0);

    setBlock('Debt loop', 2);
    await test('Initial state of new debt view', () => {
        assert.instanceOf(App.view, TransactionView, 'Invalid view');

        App.view.model.state = (App.view.model.debtType) ? 0 : 3;
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
    ];
    await TransactionTests.runGroup('inputSrcAmount', saInputData);

    await TransactionTests.runActions([
        // Transition 1: Click by source result balance and move from State 0 to State 1
        { action: 'clickSrcResultBalance' },
        // Transition 47: Change to another one and stay on State 1
        { action: 'changeAccount', data: ACC_RUB },
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
        // Transition 2: Click by source amount and move from State 1 to State 0
        { action: 'clickSrcAmount' },
        // Transition 3: Click by destination result balance and move from State 0 to State 2
        { action: 'clickDestResultBalance' },
        // Transition 42: Change to another one and stay on State 2
        { action: 'changeAccount', data: ACC_USD },
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
        // Transition 4: Click by source result balance and move from State 2 to State 1
        { action: 'clickSrcResultBalance' },
        // Transition 5: Click by destination result balance and move from State 1 to State 2
        { action: 'clickDestResultBalance' },
        // Transition 6: Click by source amount and move from State 2 to State 0
        { action: 'clickSrcAmount' },
        // Transition 7: Change debt type to "take" and move from State 0 to State 3
        { action: 'swapSourceAndDest' },
        // Transition 8: Change debt type back to "give" and move from State 3 to State 0
        { action: 'swapSourceAndDest' },
        // Transition 49: Change to another one and stay on State 3
        { action: 'swapSourceAndDest' }, // move from State 0 to State 3
        { action: 'changeAccount', data: ACC_EUR },
        // Transition 9: Click by destination result balance and move from State 3 to State 4
        { action: 'clickDestResultBalance' },
        // Transition 51: Change to another one and stay on State 4
        { action: 'changeAccount', data: CARD_RUB },
        // Transition 10: Click by destination amount and move from State 4 to State 3
        { action: 'clickDestAmount' },
        // Transition 11: Click by source result balance and move from State 4 to State 5
        { action: 'clickDestResultBalance' }, // move from State 3 to State 4
        { action: 'clickSrcResultBalance' },
        // Transition 48: Change to another one and stay on State 5
        { action: 'changeAccount', data: ACC_3 },
        // Transition 12: Click by destination amount and move from State 5 to State 3
        { action: 'clickDestAmount' },
        // Transition 13: Click by source result balance and move from State 3 to State 5
        { action: 'clickSrcResultBalance' },
        // Transition 14: Click by destination result balance and move from State 5 to State 4
        { action: 'clickDestResultBalance' },
        // Transition 15: Change debt type to "give" and move from State 4 to State 1
        { action: 'swapSourceAndDest' },
        // Transition 16: Change debt type to "take" and move from State 1 to State 4
        { action: 'swapSourceAndDest' },
        // Transition 17: Change debt type to "give" and move from State 5 to State 2
        { action: 'clickSrcResultBalance' }, // move from State 4 to State 5
        { action: 'swapSourceAndDest' },
        // Transition 18: Change debt type to "take" and move from State 2 to State 5
        { action: 'swapSourceAndDest' },
        // Transition 19: Change person to another one and stay on State 0
        { action: 'clickDestAmount' }, // move from State 5 to State 3
        { action: 'swapSourceAndDest' }, // move from State 3 to State 0
        { action: 'changePerson', data: IVAN },
        // Transition 20: Change person to another one and stay on State 1
        { action: 'clickSrcResultBalance' }, // move from State 0 to State 1
        { action: 'changePerson', data: MARIA },
        // Transition 21: Change person to another one and stay on State 2
        { action: 'clickDestResultBalance' }, // move from State 1 to State 2
        { action: 'changePerson', data: IVAN },
        // Transition 22: Change person to another one and stay on State 5
        { action: 'swapSourceAndDest' }, // move from State 2 to State 5
        { action: 'changePerson', data: MARIA },
        // Transition 23: Change person to another one and stay on State 4
        { action: 'clickDestResultBalance' }, // move from State 5 to State 4
        { action: 'changePerson', data: IVAN },
        // Transition 24: Change person to another one and stay on State 3
        { action: 'clickDestAmount' }, // move from State 4 to State 3
        { action: 'changePerson', data: MARIA },
        // Transition 25: Disable account and move from State 0 to State 6
        { action: 'swapSourceAndDest' }, // move from State 3 to State 0
        { action: 'toggleAccount' },
        // Transition 43: Change person to another one and stay on State 6
        { action: 'changePerson', data: IVAN },
        // Transition 26: Enable account and move from State 6 to State 0
        { action: 'toggleAccount' },
        // Transition 27: Change debt type to "take" and move from State 6 to State 7
        { action: 'toggleAccount' }, // move from State 0 to State 6
        { action: 'swapSourceAndDest' },
        // Transition 44: Change person to another one and stay on State 7
        { action: 'changePerson', data: MARIA },
        // Transition 28: Change debt type to "give" and move from State 7 to State 6
        { action: 'swapSourceAndDest' },
        // Transition 29: Enable account and move from State 7 to State 3
        { action: 'swapSourceAndDest' }, // move from State 6 to State 7
        { action: 'toggleAccount' },
        // Transition 30: Click by destination result balance and move from State 7 to State 8
        { action: 'swapSourceAndDest' }, // move from State 3 to State 0
        { action: 'toggleAccount' }, // move from State 0 to State 6
        { action: 'swapSourceAndDest' }, // move from State 6 to State 7
        { action: 'clickDestResultBalance' },
        // Transition 45: Change person to another one and stay on State 8
        { action: 'changePerson', data: IVAN },
        // Transition 31: Click by destination amount and move from State 8 to State 7
        { action: 'clickDestAmount' },
        // Transition 32: Enable account and move from State 8 to State 4
        { action: 'clickDestResultBalance' }, // move from State 7 to State 8
        { action: 'toggleAccount' },
        // Transition 39: Disable account and move from State 4 to State 8
        { action: 'toggleAccount' },
        // Transition 33: Change debt type to "give" and move from State 8 to State 9
        { action: 'swapSourceAndDest' },
        // Transition 46: Change person to another one and stay on State 9
        { action: 'changePerson', data: MARIA },
        // Transition 34: Change debt type to "take" and move from State 9 to State 8
        { action: 'swapSourceAndDest' },
        // Transition 35: Click by source amount and move from State 9 to State 6
        { action: 'changePerson', data: IVAN }, // stay on State 8
        { action: 'swapSourceAndDest' }, // move from State 8 to State 9
        { action: 'clickSrcAmount' },
        // Transition 36: Click by source result balance and move from State 6 to State 9
        { action: 'clickSrcResultBalance' },
        // Transition 37: Enable account and move from State 9 to State 1
        { action: 'toggleAccount' },
        // Transition 38: Disable account and move from State 1 to State 9
        { action: 'toggleAccount' },
        // Transition 40: Disable account and move from State 3 to State 7
        { action: 'clickSrcAmount' }, // move from State 9 to State 6
        { action: 'toggleAccount' }, // move from State 6 to State 0
        { action: 'swapSourceAndDest' }, // move from State 0 to State 3
        { action: 'toggleAccount' },
        // Transition 41: Disable account and move from State 2 to State 6
        { action: 'swapSourceAndDest' }, // move from State 7 to State 6
        { action: 'toggleAccount' }, // move from State 6 to State 0
        { action: 'clickDestResultBalance' }, // move from State 0 to State 2
        { action: 'toggleAccount' },
        // Transition 52: Select another account and stay on State 0
        { action: 'toggleAccount' }, // move from State 6 to State 0
        { action: 'changeAccount', data: ACC_USD },
        // Transition 50: Disable account and move from State 5 to State 7
        { action: 'clickDestResultBalance' }, // move from State 0 to State 2
        { action: 'swapSourceAndDest' }, // move from State 2 to State 5
        { action: 'toggleAccount' },
    ]);

    // Transition 53: Change source currency to another one different from currency of
    // source account and move from State 0 to State 10
    setBlock('Transition 74', 2);
    await TransactionTests.runActions([
        { action: 'toggleAccount' }, // move from State 7 to State 3
        { action: 'swapSourceAndDest' }, // move from State 3 to State 0
        { action: 'changeSourceCurrency', data: EUR },
    ]);

    // Transition 54: Change source currency to currency of source account and move
    // from State 10 to State 0
    setBlock('Transition 54', 2);
    await TransactionTests.runActions([
        { action: 'changeSourceCurrency', data: USD },
    ]);

    // Transition 55: Click by source result and move from State 10 to State 11
    setBlock('Transition 55', 2);
    await TransactionTests.runActions([
        { action: 'changeSourceCurrency', data: EUR }, // move from State 0 to State 10
        { action: 'clickSrcResultBalance' },
    ]);

    // Transition 56: Click by source amount and move from State 11 to State 10
    setBlock('Transition 56', 2);
    await TransactionTests.runActions([
        { action: 'clickSrcAmount' },
    ]);

    // Transition 57: Click by exchange and move from State 10 to State 12
    setBlock('Transition 57', 2);
    await TransactionTests.runActions([
        { action: 'clickExchRate' },
    ]);

    // Transition 58: Click by destination amount and move from State 12 to State 10
    setBlock('Transition 58', 2);
    await TransactionTests.runActions([
        { action: 'clickDestAmount' },
    ]);

    // Input destination amount
    const daInputData = [
        '',
        '.',
        '0.',
        '.0',
        '.01',
        '1.01',
        '1.010',
    ];
    await TransactionTests.runGroup('inputDestAmount', daInputData);

    // Transition 59: Click by destination result and move from State 10 to State 15
    setBlock('Transition 59', 2);
    await TransactionTests.runActions([
        { action: 'clickDestResultBalance' },
    ]);

    // Transition 60: Click by destination amount and move from State 15 to State 10
    setBlock('Transition 60', 2);
    await TransactionTests.runActions([
        { action: 'clickDestAmount' },
    ]);

    // Transition 61: Disable account and move from State 10 to State 6
    setBlock('Transition 61', 2);
    await TransactionTests.runActions([
        { action: 'toggleAccount' },
    ]);

    // Transition 137: Select account with same currency as person account
    //  and move from State 10 to State 0
    setBlock('Transition 137', 2);
    await TransactionTests.runActions([
        { action: 'toggleAccount' }, // move from State 6 to State 0
        { action: 'changeSourceCurrency', data: RUB }, // move from State 0 to State 10
        { action: 'changeAccount', data: ACC_RUB },
    ]);

    // Transition 63: Click by destination result and move from State 11 to State 14
    setBlock('Transition 63', 2);
    await TransactionTests.runActions([
        { action: 'changeSourceCurrency', data: EUR }, // move from State 0 to State 10
        { action: 'clickSrcResultBalance' }, // move from State 10 to State 11
        { action: 'clickDestResultBalance' },
    ]);

    // Transition 64: Click by destination amount and move from State 14 to State 11
    setBlock('Transition 64', 2);
    await TransactionTests.runActions([
        { action: 'clickDestAmount' },
    ]);

    // Transition 65: Click by exchange and move from State 11 to State 13
    setBlock('Transition 65', 2);
    await TransactionTests.runActions([
        { action: 'clickExchRate' },
    ]);

    // Transition 66: Click by destination amount and move from State 13 to State 11
    setBlock('Transition 66', 2);
    await TransactionTests.runActions([
        { action: 'clickDestAmount' },
    ]);

    // Transition 67: Select account with same currency as person account
    //  and move from State 11 to State 1
    setBlock('Transition 67', 2);
    await TransactionTests.runActions([
        { action: 'changeAccount', data: ACC_EUR },
    ]);

    // Transition 69: Disable account and move from State 11 to State 9
    setBlock('Transition 69', 2);
    await TransactionTests.runActions([
        { action: 'clickSrcAmount' }, // move from State 1 to State 0
        { action: 'changeSourceCurrency', data: USD }, // from State 0 to State 10
        { action: 'clickSrcResultBalance' }, // move from State 10 to State 11
        { action: 'toggleAccount' },
    ]);

    // Transition 71: Click by source result and move from State 12 to State 13
    setBlock('Transition 71', 2);
    await TransactionTests.runActions([
        { action: 'toggleAccount' }, // move from State 9 to State 1
        { action: 'clickSrcAmount' }, // move from State 1 to State 0
        { action: 'changeSourceCurrency', data: USD }, // move from State 0 to State 10
        { action: 'clickExchRate' }, // move from State 10 to State 12
        { action: 'clickSrcResultBalance' },
    ]);

    // Transition 72: Click by source amount and move from State 13 to State 12
    setBlock('Transition 72', 2);
    await TransactionTests.runActions([
        { action: 'clickSrcAmount' },
    ]);

    // Transition 73: Click by destination result and move from State 12 to State 15
    setBlock('Transition 73', 2);
    await TransactionTests.runActions([
        { action: 'clickDestResultBalance' },
    ]);

    // Transition 74: Click by exchange and move from State 15 to State 12
    setBlock('Transition 74', 2);
    await TransactionTests.runActions([
        { action: 'clickExchRate' },
    ]);

    // Transition 75: Select account with same currency as person account and
    // move from State 12 to State 0
    setBlock('Transition 75', 2);
    await TransactionTests.runActions([
        { action: 'changeAccount', data: ACC_USD },
    ]);

    // Transition 76: Change source currency same as currency of account
    //  and move from State 12 to State 0
    setBlock('Transition 76', 2);
    await TransactionTests.runActions([
        { action: 'changeSourceCurrency', data: EUR }, // move from State 0 to State 10
        { action: 'clickExchRate' }, // move from State 10 to State 12
        { action: 'changeSourceCurrency', data: USD },
    ]);

    // Transition 77: Disable account and move from State 12 to State 6
    setBlock('Transition 77', 2);
    await TransactionTests.runActions([
        { action: 'changeSourceCurrency', data: RUB }, // from State 0 to State 10
        { action: 'clickExchRate' }, // move from State 10 to State 12
        { action: 'toggleAccount' },
    ]);

    // Transition 78: Click by destination result and move from State 13 to State 14
    setBlock('Transition 78', 2);
    await TransactionTests.runActions([
        { action: 'toggleAccount' }, // move from State 6 to State 0
        { action: 'changeSourceCurrency', data: EUR }, // move from State 0 to State 10
        { action: 'clickExchRate' }, // move from State 10 to State 12
        { action: 'clickSrcResultBalance' }, // move from State 12 to State 13
        { action: 'clickDestResultBalance' },
    ]);

    // Transition 79: Click by exchange and move from State 14 to State 13
    setBlock('Transition 79', 2);
    await TransactionTests.runActions([
        { action: 'clickExchRate' },
    ]);

    // Transition 80: Select account with same currency as person account and
    // move from State 13 to State 1
    setBlock('Transition 80', 2);
    await TransactionTests.runActions([
        { action: 'changeAccount', data: ACC_EUR },
    ]);

    // Transition 81: Disable account and move from State 13 to State 9
    setBlock('Transition 81', 2);
    await TransactionTests.runActions([
        { action: 'clickSrcAmount' }, // move from State 1 to State 0
        { action: 'changeSourceCurrency', data: USD }, // from State 0 to State 10
        { action: 'clickExchRate' }, // move from State 10 to State 12
        { action: 'clickSrcResultBalance' }, // move from State 12 to State 13
        { action: 'toggleAccount' },
    ]);

    // Transition 82: Click by source amount and move from State 14 to State 15
    setBlock('Transition 82', 2);
    await TransactionTests.runActions([
        { action: 'toggleAccount' }, // move from State 9 to State 1
        { action: 'clickSrcAmount' }, // move from State 1 to State 0
        { action: 'changeSourceCurrency', data: RUB }, // move from State 0 to State 10
        { action: 'clickSrcResultBalance' }, // move from State 10 to State 11
        { action: 'clickDestResultBalance' }, // move from State 11 to State 14
        { action: 'clickSrcAmount' },
    ]);

    // Transition 83: Click by source result and move from State 15 to State 14
    setBlock('Transition 83', 2);
    await TransactionTests.runActions([
        { action: 'clickSrcResultBalance' },
    ]);

    // Transition 84: Select account with same currency as person account and
    // move from State 14 to State 1
    setBlock('Transition 84', 2);
    await TransactionTests.runActions([
        { action: 'changeAccount', data: ACC_RUB },
    ]);

    // Transition 85: Disable account and move from State 14 to State 9
    setBlock('Transition 85', 2);
    await TransactionTests.runActions([
        { action: 'clickSrcAmount' }, // move from State 1 to State 0
        { action: 'changeSourceCurrency', data: EUR }, // move from State 0 to State 10
        { action: 'clickSrcResultBalance' }, // move from State 10 to State 11
        { action: 'clickDestResultBalance' }, // move from State 11 to State 14
        { action: 'toggleAccount' },
    ]);

    // Transition 86: Change source currency same as currency of account
    //  and move from State 15 to State 0
    setBlock('Transition 86', 2);
    await TransactionTests.runActions([
        { action: 'toggleAccount' }, // move from State 9 to State 1
        { action: 'clickSrcAmount' }, // move from State 1 to State 0
        { action: 'changeSourceCurrency', data: USD }, // move from State 0 to State 10
        { action: 'clickDestResultBalance' }, // move from State 10 to State 15
        { action: 'changeSourceCurrency', data: RUB },
    ]);

    // Transition 87: Select account with same currency as person account
    //  and move from State 15 to State 0
    setBlock('Transition 87', 2);
    await TransactionTests.runActions([
        { action: 'changeSourceCurrency', data: USD }, // move from State 0 to State 10
        { action: 'clickDestResultBalance' }, // move from State 10 to State 15
        { action: 'changeAccount', data: ACC_USD },
    ]);

    // Transition 88: Disable account and move from State 15 to State 6
    setBlock('Transition 88', 2);
    await TransactionTests.runActions([
        { action: 'changeSourceCurrency', data: RUB }, // move from State 0 to State 10
        { action: 'clickDestResultBalance' }, // move from State 10 to State 15
        { action: 'toggleAccount' },
    ]);

    // Transition 96: Select destination currency different from currency of account
    //  and move from State 3 to State 16
    setBlock('Transition 96', 2);
    await TransactionTests.runActions([
        { action: 'toggleAccount' }, // move from State 6 to State 0
        { action: 'swapSourceAndDest' }, // move from State 0 to State 3
        { action: 'changeDestCurrency', data: EUR },
    ]);

    // Transition 89: Click by source result and move from State 16 to State 21
    setBlock('Transition 89', 2);
    await TransactionTests.runActions([
        { action: 'clickSrcResultBalance' },
    ]);

    // Transition 90: Click by source amount and move from State 21 to State 16
    setBlock('Transition 90', 2);
    await TransactionTests.runActions([
        { action: 'clickSrcAmount' },
    ]);

    // Transition 91: Click by destination result and move from State 16 to State 17
    setBlock('Transition 91', 2);
    await TransactionTests.runActions([
        { action: 'clickDestResultBalance' },
    ]);

    // Transition 92: Click by destination amount and move from State 17 to State 16
    setBlock('Transition 92', 2);
    await TransactionTests.runActions([
        { action: 'clickDestAmount' },
    ]);

    // Transition 93: Click by exchange and move from State 16 to State 18
    setBlock('Transition 93', 2);
    await TransactionTests.runActions([
        { action: 'clickExchRate' },
    ]);

    // Transition 94: Click by source amount and move from State 18 to State 16
    setBlock('Transition 94', 2);
    await TransactionTests.runActions([
        { action: 'clickSrcAmount' },
    ]);

    // Transition 95: Select destination currency same as currency of account
    //  and move from State 16 to State 3
    setBlock('Transition 95', 2);
    await TransactionTests.runActions([
        { action: 'changeDestCurrency', data: USD },
    ]);

    // Transition 97: Disable account and move from State 16 to State 7
    setBlock('Transition 97', 2);
    await TransactionTests.runActions([
        { action: 'changeDestCurrency', data: EUR }, // move from State 3 to State 16
        { action: 'toggleAccount' },
    ]);

    // Transition 139: Select account with same currency as person account
    //  and move from State 16 to State 3
    setBlock('Transition 139', 2);
    await TransactionTests.runActions([
        { action: 'toggleAccount' }, // move from State 7 to State 3
        { action: 'changeDestCurrency', data: RUB }, // move from State 3 to State 16
        { action: 'changeAccount', data: ACC_RUB },
    ]);

    // Transition 99: Click by source result and move from State 17 to State 20
    setBlock('Transition 99', 2);
    await TransactionTests.runActions([
        { action: 'changeDestCurrency', data: EUR }, // move from State 3 to State 16
        { action: 'clickDestResultBalance' }, // move from State 16 to State 17
        { action: 'clickSrcResultBalance' },
    ]);

    // Transition 100: Click by source amount and move from State 20 to State 17
    setBlock('Transition 100', 2);
    await TransactionTests.runActions([
        { action: 'clickSrcAmount' },
    ]);

    // Transition 101: Click by exchange and move from State 17 to State 19
    setBlock('Transition 101', 2);
    await TransactionTests.runActions([
        { action: 'clickExchRate' },
    ]);

    // Transition 102: Click by source amount and move from State 19 to State 17
    setBlock('Transition 102', 2);
    await TransactionTests.runActions([
        { action: 'clickSrcAmount' },
    ]);

    // Transition 103: Select account with same currency as person account
    //  and move from State 17 to State 4
    setBlock('Transition 103', 2);
    await TransactionTests.runActions([
        { action: 'changeAccount', data: ACC_EUR },
    ]);

    // Transition 105: Disable account and move from State 17 to State 8
    setBlock('Transition 105', 2);
    await TransactionTests.runActions([
        { action: 'clickDestAmount' }, // move from State 4 to State 3
        { action: 'changeDestCurrency', data: RUB }, // move from State 3 to State 16
        { action: 'clickDestResultBalance' }, // move from State 16 to State 17
        { action: 'toggleAccount' },
    ]);

    // Transition 107: Click by destination result and move from State 18 to State 19
    setBlock('Transition 107', 2);
    await TransactionTests.runActions([
        { action: 'toggleAccount' }, // move from State 8 to State 4
        { action: 'clickDestAmount' }, // move from State 4 to State 3
        { action: 'changeDestCurrency', data: USD }, // move from State 3 to State 16
        { action: 'clickExchRate' }, // move from State 16 to State 18
        { action: 'clickDestResultBalance' },
    ]);

    // Transition 108: Click by destination amount and move from State 19 to State 18
    setBlock('Transition 108', 2);
    await TransactionTests.runActions([
        { action: 'clickDestAmount' },
    ]);

    // Transition 109: Click by source result and move from State 18 to State 21
    setBlock('Transition 109', 2);
    await TransactionTests.runActions([
        { action: 'clickSrcResultBalance' },
    ]);

    // Transition 110: Click by exchange and move from State 21 to State 18
    setBlock('Transition 110', 2);
    await TransactionTests.runActions([
        { action: 'clickExchRate' },
    ]);

    // Transition 111: Select destination currency same as currency of account
    //  and move from State 18 to State 3
    setBlock('Transition 111', 2);
    await TransactionTests.runActions([
        { action: 'changeDestCurrency', data: EUR },
    ]);

    // Transition 112: Select account with same currency as person account
    //  and move from State 18 to State 3
    setBlock('Transition 112', 2);
    await TransactionTests.runActions([
        { action: 'changeDestCurrency', data: USD }, // move from State 3 to State 16
        { action: 'clickExchRate' }, // move from State 16 to State 18
        { action: 'changeAccount', data: ACC_USD },
    ]);

    // Transition 113: Disable account and move from State 18 to State 7
    setBlock('Transition 113', 2);
    await TransactionTests.runActions([
        { action: 'changeDestCurrency', data: RUB }, // move from State 3 to State 16
        { action: 'clickExchRate' }, // move from State 16 to State 18
        { action: 'toggleAccount' },
    ]);

    // Transition 114: Click by source result and move from State 19 to State 20
    setBlock('Transition 114', 2);
    await TransactionTests.runActions([
        { action: 'toggleAccount' }, // move from State 7 to State 3
        { action: 'changeDestCurrency', data: EUR }, // move from State 3 to State 16
        { action: 'clickExchRate' }, // move from State 16 to State 18
        { action: 'clickDestResultBalance' }, // move from State 18 to State 19
        { action: 'clickSrcResultBalance' },
    ]);

    // Transition 115: Click by exchange and move from State 20 to State 19
    setBlock('Transition 115', 2);
    await TransactionTests.runActions([
        { action: 'clickExchRate' },
    ]);

    // Transition 116: Select account with same currency as person account
    //  and move from State 19 to State 4
    setBlock('Transition 116', 2);
    await TransactionTests.runActions([
        { action: 'changeAccount', data: ACC_EUR },
    ]);

    // Transition 117: Disable account and move from State 19 to State 8
    setBlock('Transition 117', 2);
    await TransactionTests.runActions([
        { action: 'clickDestAmount' }, // move from State 4 to State 3
        { action: 'changeDestCurrency', data: RUB }, // move from State 3 to State 16
        { action: 'clickDestResultBalance' }, // move from State 16 to State 17
        { action: 'clickExchRate' }, // move from State 17 to State 19
        { action: 'toggleAccount' },
    ]);

    // Transition 118: Click by destination amount and move from State 20 to State 21
    setBlock('Transition 118', 2);
    await TransactionTests.runActions([
        { action: 'toggleAccount' }, // move from State 8 to State 4
        { action: 'clickDestAmount' }, // move from State 4 to State 3
        { action: 'changeDestCurrency', data: USD }, // move from State 3 to State 16
        { action: 'clickDestResultBalance' }, // move from State 16 to State 17
        { action: 'clickSrcResultBalance' }, // move from State 17 to State 20
        { action: 'clickDestAmount' },
    ]);

    // Transition 119: Click by destination result and move from State 21 to State 20
    setBlock('Transition 119', 2);
    await TransactionTests.runActions([
        { action: 'clickDestResultBalance' },
    ]);

    // Transition 120: Select account with same currency as person account
    //  and move from State 20 to State 4
    setBlock('Transition 120', 2);
    await TransactionTests.runActions([
        { action: 'changeAccount', data: ACC_USD },
    ]);

    // Transition 121: Disable account and move from State 20 to State 8
    setBlock('Transition 121', 2);
    await TransactionTests.runActions([
        { action: 'clickDestAmount' }, // move from State 4 to State 3
        { action: 'changeDestCurrency', data: RUB }, // move from State 3 to State 16
        { action: 'clickDestResultBalance' }, // move from State 16 to State 17
        { action: 'clickSrcResultBalance' }, // move from State 17 to State 20
        { action: 'toggleAccount' },
    ]);

    // Transition 122: Select destination currency same as currency of account
    //  and move from State 21 to State 3
    setBlock('Transition 122', 2);
    await TransactionTests.runActions([
        { action: 'toggleAccount' }, // move from State 8 to State 4
        { action: 'clickDestAmount' }, // move from State 4 to State 3
        { action: 'changeDestCurrency', data: EUR }, // move from State 3 to State 16
        { action: 'clickSrcResultBalance' }, // move from State 16 to State 21
        { action: 'changeDestCurrency', data: USD },
    ]);

    // Transition 123: Select account with same currency as person account
    //  and move from State 21 to State 3
    setBlock('Transition 123', 2);
    await TransactionTests.runActions([
        { action: 'changeDestCurrency', data: RUB }, // move from State 3 to State 16
        { action: 'clickSrcResultBalance' }, // move from State 16 to State 21
        { action: 'changeAccount', data: ACC_RUB },
    ]);

    // Transition 124: Disable account and move from State 21 to State 7
    setBlock('Transition 124', 2);
    await TransactionTests.runActions([
        { action: 'changeDestCurrency', data: RUB }, // move from State 3 to State 16
        { action: 'clickSrcResultBalance' }, // move from State 16 to State 21
        { action: 'toggleAccount' },
    ]);

    // Transition 125: Change debt type to "take" and move from State 10 to State 16
    setBlock('Transition 125', 2);
    await TransactionTests.runActions([
        { action: 'toggleAccount' }, // move from State 7 to State 3
        { action: 'swapSourceAndDest' }, // move from State 3 to State 0
        { action: 'changeSourceCurrency', data: USD }, // move from State 0 to State 10
        { action: 'swapSourceAndDest' },
    ]);

    // Transition 126: Change debt type to "give" and move from State 16 to State 10
    setBlock('Transition 126', 2);
    await TransactionTests.runActions([
        { action: 'swapSourceAndDest' },
    ]);

    // Transition 127: Change debt type to "take" and move from State 11 to State 17
    setBlock('Transition 127', 2);
    await TransactionTests.runActions([
        { action: 'clickSrcResultBalance' }, // move from State 10 to State 11
        { action: 'swapSourceAndDest' },
    ]);

    // Transition 128: Change debt type to "give" and move from State 17 to State 11
    setBlock('Transition 128', 2);
    await TransactionTests.runActions([
        { action: 'swapSourceAndDest' },
    ]);

    // Transition 129: Change debt type to "take" and move from State 12 to State 18
    setBlock('Transition 129', 2);
    await TransactionTests.runActions([
        { action: 'clickSrcAmount' }, // move from State 11 to State 10
        { action: 'clickExchRate' }, // move from State 10 to State 12
        { action: 'swapSourceAndDest' },
    ]);

    // Transition 130: Change debt type to "give" and move from State 18 to State 12
    setBlock('Transition 130', 2);
    await TransactionTests.runActions([
        { action: 'swapSourceAndDest' },
    ]);

    // Transition 131: Change debt type to "take" and move from State 13 to State 19
    setBlock('Transition 131', 2);
    await TransactionTests.runActions([
        { action: 'clickSrcResultBalance' }, // move from State 12 to State 13
        { action: 'swapSourceAndDest' },
    ]);

    // Transition 132: Change debt type to "give" and move from State 19 to State 13
    setBlock('Transition 132', 2);
    await TransactionTests.runActions([
        { action: 'swapSourceAndDest' },
    ]);

    // Transition 133: Change debt type to "take" and move from State 14 to State 20
    setBlock('Transition 133', 2);
    await TransactionTests.runActions([
        { action: 'clickDestResultBalance' }, // move from State 13 to State 14
        { action: 'swapSourceAndDest' },
    ]);

    // Transition 134: Change debt type to "give" and move from State 20 to State 14
    setBlock('Transition 134', 2);
    await TransactionTests.runActions([
        { action: 'swapSourceAndDest' },
    ]);

    // Transition 135: Change debt type to "take" and move from State 15 to State 21
    setBlock('Transition 135', 2);
    await TransactionTests.runActions([
        { action: 'clickSrcAmount' }, // move from State 14 to State 15
        { action: 'swapSourceAndDest' },
    ]);

    // Transition 136: Change debt type to "give" and move from State 21 to State 15
    setBlock('Transition 136', 2);
    await TransactionTests.runActions([
        { action: 'swapSourceAndDest' },
    ]);
};
