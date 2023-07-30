import { setBlock } from 'jezve-test';
import { App } from '../../../Application.js';
import { TRANSFER } from '../../../model/Transaction.js';
import * as Actions from '../../actions/transaction.js';

export const stateLoop = async () => {
    await App.state.fetch();

    const {
        ACC_3,
        ACC_RUB,
        ACC_USD,
        ACC_EUR,
        CARD_RUB,
        ACC_BTC,
    } = App.scenario;

    setBlock('Transfer loop', 2);

    // Navigate to create transfer view
    await Actions.createFromAccount(0);
    await Actions.changeTransactionType(TRANSFER);

    // Input source amount
    await App.scenario.runner.runGroup(Actions.inputSrcAmount, Actions.decimalInputTestStrings);

    // Transition 7: Change destination account to another one with same currency
    //  as source (RUB)
    await Actions.changeDestAccount(ACC_3);
    // Transition 5: Change source account to another one with same currency as
    //  destination (RUB)
    await Actions.changeSrcAccount(ACC_3);
    // Transition 1: Click by source balance and move from State 0 to State 1
    await Actions.clickSrcResultBalance();

    // Input source result balance
    await App.scenario.runner.runGroup(Actions.inputResBalance, Actions.decimalInputTestStrings);

    // Transition 11: Change source account to another one with same currency as destination
    //  and stay on State 1
    await Actions.changeSrcAccount(CARD_RUB);
    // Transition 13: Change destination account to another one with same currency as source
    //  and stay on State 1
    await Actions.changeDestAccount(ACC_3);
    // Transition 9: Click by destination balance and move from State 1 to State 2
    await Actions.clickDestResultBalance();

    // Input destination result balance
    await App.scenario.runner.runGroup(
        Actions.inputDestResBalance,
        Actions.decimalInputTestStrings,
    );

    // Transition 15: Change source account to another one with same currency and stay
    //  on State 2
    await Actions.changeSrcAccount(CARD_RUB);
    // Transition 17: Change destination account to another one with same currency and
    //  stay on State 2
    await Actions.changeDestAccount(CARD_RUB);
    // Transition 16: Change source account to another one with different currency (USD) and
    //  move from State 2 to State 5
    await Actions.changeSrcAccount(ACC_USD);
    // Transition 26: Change source account to another one with different currency (EUR) and
    //  stay on State 5
    await Actions.changeSrcAccount(ACC_EUR);
    // Swap source and destination accounts
    await Actions.swapSourceAndDest();
    await Actions.swapSourceAndDest();
    // Transition 28: Change destination account to another one with different currency and
    //  stay on State 5
    await Actions.changeDestAccount(ACC_3);
    // Transition 27: Change source account to another one with same currency as destination
    //  (RUB) and move from State 5 to State 2
    await Actions.changeSrcAccount(ACC_RUB);
    // Transition 18: Change destination account to another one with different currency than
    //  source (USD) and move from State 2 to State 5
    await Actions.changeDestAccount(ACC_USD);
    // Transition 29: Change destination account to another one with same currency as source
    //  and move from State 5 to State 2
    await Actions.changeDestAccount(ACC_3);
    // Transition 10: Click by source balance and move from State 2 to State 1
    await Actions.clickSrcResultBalance();
    // Transition 2: Click by source amount and move from State 1 to State 0
    await Actions.clickSrcAmount();
    // Transition 6: Change source account to another one with different currency than
    //  destination (USD) and move from State 0 to State 3
    await Actions.changeSrcAccount(ACC_USD);
    // Input different source and destination amount
    await Actions.inputSrcAmount('111');
    await Actions.inputDestAmount('222');
    // Transition 43: Change source account to another one with different currency than
    //  destination (RUB) and stay on State 3
    await Actions.changeSrcAccount(ACC_EUR);
    // Transition 41: Change destination account to another one with same currency as source
    //  (EUR) and stay on State 3
    await Actions.changeDestAccount(ACC_EUR);
    // Transition 44: Change source account to another one with same currency as destination
    //  (EUR -> RUB) and move from State 3 to State 0
    await Actions.changeSrcAccount(ACC_EUR);
    await Actions.changeSrcAccount(ACC_3);
    // Transition 8: Change destination account to another one with different currency than
    //  source (USD) and move from State 0 to State 3
    await Actions.changeDestAccount(ACC_USD);
    // Transition 42: Change destination account to another one with same currency as source
    //  (RUB) and move from State 3 to State 0
    await Actions.changeDestAccount(ACC_RUB);
    // Transition 12: Change source account to another one with different currency than
    //  destination (EUR) and move from State 1 to State 4
    await Actions.clickSrcResultBalance(); // move from State 0 to State 1
    await Actions.changeSrcAccount(ACC_EUR);
    // Transition 36: Change source account to another one with different currency than
    //  destination (USD) and stay on State 4
    await Actions.changeSrcAccount(ACC_RUB);
    // Transition 38: Change destination account to another one with different currency
    //  than source (RUB) and stay on State 4
    await Actions.changeDestAccount(ACC_EUR);
    // Transition 39: Change destination account to another one with same currency as source
    //  (RUB) and move from State 4 to State 1
    await Actions.changeDestAccount(ACC_3);
    // Transition 14: Change destination account to another one with different currency than
    //  source (USD) and move from State 1 to State 4
    await Actions.changeDestAccount(ACC_USD);
    // Transition 32: Click by destination result balance and move from State 4 to State 6
    await Actions.clickDestResultBalance();
    // Transition 49: Change source account to another one with different currency than
    //  destination (EUR) and stay on State 6
    await Actions.changeSrcAccount(ACC_EUR);
    // Transition 47: Change destination account to another one with different currency
    //  than source (RUB) and stay on State 6
    await Actions.changeDestAccount(ACC_3);
    // Transition 20: Click by source amount and move from State 6 to State 5
    await Actions.clickSrcAmount();
    // Transition 19: Click by source result balance and move from State 5 to State 6
    await Actions.clickSrcResultBalance();
    // Transition 45: Click by exchange rate and move from State 6 to State 8
    await Actions.clickExchRate();

    // Input exchange rate
    await App.scenario.runner.runGroup(Actions.inputExchRate, Actions.decimalInputTestStrings);

    // Toggle direction of exchange rate and stay on State 8
    await Actions.toggleExchange();
    // Input back exchange rate
    await App.scenario.runner.runGroup(Actions.inputExchRate, Actions.decimalInputTestStrings);
    // Toggle direction of exchange rate and stay on State 8
    await Actions.toggleExchange();

    // Transition 51: Change source account to another one with different currency than
    //  destination (USD) and stay on State 6
    await Actions.changeSrcAccount(ACC_USD);
    // Transition 53: Change destination account to another one with different currency
    //  than source (EUR) and stay on State 6
    await Actions.changeDestAccount(ACC_EUR);
    // Transition 23: Click by source amount and move from State 8 to State 7
    await Actions.clickSrcAmount();
    // Transition 57: Change source account to another one with different currency than
    //  destination (RUB) and stay on State 7
    await Actions.changeSrcAccount(ACC_3);
    // Transition 59: Change destination account to another one with different currency
    //  than source (USD) and stay on State 7
    await Actions.changeDestAccount(ACC_USD);
    // Transition 22: Click by source result balance and move from State 7 to State 8
    await Actions.clickSrcResultBalance();
    // Transition 46: Click by destination result balance and move from State 8 to State 6
    await Actions.clickDestResultBalance();
    // Transition 33: Click by destination amount and move from State 6 to State 4
    await Actions.clickDestAmount();
    // Transition 37: Change source account to another one with same currency as destination
    //  (RUB) and from State 4 to State 1
    await Actions.changeSrcAccount(ACC_EUR); // change source to EUR first
    await Actions.changeDestAccount(CARD_RUB); // change destination to RUB
    await Actions.changeSrcAccount(ACC_3);
    // Transition 21: Click by exchange rate and move from State 5 to State 7
    await Actions.clickSrcAmount(); // move from State 1 to State 0
    await Actions.clickDestResultBalance(); // move from State 0 to State 2
    await Actions.changeDestAccount(ACC_USD); // move from State 2 to State 5
    await Actions.clickExchRate(); // move from State 5 to State 7
    // Transition 55: Click by destination amount and move from State 7 to State 3
    await Actions.clickDestAmount();
    // Transition 25: Click by destination result balance and move from State 3 to State 5
    await Actions.clickDestResultBalance();
    // Transition 56: Click by destination result balance and move from State 7 to State 5
    await Actions.clickExchRate(); // move from State 5 to State 7
    await Actions.clickDestResultBalance();
    // Transition 24: Click by destination amount and move from State 5 to State 3
    await Actions.clickDestAmount();
    // Transition 40: Click by exchange rate and move from State 3 to State 7
    await Actions.clickExchRate();
    // Transition 60: Change destination account to another one with same currency as source
    //  (RUB) and move from State 7 to State 0
    await Actions.changeDestAccount(ACC_RUB);
    // Transition 58: Change source account to another one with same currency as destination
    //  (RUB) and from State 7 to State 0
    await Actions.clickDestResultBalance(); // move from State 0 to State 2
    await Actions.changeSrcAccount(ACC_USD); // move from State 2 to State 5
    await Actions.clickExchRate(); // move from State 5 to State 7
    await Actions.changeSrcAccount(ACC_3);
    // Transition 30: Click by source amount and move from State 4 to State 3
    await Actions.clickSrcResultBalance(); // move from State 0 to State 1
    await Actions.changeSrcAccount(ACC_EUR); // move from State 1 to State 4
    await Actions.clickSrcAmount();
    // Transition 31: Click by source result balance and move from State 3 to State 4
    await Actions.clickSrcResultBalance();
    // Transition 34: Click by exchange rate and move from State 4 to State 8
    await Actions.clickExchRate();
    // Transition 35: Click by destination amount and move from State 8 to State 4
    await Actions.clickDestAmount();
    // Transition 52: Change source account to another one with same currency as destination
    //  (RUB) and from State 8 to State 1
    await Actions.clickExchRate(); // move from State 4 to State 8
    await Actions.changeSrcAccount(ACC_3);
    // Transition 54: Change destination account to another one with same currency as source
    //  (RUB) and move from State 8 to State 1
    await Actions.changeDestAccount(ACC_USD); // move from State 1 to State 4
    await Actions.clickExchRate(); // move from State 4 to State 8
    await Actions.changeDestAccount(ACC_RUB);
    // Transition 50: Change source account to another one with same currency as destination
    //  (RUB) and from State 6 to State 1
    await Actions.changeSrcAccount(ACC_USD); // move from State 1 to State 4
    await Actions.clickDestResultBalance(); // move from State 4 to State 6
    await Actions.changeSrcAccount(ACC_3);
    // Transition 48: Change destination account to another one with same currency as source
    //  (RUB) and move from State 1 to State 2
    await Actions.changeDestAccount(ACC_USD); // move from State 1 to State 4
    await Actions.clickDestResultBalance(); // move from State 4 to State 6
    await Actions.changeDestAccount(ACC_RUB);
    // Test input values for precise currency
    await Actions.changeDestAccount(ACC_BTC);
    await Actions.clickDestAmount();
    await Actions.inputDestAmount('0.12345678');
    await Actions.clickDestResultBalance();
    await Actions.inputDestResBalance('555.12345678');

    // Test handling invalid date string on show date picker
    await Actions.inputDate('');
    await Actions.selectDate(App.dates.now);
};
