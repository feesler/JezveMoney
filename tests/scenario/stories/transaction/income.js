import { test, setBlock } from 'jezve-test';
import { App } from '../../../Application.js';
import { INCOME } from '../../../model/Transaction.js';
import * as Actions from '../../../actions/transaction.js';

export const stateLoop = async () => {
    await App.state.fetch();

    const {
        RUB,
        USD,
        EUR,
        BTC,
        ACC_3,
        ACC_RUB,
        ACC_USD,
        ACC_EUR,
        ACC_BTC,
    } = App.scenario;

    // Navigate to create income view
    await App.goToMainView();
    await App.view.goToNewTransactionByAccount(0);
    await App.view.changeTransactionType(INCOME);

    // State 0
    setBlock('Income loop', 2);
    await test('Initial state of new income view', () => {
        App.view.model.state = 0;
        const expected = App.view.getExpectedState();
        return App.view.checkState(expected);
    });

    // Input source amount
    await Actions.runGroup('inputSrcAmount', Actions.decimalInputTestStrings);

    await Actions.runActions([
        // Transition 2: Click on destination result balance block and move from State 0 to State 1
        { action: 'clickDestResultBalance' },
        // Transition 23: Change account to another one with different currency and stay on State 1
        { action: 'changeDestAccount', data: ACC_EUR },
        { action: 'changeDestAccount', data: ACC_3 },
    ]);

    // Input result balance
    await Actions.runGroup('inputDestResBalance', Actions.decimalInputTestStrings);

    await Actions.runActions([
        // Transition 4: Click on source amount block and move from State 1 to State 0
        { action: 'clickSrcAmount' },
        // Transition 3: Change source currency to different than currency of account and move
        //  from State 0 to State 2
        { action: 'changeSourceCurrency', data: USD },
        // Transition 5: Change account to another one with currency different than current source
        //  currency and stay on State 2
        { action: 'changeDestAccount', data: ACC_EUR },
        { action: 'changeDestAccount', data: ACC_3 },
    ]);

    // Input destination amount
    await Actions.runGroup('inputDestAmount', Actions.decimalInputTestStrings);

    await Actions.runActions([
        // Transition 7: Click on result balance block and move from State 2 to State 4
        { action: 'clickDestResultBalance' },
        // Transition 17: Change account to another one with currency different than current
        //  source currency and stay on State 4
        { action: 'changeDestAccount', data: ACC_EUR },
        { action: 'changeDestAccount', data: ACC_3 },
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
    await Actions.runGroup('inputExchRate', Actions.decimalInputTestStrings);

    // Toggle direction of exchange rate and stay on State 3
    await Actions.runAction({ action: 'toggleExchange' });
    // Input back exchange rate
    await Actions.runGroup('inputExchRate', Actions.decimalInputTestStrings);
    // Toggle direction of exchange rate and stay on State 3
    await Actions.runAction({ action: 'toggleExchange' });

    await Actions.runActions([
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
        { action: 'changeDestAccount', data: ACC_EUR },
        // Transition 12: Change destination account to another one with same currency as
        //  currest source currency
        { action: 'changeDestAccount', data: ACC_USD },
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
        { action: 'changeDestAccount', data: ACC_RUB },
        // Transition 6: Change destination account to another one with same currency as currest
        //  source currency
        { action: 'clickSrcAmount' }, // move from State 1 to State 0
        { action: 'changeSourceCurrency', data: USD }, // move from State 0 to State 2
        { action: 'changeDestAccount', data: ACC_USD },
        // Transition 1: Change destination account to another one with same currency as currest
        //  source currency
        { action: 'changeDestAccount', data: ACC_3 },
        // Transition 22: Change source currency to the same as currency of account and move from
        //  State 4 to State 1
        { action: 'changeSourceCurrency', data: USD }, // move from State 0 to State 2
        { action: 'clickDestResultBalance' }, // move from State 2 to State 4
        { action: 'changeSourceCurrency', data: RUB },
        // Transition 4: Click on source amount block and move from State 1 to State 0
        { action: 'clickSrcAmount' },
    ]);

    // Test input values for precise currency
    await Actions.runActions([
        { action: 'changeSourceCurrency', data: BTC },
        { action: 'inputSrcAmount', data: '0.12345678' },
        { action: 'changeDestAccount', data: ACC_BTC },
        { action: 'clickDestResultBalance' },
        { action: 'inputDestResBalance', data: '555.12345678' },
    ]);

    // Test handling invalid date string on show date picker
    await Actions.runActions([
        { action: 'inputDate', data: '' },
        { action: 'selectDate', data: App.dates.now },
    ]);
};
