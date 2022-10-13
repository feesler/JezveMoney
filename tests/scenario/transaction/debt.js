import { test, setBlock } from 'jezve-test';
import { App } from '../../Application.js';
import * as TransactionTests from '../../run/transaction/index.js';

export const stateLoop = async () => {
    await App.state.fetch();

    const [ACC_3, ACC_RUB, ACC_USD, ACC_EUR, CARD_RUB] = App.state.getAccountIndexesByNames([
        'ACC_3', 'ACC_RUB', 'ACC_USD', 'ACC_EUR', 'CARD_RUB',
    ]);

    const [MARIA, IVAN] = App.state.getPersonIndexesByNames([
        'Maria', 'Johnny',
    ]);

    // Navigate to create debt view
    await App.goToMainView();
    await App.view.goToNewTransactionByPerson(0);

    setBlock('Debt loop', 2);
    const initialState = (App.view.model.debtType) ? 0 : 3;
    await test('Initial state of new debt view', () => {
        App.view.setExpectedState(initialState);
        return App.view.checkState();
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
        { action: 'changeAccountByPos', data: ACC_RUB },
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
        { action: 'changeAccountByPos', data: ACC_USD },
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
        { action: 'changeAccountByPos', data: ACC_EUR },
        // Transition 9: Click by destination result balance and move from State 3 to State 4
        { action: 'clickDestResultBalance' },
        // Transition 51: Change to another one and stay on State 4
        { action: 'changeAccountByPos', data: CARD_RUB },
        // Transition 10: Click by source amount and move from State 4 to State 3
        { action: 'clickSrcAmount' },
        // Transition 11: Click by source result balance and move from State 4 to State 5
        { action: 'clickDestResultBalance' }, // move from State 3 to State 4
        { action: 'clickSrcResultBalance' },
        // Transition 48: Change to another one and stay on State 5
        { action: 'changeAccountByPos', data: ACC_3 },
        // Transition 12: Click by source amount and move from State 5 to State 3
        { action: 'clickSrcAmount' },
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
        { action: 'clickSrcAmount' }, // move from State 5 to State 3
        { action: 'swapSourceAndDest' }, // move from State 3 to State 0
        { action: 'changePersonByPos', data: IVAN },
        // Transition 20: Change person to another one and stay on State 1
        { action: 'clickSrcResultBalance' }, // move from State 0 to State 1
        { action: 'changePersonByPos', data: MARIA },
        // Transition 21: Change person to another one and stay on State 2
        { action: 'clickDestResultBalance' }, // move from State 1 to State 2
        { action: 'changePersonByPos', data: IVAN },
        // Transition 22: Change person to another one and stay on State 5
        { action: 'swapSourceAndDest' }, // move from State 2 to State 5
        { action: 'changePersonByPos', data: MARIA },
        // Transition 23: Change person to another one and stay on State 4
        { action: 'clickDestResultBalance' }, // move from State 5 to State 4
        { action: 'changePersonByPos', data: IVAN },
        // Transition 24: Change person to another one and stay on State 3
        { action: 'clickSrcAmount' }, // move from State 4 to State 3
        { action: 'changePersonByPos', data: MARIA },
        // Transition 25: Disable account and move from State 0 to State 6
        { action: 'swapSourceAndDest' }, // move from State 3 to State 0
        { action: 'toggleAccount' },
        // Transition 43: Change person to another one and stay on State 6
        { action: 'changePersonByPos', data: IVAN },
        // Transition 26: Enable account and move from State 6 to State 0
        { action: 'toggleAccount' },
        // Transition 27: Change debt type to "take" and move from State 6 to State 7
        { action: 'toggleAccount' }, // move from State 0 to State 6
        { action: 'swapSourceAndDest' },
        // Transition 44: Change person to another one and stay on State 7
        { action: 'changePersonByPos', data: MARIA },
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
        { action: 'changePersonByPos', data: IVAN },
        // Transition 31: Click by source amount and move from State 8 to State 7
        { action: 'clickSrcAmount' },
        // Transition 32: Enable account and move from State 8 to State 4
        { action: 'clickDestResultBalance' }, // move from State 7 to State 8
        { action: 'toggleAccount' },
        // Transition 39: Disable account and move from State 4 to State 8
        { action: 'toggleAccount' },
        // Transition 33: Change debt type to "give" and move from State 8 to State 9
        { action: 'swapSourceAndDest' },
        // Transition 46: Change person to another one and stay on State 9
        { action: 'changePersonByPos', data: MARIA },
        // Transition 34: Change debt type to "take" and move from State 9 to State 8
        { action: 'swapSourceAndDest' },
        // Transition 35: Click by source amount and move from State 9 to State 6
        { action: 'changePersonByPos', data: IVAN }, // stay on State 8
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
        // Transition 52: Change to another one and stay on State 0
        { action: 'toggleAccount' }, // move from State 6 to State 0
        { action: 'changeAccountByPos', data: ACC_USD },
        // Transition 50: Disable account and move from State 5 to State 7
        { action: 'clickDestResultBalance' }, // move from State 0 to State 2
        { action: 'swapSourceAndDest' }, // move from State 2 to State 5
        { action: 'toggleAccount' },
    ]);
};
