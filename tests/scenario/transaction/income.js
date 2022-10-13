import { test, setBlock } from 'jezve-test';
import { App } from '../../Application.js';
import { INCOME } from '../../model/Transaction.js';
import * as TransactionTests from '../../run/transaction/index.js';

export const stateLoop = async () => {
    await App.state.fetch();

    const [RUB, USD, EUR] = App.currency.getItemsByNames(['RUB', 'USD', 'EUR']);
    const [ACC_3, ACC_RUB, ACC_USD, ACC_EUR] = App.state.getAccountIndexesByNames([
        'ACC_3', 'ACC_RUB', 'ACC_USD', 'ACC_EUR',
    ]);

    // Navigate to create income view
    await App.goToMainView();
    await App.view.goToNewTransactionByAccount(0);
    await App.view.changeTransactionType(INCOME);

    // State 0
    setBlock('Income loop', 2);
    await test('Initial state of new income view', () => {
        App.view.setExpectedState(0);
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
    ];
    await TransactionTests.runGroup('inputSrcAmount', saInputData);

    await TransactionTests.runActions([
        // Transition 2: Click on destination result balance block and move from State 0 to State 1
        { action: 'clickDestResultBalance' },
        // Transition 23: Change account to another one with different currency and stay on State 1
        { action: 'changeDestAccountByPos', data: ACC_EUR },
        { action: 'changeDestAccountByPos', data: ACC_3 },
    ]);

    // Input result balance
    const drbInputData = [
        '502.08',
        '502.080',
        '502.0801',
    ];
    await TransactionTests.runGroup('inputDestResBalance', drbInputData);

    await TransactionTests.runActions([
        // Transition 4: Click on source amount block and move from State 1 to State 0
        { action: 'clickSrcAmount' },
        // Transition 3: Change source currency to different than currency of account and move
        //  from State 0 to State 2
        { action: 'changeSourceCurrency', data: USD },
        // Transition 5: Change account to another one with currency different than current source
        //  currency and stay on State 2
        { action: 'changeDestAccountByPos', data: ACC_EUR },
        { action: 'changeDestAccountByPos', data: ACC_3 },
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

    await TransactionTests.runActions([
        // Transition 7: Click on result balance block and move from State 2 to State 4
        { action: 'clickDestResultBalance' },
        // Transition 17: Change account to another one with currency different than current
        //  source currency and stay on State 4
        { action: 'changeDestAccountByPos', data: ACC_EUR },
        { action: 'changeDestAccountByPos', data: ACC_3 },
        // Transition 21: Change source currency to different than currency of account and stay
        //  on State 4
        { action: 'changeSourceCurrency', data: EUR },
        { action: 'changeSourceCurrency', data: USD },
        // Transition 20: Click on exchange rate block and move from State 4 to State 3
        { action: 'clickExchRate' },
        // Transition 14: Click on exchange rate block and move from State 4 to State 3
        { action: 'clickDestResultBalance' },
        // Transition 19: Click on destination amount block and move from State 4 to State 3
        { action: 'clickDestAmount' },
        // Transition 8: Click on exchange rate block and move from State 2 to State 3
        { action: 'clickExchRate' },
    ]);

    // Input exchange rate
    const exInputData = [
        '1.09',
        '3.09',
        '.09',
        '.090101',
    ];
    await TransactionTests.runGroup('inputExchRate', exInputData);

    await TransactionTests.runActions([
        // Transition 13: Click on destination amount block and move from State 3 to State 2
        { action: 'clickDestAmount' },
        // Transition 9: change source currency to different than currency of account and
        //  stay on State 2
        { action: 'changeSourceCurrency', data: EUR },
        // Transition 10: Change source currency to the same as currency of account and
        //  move from State 2 to State 0
        { action: 'changeSourceCurrency', data: RUB },
        // Transition 11: Change destination account to another with currency different
        //  currest source currency
        { action: 'changeSourceCurrency', data: USD }, // move from State 0 to State 2
        { action: 'clickExchRate' }, // move from State 2 to State 3
        { action: 'changeDestAccountByPos', data: ACC_EUR },
        // Transition 12: Change destination account to another one with same currency as
        //  currest source currency
        { action: 'changeDestAccountByPos', data: ACC_USD },
        // Transition 15: Change source currency to different than currency of account and
        //  stay on State 3
        { action: 'changeSourceCurrency', data: RUB }, // move from State 0 to State 2
        { action: 'clickExchRate' }, // move from State 2 to State 3
        { action: 'changeSourceCurrency', data: EUR },
        // Transition 16: Change source currency to different than currency of account
        //  and stay on State 3
        { action: 'changeSourceCurrency', data: USD },
        // Transition 18: Change destination account to another one with same currency as currest
        //  source currency and move from State 4 to State 1
        { action: 'changeSourceCurrency', data: RUB }, // move from State 0 to State 2
        { action: 'clickDestResultBalance' }, // move from State 2 to State 4
        { action: 'changeDestAccountByPos', data: ACC_RUB },
        // Transition 6: Change destination account to another one with same currency as currest
        //  source currency
        { action: 'clickSrcAmount' }, // move from State 1 to State 0
        { action: 'changeSourceCurrency', data: USD }, // move from State 0 to State 2
        { action: 'changeDestAccountByPos', data: ACC_USD },
        // Transition 1: Change destination account to another one with same currency as currest
        //  source currency
        { action: 'changeDestAccountByPos', data: ACC_3 },
        // Transition 22: Change source currency to the same as currency of account and move from
        //  State 4 to State 1
        { action: 'changeSourceCurrency', data: USD }, // move from State 0 to State 2
        { action: 'clickDestResultBalance' }, // move from State 2 to State 4
        { action: 'changeSourceCurrency', data: RUB },
    ]);
};
