import { setBlock } from 'jezve-test';
import { App } from '../../../Application.js';
import { INCOME } from '../../../model/Transaction.js';
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

    setBlock('Income loop', 2);

    // Navigate to create income view
    await Actions.createFromAccount(0);
    await Actions.changeTransactionType(INCOME);

    // Input source amount
    await App.scenario.runner.runGroup(Actions.inputSrcAmount, Actions.decimalInputTestStrings);

    // Transition 2: Click on destination result balance block and move from State 0 to State 1
    await Actions.clickDestResultBalance();
    // Transition 23: Change account to another one with different currency and stay on State 1
    await Actions.changeDestAccount(ACC_EUR);
    await Actions.changeDestAccount(ACC_3);

    // Input result balance
    await App.scenario.runner.runGroup(
        Actions.inputDestResBalance,
        Actions.decimalInputTestStrings,
    );

    // Transition 4: Click on source amount block and move from State 1 to State 0
    await Actions.clickSrcAmount();
    // Transition 3: Change source currency to different than currency of account and move
    //  from State 0 to State 2
    await Actions.changeSourceCurrency(USD);
    // Transition 5: Change account to another one with currency different than current source
    //  currency and stay on State 2
    await Actions.changeDestAccount(ACC_EUR);
    await Actions.changeDestAccount(ACC_3);

    // Input destination amount
    await App.scenario.runner.runGroup(Actions.inputDestAmount, Actions.decimalInputTestStrings);

    // Transition 7: Click on result balance block and move from State 2 to State 4
    await Actions.clickDestResultBalance();
    // Transition 17: Change account to another one with currency different than current
    //  source currency and stay on State 4
    await Actions.changeDestAccount(ACC_EUR);
    await Actions.changeDestAccount(ACC_3);
    // Transition 21: Change source currency to different than currency of account and stay
    //  on State 4
    await Actions.changeSourceCurrency(EUR);
    await Actions.changeSourceCurrency(USD);
    // Transition 20: Click on exchange rate block and move from State 4 to State 3
    await Actions.clickExchRate();
    // Transition 14: Click on exchange rate block and move from State 4 to State 3
    await Actions.clickDestResultBalance();
    // Transition 19: Click on destination amount block and move from State 4 to State 3
    await Actions.clickDestAmount();
    // Transition 8: Click on exchange rate block and move from State 2 to State 3
    await Actions.clickExchRate();

    // Input exchange rate
    await App.scenario.runner.runGroup(Actions.inputExchRate, Actions.decimalInputTestStrings);

    // Toggle direction of exchange rate and stay on State 3
    await Actions.toggleExchange();
    // Input back exchange rate
    await App.scenario.runner.runGroup(Actions.inputExchRate, Actions.decimalInputTestStrings);
    // Toggle direction of exchange rate and stay on State 3
    await Actions.toggleExchange();

    // Transition 13: Click on destination amount block and move from State 3 to State 2
    await Actions.clickDestAmount();
    // Transition 9: change source currency to different than currency of account and
    //  stay on State 2
    await Actions.changeSourceCurrency(EUR);
    // Transition 10: Change source currency to the same as currency of account and
    //  move from State 2 to State 0
    await Actions.changeSourceCurrency(RUB);
    // Transition 11: Change destination account to another with currency different
    //  currest source currency
    await Actions.changeSourceCurrency(USD); // move from State 0 to State 2
    await Actions.clickExchRate(); // move from State 2 to State 3
    await Actions.changeDestAccount(ACC_EUR);
    // Transition 12: Change destination account to another one with same currency as
    //  currest source currency
    await Actions.changeDestAccount(ACC_USD);
    // Transition 15: Change source currency to different than currency of account and
    //  stay on State 3
    await Actions.changeSourceCurrency(RUB); // move from State 0 to State 2
    await Actions.clickExchRate(); // move from State 2 to State 3
    await Actions.changeSourceCurrency(EUR);
    // Transition 16: Change source currency to different than currency of account
    //  and stay on State 3
    await Actions.changeSourceCurrency(USD);
    // Transition 18: Change destination account to another one with same currency as currest
    //  source currency and move from State 4 to State 1
    await Actions.changeSourceCurrency(RUB); // move from State 0 to State 2
    await Actions.clickDestResultBalance(); // move from State 2 to State 4
    await Actions.changeDestAccount(ACC_RUB);
    // Transition 6: Change destination account to another one with same currency as currest
    //  source currency
    await Actions.clickSrcAmount(); // move from State 1 to State 0
    await Actions.changeSourceCurrency(USD); // move from State 0 to State 2
    await Actions.changeDestAccount(ACC_USD);
    // Transition 1: Change destination account to another one with same currency as currest
    //  source currency
    await Actions.changeDestAccount(ACC_3);
    // Transition 22: Change source currency to the same as currency of account and move from
    //  State 4 to State 1
    await Actions.changeSourceCurrency(USD); // move from State 0 to State 2
    await Actions.clickDestResultBalance(); // move from State 2 to State 4
    await Actions.changeSourceCurrency(RUB);
    // Transition 4: Click on source amount block and move from State 1 to State 0
    await Actions.clickSrcAmount();

    // Test input values for precise currency
    await Actions.changeSourceCurrency(BTC);
    await Actions.inputSrcAmount('0.12345678');
    await Actions.changeDestAccount(ACC_BTC);
    await Actions.clickDestResultBalance();
    await Actions.inputDestResBalance('555.12345678');

    // Test handling invalid date string on show date picker
    await Actions.inputDate('');
    await Actions.selectDate(App.dates.now);
};
