import { test, setBlock } from 'jezve-test';
import { App } from '../../../Application.js';
import { EXPENSE } from '../../../model/Transaction.js';
import * as TransactionTests from '../../../run/transaction.js';

export const stateLoop = async () => {
    await App.state.fetch();

    const [RUB, USD, EUR] = App.currency.getItemsByNames(['RUB', 'USD', 'EUR']);
    const [ACC_3, ACC_RUB, ACC_USD, ACC_EUR] = App.state.getAccountIndexesByNames([
        'ACC_3', 'ACC_RUB', 'ACC_USD', 'ACC_EUR',
    ]);

    // Navigate to create expense view
    await App.goToMainView();
    await App.view.goToNewTransactionByAccount(0);
    await App.view.changeTransactionType(EXPENSE);

    // State 0
    setBlock('Expense loop', 2);
    await test('Initial state of new expense view', () => {
        App.view.model.state = 0;
        const expected = App.view.getExpectedState();
        return App.view.checkState(expected);
    });

    // Input destination amount
    const daInputData = [
        '1',
        '1.',
        '1.0',
        '1.01',
        '1.010',
        '1.0101',
    ];

    await TransactionTests.runGroup('inputDestAmount', daInputData);

    // Transition 2: click on result balance block and move from State 0 to State 1
    await TransactionTests.runAction({ action: 'clickSrcResultBalance' });

    // Input result balance
    const srbInputData = [
        '499.9',
        '499.90',
        '499.901',
    ];
    await TransactionTests.runGroup('inputResBalance', srbInputData);

    await TransactionTests.runActions([
        // Transition 12: change account to another one with different currency and stay on State 1
        { action: 'changeSrcAccountByPos', data: ACC_USD },
        // Change account back
        { action: 'changeSrcAccountByPos', data: ACC_3 },
        // Transition 3: click on destination amount block and move from State 1 to State 0
        { action: 'clickDestAmount' },
        // Transition 4: select different currency for destination and move from State 0 to State 2
        { action: 'changeDestCurrency', data: USD },
    ]);

    // Input source amount
    const saInputData = [
        '',
        '.',
        '0.',
        '.0',
        '.01',
        '1.01',
        '1.010',
    ];
    await TransactionTests.runGroup('inputSrcAmount', saInputData);

    // Transition 8: click on exchange rate block and move from State 2 to State 3
    await TransactionTests.runAction({ action: 'clickExchRate' });

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

    // Toggle direction of exchange rate and stay on State 3
    await TransactionTests.runAction({ action: 'toggleExchange' });
    // Input backexchange rate
    const backExchInputData = [
        '66.5',
        '166.56',
    ];
    await TransactionTests.runGroup('inputExchRate', backExchInputData);
    // Toggle direction of exchange rate and stay on State 3
    await TransactionTests.runAction({ action: 'toggleExchange' });

    await TransactionTests.runActions([
        // Transition 16: click on destination amount block and move from State 3 to State 2
        { action: 'clickDestAmount' },
        // Transition 13: select another currency different from currency of source account
        //  and stay on state 2
        { action: 'changeDestCurrency', data: EUR },
        // Transition 9: select same currency as source account and move from State 2 to State 0
        { action: 'changeDestCurrency', data: RUB },
        // Transition 1: change account to another one with different currency and stay on State 0
        { action: 'changeSrcAccountByPos', data: ACC_USD },
        // Transition 5: change account to another one with currency different than current
        //  destination currency and stay on State 2
        { action: 'changeDestCurrency', data: EUR },
        { action: 'changeSrcAccountByPos', data: ACC_3 },
        // Transition 6: click on source result balance block and move from State 2 to State 4
        { action: 'clickSrcResultBalance' },
        // Transition 10: change account to another one with currency different than current
        //  destination currency and stay on State 4
        { action: 'changeSrcAccountByPos', data: ACC_USD },
        // Transition 7: click on destination amount block and move from State 4 to State 2
        { action: 'clickDestAmount' },
        // Transition 14: select source account with the same currency as destination and move
        //  from State 2 to State 0
        { action: 'changeSrcAccountByPos', data: ACC_EUR },
        // Transition 17: change account to another one with currency different than current
        //  destination currency and stay on State 3
        { action: 'changeDestCurrency', data: RUB },
        { action: 'clickExchRate' },
        { action: 'changeSrcAccountByPos', data: ACC_USD },
        // Transition 15: select source account with the same currency as destination and move
        //  from State 2 to State 0
        { action: 'changeSrcAccountByPos', data: ACC_RUB },
        // Transition 19: click on exchange rate block and move from State 4 to State 3
        { action: 'changeDestCurrency', data: USD }, // move from State 0 to State 2
        { action: 'clickSrcResultBalance' }, // move from State 2 to State 4
        { action: 'clickExchRate' },
        // Transition 18: click on source result balance and move from State 3 to State 4
        { action: 'clickSrcResultBalance' },

        // Transition 11: select source account with the same currency as destination and move
        //  from State 4 to State 1
        { action: 'changeSrcAccountByPos', data: ACC_USD },
    ]);
};
