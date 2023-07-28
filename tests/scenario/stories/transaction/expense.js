import { setBlock } from 'jezve-test';
import { App } from '../../../Application.js';
import * as Actions from '../../actions/transaction.js';

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

    setBlock('Expense loop', 2);

    // Navigate to create expense view
    await Actions.createFromAccount(0);

    // Input destination amount
    await App.scenario.runner.runGroup(Actions.inputDestAmount, Actions.decimalInputTestStrings);

    // Transition 2: click on result balance block and move from State 0 to State 1
    await Actions.clickSrcResultBalance();

    // Input result balance
    await App.scenario.runner.runGroup(Actions.inputResBalance, Actions.decimalInputTestStrings);

    // Transition 12: change account to another one with different currency and stay on State 1
    await Actions.changeSrcAccount(ACC_USD);
    // Change account back
    await Actions.changeSrcAccount(ACC_3);
    // Transition 3: click on destination amount block and move from State 1 to State 0
    await Actions.clickDestAmount();
    // Transition 4: select different currency for destination and move from State 0 to State 2
    await Actions.changeDestCurrency(USD);

    // Input source amount
    await App.scenario.runner.runGroup(Actions.inputSrcAmount, Actions.decimalInputTestStrings);

    // Transition 8: click on exchange rate block and move from State 2 to State 3
    await Actions.clickExchRate();

    // Input exchange rate
    await App.scenario.runner.runGroup(Actions.inputExchRate, Actions.decimalInputTestStrings);

    // Toggle direction of exchange rate and stay on State 3
    await Actions.toggleExchange();
    // Input back exchange rate
    await App.scenario.runner.runGroup(Actions.inputExchRate, Actions.decimalInputTestStrings);
    // Toggle direction of exchange rate and stay on State 3
    await Actions.toggleExchange();

    // Transition 16: click on destination amount block and move from State 3 to State 2
    await Actions.clickDestAmount();
    // Transition 13: select another currency different from currency of source account
    //  and stay on state 2
    await Actions.changeDestCurrency(EUR);
    // Transition 9: select same currency as source account and move from State 2 to State 0
    await Actions.changeDestCurrency(RUB);
    // Transition 1: change account to another one with different currency and stay on State 0
    await Actions.changeSrcAccount(ACC_USD);
    // Transition 5: change account to another one with currency different than current
    //  destination currency and stay on State 2
    await Actions.changeDestCurrency(EUR);
    await Actions.changeSrcAccount(ACC_3);
    // Transition 6: click on source result balance block and move from State 2 to State 4
    await Actions.clickSrcResultBalance();
    // Transition 10: change account to another one with currency different than current
    //  destination currency and stay on State 4
    await Actions.changeSrcAccount(ACC_USD);
    // Transition 7: click on destination amount block and move from State 4 to State 2
    await Actions.clickDestAmount();
    // Transition 14: select source account with the same currency as destination and move
    //  from State 2 to State 0
    await Actions.changeSrcAccount(ACC_EUR);
    // Transition 17: change account to another one with currency different than current
    //  destination currency and stay on State 3
    await Actions.changeDestCurrency(RUB);
    await Actions.clickExchRate();
    await Actions.changeSrcAccount(ACC_USD);
    // Transition 15: select source account with the same currency as destination and move
    //  from State 2 to State 0
    await Actions.changeSrcAccount(ACC_RUB);
    // Transition 19: click on exchange rate block and move from State 4 to State 3
    await Actions.changeDestCurrency(USD); // move from State 0 to State 2
    await Actions.clickSrcResultBalance(); // move from State 2 to State 4
    await Actions.clickExchRate();
    // Transition 18: click on source result balance and move from State 3 to State 4
    await Actions.clickSrcResultBalance();

    // Transition 11: select source account with the same currency as destination and move
    //  from State 4 to State 1
    await Actions.changeSrcAccount(ACC_USD);
    // Transition 3: click on destination amount block and move from State 1 to State 0
    await Actions.clickDestAmount();

    // Test input values for precise currency
    await Actions.changeDestCurrency(BTC);
    await Actions.inputDestAmount('0.12345678');
    await Actions.changeSrcAccount(ACC_BTC);
    await Actions.clickSrcResultBalance();
    await Actions.inputResBalance('555.12345678');

    // Test handling invalid date string on show date picker
    await Actions.inputDate('');
    await Actions.selectDate(App.dates.now);
};
