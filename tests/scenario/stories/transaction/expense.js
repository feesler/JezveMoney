import { test, setBlock } from 'jezve-test';
import { App } from '../../../Application.js';
import { EXPENSE } from '../../../model/Transaction.js';
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
    await Actions.runGroup('inputDestAmount', Actions.decimalInputTestStrings);

    // Transition 2: click on result balance block and move from State 0 to State 1
    await Actions.runAction({ action: 'clickSrcResultBalance' });

    // Input result balance
    await Actions.runGroup('inputResBalance', Actions.decimalInputTestStrings);

    await Actions.runActions([
        // Transition 12: change account to another one with different currency and stay on State 1
        { action: 'changeSrcAccount', data: ACC_USD },
        // Change account back
        { action: 'changeSrcAccount', data: ACC_3 },
        // Transition 3: click on destination amount block and move from State 1 to State 0
        { action: 'clickDestAmount' },
        // Transition 4: select different currency for destination and move from State 0 to State 2
        { action: 'changeDestCurrency', data: USD },
    ]);

    // Input source amount
    await Actions.runGroup('inputSrcAmount', Actions.decimalInputTestStrings);

    // Transition 8: click on exchange rate block and move from State 2 to State 3
    await Actions.runAction({ action: 'clickExchRate' });

    // Input exchange rate
    await Actions.runGroup('inputExchRate', Actions.decimalInputTestStrings);

    // Toggle direction of exchange rate and stay on State 3
    await Actions.runAction({ action: 'toggleExchange' });
    // Input back exchange rate
    await Actions.runGroup('inputExchRate', Actions.decimalInputTestStrings);
    // Toggle direction of exchange rate and stay on State 3
    await Actions.runAction({ action: 'toggleExchange' });

    await Actions.runActions([
        // Transition 16: click on destination amount block and move from State 3 to State 2
        { action: 'clickDestAmount' },
        // Transition 13: select another currency different from currency of source account
        //  and stay on state 2
        { action: 'changeDestCurrency', data: EUR },
        // Transition 9: select same currency as source account and move from State 2 to State 0
        { action: 'changeDestCurrency', data: RUB },
        // Transition 1: change account to another one with different currency and stay on State 0
        { action: 'changeSrcAccount', data: ACC_USD },
        // Transition 5: change account to another one with currency different than current
        //  destination currency and stay on State 2
        { action: 'changeDestCurrency', data: EUR },
        { action: 'changeSrcAccount', data: ACC_3 },
        // Transition 6: click on source result balance block and move from State 2 to State 4
        { action: 'clickSrcResultBalance' },
        // Transition 10: change account to another one with currency different than current
        //  destination currency and stay on State 4
        { action: 'changeSrcAccount', data: ACC_USD },
        // Transition 7: click on destination amount block and move from State 4 to State 2
        { action: 'clickDestAmount' },
        // Transition 14: select source account with the same currency as destination and move
        //  from State 2 to State 0
        { action: 'changeSrcAccount', data: ACC_EUR },
        // Transition 17: change account to another one with currency different than current
        //  destination currency and stay on State 3
        { action: 'changeDestCurrency', data: RUB },
        { action: 'clickExchRate' },
        { action: 'changeSrcAccount', data: ACC_USD },
        // Transition 15: select source account with the same currency as destination and move
        //  from State 2 to State 0
        { action: 'changeSrcAccount', data: ACC_RUB },
        // Transition 19: click on exchange rate block and move from State 4 to State 3
        { action: 'changeDestCurrency', data: USD }, // move from State 0 to State 2
        { action: 'clickSrcResultBalance' }, // move from State 2 to State 4
        { action: 'clickExchRate' },
        // Transition 18: click on source result balance and move from State 3 to State 4
        { action: 'clickSrcResultBalance' },

        // Transition 11: select source account with the same currency as destination and move
        //  from State 4 to State 1
        { action: 'changeSrcAccount', data: ACC_USD },
        // Transition 3: click on destination amount block and move from State 1 to State 0
        { action: 'clickDestAmount' },
    ]);

    // Test input values for precise currency
    await Actions.runActions([
        { action: 'changeDestCurrency', data: BTC },
        { action: 'inputDestAmount', data: '0.12345678' },
        { action: 'changeSrcAccount', data: ACC_BTC },
        { action: 'clickSrcResultBalance' },
        { action: 'inputResBalance', data: '555.12345678' },
    ]);

    // Test handling invalid date string on show date picker
    await Actions.runActions([
        { action: 'inputDate', data: '' },
        { action: 'selectDate', data: App.dates.now },
    ]);
};
