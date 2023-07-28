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
        CARD_RUB,
        MARIA,
        IVAN,
    } = App.scenario;

    setBlock('Debt loop', 2);

    // Navigate to create debt view
    await Actions.createFromPerson(0);

    // Input source amount
    await App.scenario.runner.runGroup(Actions.inputSrcAmount, Actions.decimalInputTestStrings);

    // Transition 1: Click by source result balance and move from State 0 to State 1
    await Actions.clickSrcResultBalance();
    // Transition 47: Change to another one and stay on State 1
    await Actions.changeAccount(ACC_RUB);

    // Input source result balance
    await App.scenario.runner.runGroup(Actions.inputResBalance, Actions.decimalInputTestStrings);

    // Transition 2: Click by source amount and move from State 1 to State 0
    await Actions.clickSrcAmount();
    // Transition 3: Click by destination result balance and move from State 0 to State 2
    await Actions.clickDestResultBalance();
    // Transition 42: Change to another one and stay on State 2
    await Actions.changeAccount(ACC_USD);

    // Input destination result balance
    await App.scenario.runner.runGroup(
        Actions.inputDestResBalance,
        Actions.decimalInputTestStrings,
    );

    // Transition 4: Click by source result balance and move from State 2 to State 1
    await Actions.clickSrcResultBalance();
    // Transition 5: Click by destination result balance and move from State 1 to State 2
    await Actions.clickDestResultBalance();
    // Transition 6: Click by source amount and move from State 2 to State 0
    await Actions.clickSrcAmount();
    // Transition 7: Change debt type to "take" and move from State 0 to State 3
    await Actions.swapSourceAndDest();
    // Transition 8: Change debt type back to "give" and move from State 3 to State 0
    await Actions.swapSourceAndDest();
    // Transition 49: Change to another one and stay on State 3
    await Actions.swapSourceAndDest(); // move from State 0 to State 3
    await Actions.changeAccount(ACC_EUR);
    // Transition 9: Click by destination result balance and move from State 3 to State 4
    await Actions.clickDestResultBalance();
    // Transition 51: Change to another one and stay on State 4
    await Actions.changeAccount(CARD_RUB);
    // Transition 10: Click by destination amount and move from State 4 to State 3
    await Actions.clickDestAmount();
    // Transition 11: Click by source result balance and move from State 4 to State 5
    await Actions.clickDestResultBalance(); // move from State 3 to State 4
    await Actions.clickSrcResultBalance();
    // Transition 48: Change to another one and stay on State 5
    await Actions.changeAccount(ACC_3);
    // Transition 12: Click by destination amount and move from State 5 to State 3
    await Actions.clickDestAmount();
    // Transition 13: Click by source result balance and move from State 3 to State 5
    await Actions.clickSrcResultBalance();
    // Transition 14: Click by destination result balance and move from State 5 to State 4
    await Actions.clickDestResultBalance();
    // Transition 15: Change debt type to "give" and move from State 4 to State 1
    await Actions.swapSourceAndDest();
    // Transition 16: Change debt type to "take" and move from State 1 to State 4
    await Actions.swapSourceAndDest();
    // Transition 17: Change debt type to "give" and move from State 5 to State 2
    await Actions.clickSrcResultBalance(); // move from State 4 to State 5
    await Actions.swapSourceAndDest();
    // Transition 18: Change debt type to "take" and move from State 2 to State 5
    await Actions.swapSourceAndDest();
    // Transition 19: Change person to another one and stay on State 0
    await Actions.clickDestAmount(); // move from State 5 to State 3
    await Actions.swapSourceAndDest(); // move from State 3 to State 0
    await Actions.changePerson(IVAN);
    // Transition 20: Change person to another one and stay on State 1
    await Actions.clickSrcResultBalance(); // move from State 0 to State 1
    await Actions.changePerson(MARIA);
    // Transition 21: Change person to another one and stay on State 2
    await Actions.clickDestResultBalance(); // move from State 1 to State 2
    await Actions.changePerson(IVAN);
    // Transition 22: Change person to another one and stay on State 5
    await Actions.swapSourceAndDest(); // move from State 2 to State 5
    await Actions.changePerson(MARIA);
    // Transition 23: Change person to another one and stay on State 4
    await Actions.clickDestResultBalance(); // move from State 5 to State 4
    await Actions.changePerson(IVAN);
    // Transition 24: Change person to another one and stay on State 3
    await Actions.clickDestAmount(); // move from State 4 to State 3
    await Actions.changePerson(MARIA);
    // Transition 25: Disable account and move from State 0 to State 6
    await Actions.swapSourceAndDest(); // move from State 3 to State 0
    await Actions.toggleAccount();
    // Transition 43: Change person to another one and stay on State 6
    await Actions.changePerson(IVAN);
    // Transition 26: Enable account and move from State 6 to State 0
    await Actions.toggleAccount();
    // Transition 27: Change debt type to "take" and move from State 6 to State 7
    await Actions.toggleAccount(); // move from State 0 to State 6
    await Actions.swapSourceAndDest();
    // Transition 44: Change person to another one and stay on State 7
    await Actions.changePerson(MARIA);
    // Transition 28: Change debt type to "give" and move from State 7 to State 6
    await Actions.swapSourceAndDest();
    // Transition 29: Enable account and move from State 7 to State 3
    await Actions.swapSourceAndDest(); // move from State 6 to State 7
    await Actions.toggleAccount();
    // Transition 30: Click by destination result balance and move from State 7 to State 8
    await Actions.swapSourceAndDest(); // move from State 3 to State 0
    await Actions.toggleAccount(); // move from State 0 to State 6
    await Actions.swapSourceAndDest(); // move from State 6 to State 7
    await Actions.clickDestResultBalance();
    // Transition 45: Change person to another one and stay on State 8
    await Actions.changePerson(IVAN);
    // Transition 31: Click by destination amount and move from State 8 to State 7
    await Actions.clickDestAmount();
    // Transition 32: Enable account and move from State 8 to State 4
    await Actions.clickDestResultBalance(); // move from State 7 to State 8
    await Actions.toggleAccount();
    // Transition 39: Disable account and move from State 4 to State 8
    await Actions.toggleAccount();
    // Transition 33: Change debt type to "give" and move from State 8 to State 9
    await Actions.swapSourceAndDest();
    // Transition 46: Change person to another one and stay on State 9
    await Actions.changePerson(MARIA);
    // Transition 34: Change debt type to "take" and move from State 9 to State 8
    await Actions.swapSourceAndDest();
    // Transition 35: Click by source amount and move from State 9 to State 6
    await Actions.changePerson(IVAN); // stay on State 8
    await Actions.swapSourceAndDest(); // move from State 8 to State 9
    await Actions.clickSrcAmount();
    // Transition 36: Click by source result balance and move from State 6 to State 9
    await Actions.clickSrcResultBalance();
    // Transition 37: Enable account and move from State 9 to State 1
    await Actions.toggleAccount();
    // Transition 38: Disable account and move from State 1 to State 9
    await Actions.toggleAccount();
    // Transition 40: Disable account and move from State 3 to State 7
    await Actions.clickSrcAmount(); // move from State 9 to State 6
    await Actions.toggleAccount(); // move from State 6 to State 0
    await Actions.swapSourceAndDest(); // move from State 0 to State 3
    await Actions.toggleAccount();
    // Transition 41: Disable account and move from State 2 to State 6
    await Actions.swapSourceAndDest(); // move from State 7 to State 6
    await Actions.toggleAccount(); // move from State 6 to State 0
    await Actions.clickDestResultBalance(); // move from State 0 to State 2
    await Actions.toggleAccount();
    // Transition 52: Select another account and stay on State 0
    await Actions.toggleAccount(); // move from State 6 to State 0
    await Actions.changeAccount(ACC_USD);
    // Transition 50: Disable account and move from State 5 to State 7
    await Actions.clickDestResultBalance(); // move from State 0 to State 2
    await Actions.swapSourceAndDest(); // move from State 2 to State 5
    await Actions.toggleAccount();

    // Transition 53: Change source currency to another one different from currency of
    // source account and move from State 0 to State 10
    setBlock('Transition 74', 2);
    await Actions.toggleAccount(); // move from State 7 to State 3
    await Actions.swapSourceAndDest(); // move from State 3 to State 0
    await Actions.changeSourceCurrency(EUR);

    // Transition 54: Change source currency to currency of source account and move
    // from State 10 to State 0
    setBlock('Transition 54', 2);
    await Actions.changeSourceCurrency(USD);

    // Transition 55: Click by source result and move from State 10 to State 11
    setBlock('Transition 55', 2);
    await Actions.changeSourceCurrency(EUR); // move from State 0 to State 10
    await Actions.clickSrcResultBalance();

    // Transition 56: Click by source amount and move from State 11 to State 10
    setBlock('Transition 56', 2);
    await Actions.clickSrcAmount();

    // Transition 57: Click by exchange and move from State 10 to State 12
    setBlock('Transition 57', 2);
    await Actions.clickExchRate();

    // Input exchange rate
    await App.scenario.runner.runGroup(Actions.inputExchRate, Actions.decimalInputTestStrings);
    // Toggle direction of exchange rate and stay on State 12
    await Actions.toggleExchange();
    // Input back exchange rate
    await App.scenario.runner.runGroup(Actions.inputExchRate, Actions.decimalInputTestStrings);
    // Toggle direction of exchange rate and stay on State 12
    await Actions.toggleExchange();

    // Transition 58: Click by destination amount and move from State 12 to State 10
    setBlock('Transition 58', 2);
    await Actions.clickDestAmount();

    // Input destination amount
    await App.scenario.runner.runGroup(Actions.inputDestAmount, Actions.decimalInputTestStrings);

    // Transition 59: Click by destination result and move from State 10 to State 15
    setBlock('Transition 59', 2);
    await Actions.clickDestResultBalance();

    // Transition 60: Click by destination amount and move from State 15 to State 10
    setBlock('Transition 60', 2);
    await Actions.clickDestAmount();

    // Transition 61: Disable account and move from State 10 to State 6
    setBlock('Transition 61', 2);
    await Actions.toggleAccount();

    // Transition 137: Select account with same currency as person account
    //  and move from State 10 to State 0
    setBlock('Transition 137', 2);
    await Actions.toggleAccount(); // move from State 6 to State 0
    await Actions.changeSourceCurrency(RUB); // move from State 0 to State 10
    await Actions.changeAccount(ACC_RUB);

    // Transition 63: Click by destination result and move from State 11 to State 14
    setBlock('Transition 63', 2);
    await Actions.changeSourceCurrency(EUR); // move from State 0 to State 10
    await Actions.clickSrcResultBalance(); // move from State 10 to State 11
    await Actions.clickDestResultBalance();

    // Transition 64: Click by destination amount and move from State 14 to State 11
    setBlock('Transition 64', 2);
    await Actions.clickDestAmount();

    // Transition 65: Click by exchange and move from State 11 to State 13
    setBlock('Transition 65', 2);
    await Actions.clickExchRate();

    // Transition 66: Click by destination amount and move from State 13 to State 11
    setBlock('Transition 66', 2);
    await Actions.clickDestAmount();

    // Transition 67: Select account with same currency as person account
    //  and move from State 11 to State 1
    setBlock('Transition 67', 2);
    await Actions.changeAccount(ACC_EUR);

    // Transition 69: Disable account and move from State 11 to State 9
    setBlock('Transition 69', 2);
    await Actions.clickSrcAmount(); // move from State 1 to State 0
    await Actions.changeSourceCurrency(USD); // from State 0 to State 10
    await Actions.clickSrcResultBalance(); // move from State 10 to State 11
    await Actions.toggleAccount();

    // Transition 71: Click by source result and move from State 12 to State 13
    setBlock('Transition 71', 2);
    await Actions.toggleAccount(); // move from State 9 to State 1
    await Actions.clickSrcAmount(); // move from State 1 to State 0
    await Actions.changeSourceCurrency(USD); // move from State 0 to State 10
    await Actions.clickExchRate(); // move from State 10 to State 12
    await Actions.clickSrcResultBalance();

    // Transition 72: Click by source amount and move from State 13 to State 12
    setBlock('Transition 72', 2);
    await Actions.clickSrcAmount();

    // Transition 73: Click by destination result and move from State 12 to State 15
    setBlock('Transition 73', 2);
    await Actions.clickDestResultBalance();

    // Transition 74: Click by exchange and move from State 15 to State 12
    setBlock('Transition 74', 2);
    await Actions.clickExchRate();

    // Transition 75: Select account with same currency as person account and
    // move from State 12 to State 0
    setBlock('Transition 75', 2);
    await Actions.changeAccount(ACC_USD);

    // Transition 76: Change source currency same as currency of account
    //  and move from State 12 to State 0
    setBlock('Transition 76', 2);
    await Actions.changeSourceCurrency(EUR); // move from State 0 to State 10
    await Actions.clickExchRate(); // move from State 10 to State 12
    await Actions.changeSourceCurrency(USD);

    // Transition 77: Disable account and move from State 12 to State 6
    setBlock('Transition 77', 2);
    await Actions.changeSourceCurrency(RUB); // from State 0 to State 10
    await Actions.clickExchRate(); // move from State 10 to State 12
    await Actions.toggleAccount();

    // Transition 78: Click by destination result and move from State 13 to State 14
    setBlock('Transition 78', 2);
    await Actions.toggleAccount(); // move from State 6 to State 0
    await Actions.changeSourceCurrency(EUR); // move from State 0 to State 10
    await Actions.clickExchRate(); // move from State 10 to State 12
    await Actions.clickSrcResultBalance(); // move from State 12 to State 13
    await Actions.clickDestResultBalance();

    // Transition 79: Click by exchange and move from State 14 to State 13
    setBlock('Transition 79', 2);
    await Actions.clickExchRate();

    // Transition 80: Select account with same currency as person account and
    // move from State 13 to State 1
    setBlock('Transition 80', 2);
    await Actions.changeAccount(ACC_EUR);

    // Transition 81: Disable account and move from State 13 to State 9
    setBlock('Transition 81', 2);
    await Actions.clickSrcAmount(); // move from State 1 to State 0
    await Actions.changeSourceCurrency(USD); // from State 0 to State 10
    await Actions.clickExchRate(); // move from State 10 to State 12
    await Actions.clickSrcResultBalance(); // move from State 12 to State 13
    await Actions.toggleAccount();

    // Transition 82: Click by source amount and move from State 14 to State 15
    setBlock('Transition 82', 2);
    await Actions.toggleAccount(); // move from State 9 to State 1
    await Actions.clickSrcAmount(); // move from State 1 to State 0
    await Actions.changeSourceCurrency(RUB); // move from State 0 to State 10
    await Actions.clickSrcResultBalance(); // move from State 10 to State 11
    await Actions.clickDestResultBalance(); // move from State 11 to State 14
    await Actions.clickSrcAmount();

    // Transition 83: Click by source result and move from State 15 to State 14
    setBlock('Transition 83', 2);
    await Actions.clickSrcResultBalance();

    // Transition 84: Select account with same currency as person account and
    // move from State 14 to State 1
    setBlock('Transition 84', 2);
    await Actions.changeAccount(ACC_RUB);

    // Transition 85: Disable account and move from State 14 to State 9
    setBlock('Transition 85', 2);
    await Actions.clickSrcAmount(); // move from State 1 to State 0
    await Actions.changeSourceCurrency(EUR); // move from State 0 to State 10
    await Actions.clickSrcResultBalance(); // move from State 10 to State 11
    await Actions.clickDestResultBalance(); // move from State 11 to State 14
    await Actions.toggleAccount();

    // Transition 86: Change source currency same as currency of account
    //  and move from State 15 to State 0
    setBlock('Transition 86', 2);
    await Actions.toggleAccount(); // move from State 9 to State 1
    await Actions.clickSrcAmount(); // move from State 1 to State 0
    await Actions.changeSourceCurrency(USD); // move from State 0 to State 10
    await Actions.clickDestResultBalance(); // move from State 10 to State 15
    await Actions.changeSourceCurrency(RUB);

    // Transition 87: Select account with same currency as person account
    //  and move from State 15 to State 0
    setBlock('Transition 87', 2);
    await Actions.changeSourceCurrency(USD); // move from State 0 to State 10
    await Actions.clickDestResultBalance(); // move from State 10 to State 15
    await Actions.changeAccount(ACC_USD);

    // Transition 88: Disable account and move from State 15 to State 6
    setBlock('Transition 88', 2);
    await Actions.changeSourceCurrency(RUB); // move from State 0 to State 10
    await Actions.clickDestResultBalance(); // move from State 10 to State 15
    await Actions.toggleAccount();

    // Transition 96: Select destination currency different from currency of account
    //  and move from State 3 to State 16
    setBlock('Transition 96', 2);
    await Actions.toggleAccount(); // move from State 6 to State 0
    await Actions.swapSourceAndDest(); // move from State 0 to State 3
    await Actions.changeDestCurrency(EUR);

    // Transition 89: Click by source result and move from State 16 to State 21
    setBlock('Transition 89', 2);
    await Actions.clickSrcResultBalance();

    // Transition 90: Click by source amount and move from State 21 to State 16
    setBlock('Transition 90', 2);
    await Actions.clickSrcAmount();

    // Transition 91: Click by destination result and move from State 16 to State 17
    setBlock('Transition 91', 2);
    await Actions.clickDestResultBalance();

    // Transition 92: Click by destination amount and move from State 17 to State 16
    setBlock('Transition 92', 2);
    await Actions.clickDestAmount();

    // Transition 93: Click by exchange and move from State 16 to State 18
    setBlock('Transition 93', 2);
    await Actions.clickExchRate();

    // Transition 94: Click by source amount and move from State 18 to State 16
    setBlock('Transition 94', 2);
    await Actions.clickSrcAmount();

    // Transition 95: Select destination currency same as currency of account
    //  and move from State 16 to State 3
    setBlock('Transition 95', 2);
    await Actions.changeDestCurrency(USD);

    // Transition 97: Disable account and move from State 16 to State 7
    setBlock('Transition 97', 2);
    await Actions.changeDestCurrency(EUR); // move from State 3 to State 16
    await Actions.toggleAccount();

    // Transition 139: Select account with same currency as person account
    //  and move from State 16 to State 3
    setBlock('Transition 139', 2);
    await Actions.toggleAccount(); // move from State 7 to State 3
    await Actions.changeDestCurrency(RUB); // move from State 3 to State 16
    await Actions.changeAccount(ACC_RUB);

    // Transition 99: Click by source result and move from State 17 to State 20
    setBlock('Transition 99', 2);
    await Actions.changeDestCurrency(EUR); // move from State 3 to State 16
    await Actions.clickDestResultBalance(); // move from State 16 to State 17
    await Actions.clickSrcResultBalance();

    // Transition 100: Click by source amount and move from State 20 to State 17
    setBlock('Transition 100', 2);
    await Actions.clickSrcAmount();

    // Transition 101: Click by exchange and move from State 17 to State 19
    setBlock('Transition 101', 2);
    await Actions.clickExchRate();

    // Transition 102: Click by source amount and move from State 19 to State 17
    setBlock('Transition 102', 2);
    await Actions.clickSrcAmount();

    // Transition 103: Select account with same currency as person account
    //  and move from State 17 to State 4
    setBlock('Transition 103', 2);
    await Actions.changeAccount(ACC_EUR);

    // Transition 105: Disable account and move from State 17 to State 8
    setBlock('Transition 105', 2);
    await Actions.clickDestAmount(); // move from State 4 to State 3
    await Actions.changeDestCurrency(RUB); // move from State 3 to State 16
    await Actions.clickDestResultBalance(); // move from State 16 to State 17
    await Actions.toggleAccount();

    // Transition 107: Click by destination result and move from State 18 to State 19
    setBlock('Transition 107', 2);
    await Actions.toggleAccount(); // move from State 8 to State 4
    await Actions.clickDestAmount(); // move from State 4 to State 3
    await Actions.changeDestCurrency(USD); // move from State 3 to State 16
    await Actions.clickExchRate(); // move from State 16 to State 18
    await Actions.clickDestResultBalance();

    // Transition 108: Click by destination amount and move from State 19 to State 18
    setBlock('Transition 108', 2);
    await Actions.clickDestAmount();

    // Transition 109: Click by source result and move from State 18 to State 21
    setBlock('Transition 109', 2);
    await Actions.clickSrcResultBalance();

    // Transition 110: Click by exchange and move from State 21 to State 18
    setBlock('Transition 110', 2);
    await Actions.clickExchRate();

    // Transition 111: Select destination currency same as currency of account
    //  and move from State 18 to State 3
    setBlock('Transition 111', 2);
    await Actions.changeDestCurrency(EUR);

    // Transition 112: Select account with same currency as person account
    //  and move from State 18 to State 3
    setBlock('Transition 112', 2);
    await Actions.changeDestCurrency(USD); // move from State 3 to State 16
    await Actions.clickExchRate(); // move from State 16 to State 18
    await Actions.changeAccount(ACC_USD);

    // Transition 113: Disable account and move from State 18 to State 7
    setBlock('Transition 113', 2);
    await Actions.changeDestCurrency(RUB); // move from State 3 to State 16
    await Actions.clickExchRate(); // move from State 16 to State 18
    await Actions.toggleAccount();

    // Transition 114: Click by source result and move from State 19 to State 20
    setBlock('Transition 114', 2);
    await Actions.toggleAccount(); // move from State 7 to State 3
    await Actions.changeDestCurrency(EUR); // move from State 3 to State 16
    await Actions.clickExchRate(); // move from State 16 to State 18
    await Actions.clickDestResultBalance(); // move from State 18 to State 19
    await Actions.clickSrcResultBalance();

    // Transition 115: Click by exchange and move from State 20 to State 19
    setBlock('Transition 115', 2);
    await Actions.clickExchRate();

    // Transition 116: Select account with same currency as person account
    //  and move from State 19 to State 4
    setBlock('Transition 116', 2);
    await Actions.changeAccount(ACC_EUR);

    // Transition 117: Disable account and move from State 19 to State 8
    setBlock('Transition 117', 2);
    await Actions.clickDestAmount(); // move from State 4 to State 3
    await Actions.changeDestCurrency(RUB); // move from State 3 to State 16
    await Actions.clickDestResultBalance(); // move from State 16 to State 17
    await Actions.clickExchRate(); // move from State 17 to State 19
    await Actions.toggleAccount();

    // Transition 118: Click by destination amount and move from State 20 to State 21
    setBlock('Transition 118', 2);
    await Actions.toggleAccount(); // move from State 8 to State 4
    await Actions.clickDestAmount(); // move from State 4 to State 3
    await Actions.changeDestCurrency(USD); // move from State 3 to State 16
    await Actions.clickDestResultBalance(); // move from State 16 to State 17
    await Actions.clickSrcResultBalance(); // move from State 17 to State 20
    await Actions.clickDestAmount();

    // Transition 119: Click by destination result and move from State 21 to State 20
    setBlock('Transition 119', 2);
    await Actions.clickDestResultBalance();

    // Transition 120: Select account with same currency as person account
    //  and move from State 20 to State 4
    setBlock('Transition 120', 2);
    await Actions.changeAccount(ACC_USD);

    // Transition 121: Disable account and move from State 20 to State 8
    setBlock('Transition 121', 2);
    await Actions.clickDestAmount(); // move from State 4 to State 3
    await Actions.changeDestCurrency(RUB); // move from State 3 to State 16
    await Actions.clickDestResultBalance(); // move from State 16 to State 17
    await Actions.clickSrcResultBalance(); // move from State 17 to State 20
    await Actions.toggleAccount();

    // Transition 122: Select destination currency same as currency of account
    //  and move from State 21 to State 3
    setBlock('Transition 122', 2);
    await Actions.toggleAccount(); // move from State 8 to State 4
    await Actions.clickDestAmount(); // move from State 4 to State 3
    await Actions.changeDestCurrency(EUR); // move from State 3 to State 16
    await Actions.clickSrcResultBalance(); // move from State 16 to State 21
    await Actions.changeDestCurrency(USD);

    // Transition 123: Select account with same currency as person account
    //  and move from State 21 to State 3
    setBlock('Transition 123', 2);
    await Actions.changeDestCurrency(RUB); // move from State 3 to State 16
    await Actions.clickSrcResultBalance(); // move from State 16 to State 21
    await Actions.changeAccount(ACC_RUB);

    // Transition 124: Disable account and move from State 21 to State 7
    setBlock('Transition 124', 2);
    await Actions.changeDestCurrency(RUB); // move from State 3 to State 16
    await Actions.clickSrcResultBalance(); // move from State 16 to State 21
    await Actions.toggleAccount();

    // Transition 125: Change debt type to "take" and move from State 10 to State 16
    setBlock('Transition 125', 2);
    await Actions.toggleAccount(); // move from State 7 to State 3
    await Actions.swapSourceAndDest(); // move from State 3 to State 0
    await Actions.changeSourceCurrency(USD); // move from State 0 to State 10
    await Actions.swapSourceAndDest();

    // Transition 126: Change debt type to "give" and move from State 16 to State 10
    setBlock('Transition 126', 2);
    await Actions.swapSourceAndDest();

    // Transition 127: Change debt type to "take" and move from State 11 to State 17
    setBlock('Transition 127', 2);
    await Actions.clickSrcResultBalance(); // move from State 10 to State 11
    await Actions.swapSourceAndDest();

    // Transition 128: Change debt type to "give" and move from State 17 to State 11
    setBlock('Transition 128', 2);
    await Actions.swapSourceAndDest();

    // Transition 129: Change debt type to "take" and move from State 12 to State 18
    setBlock('Transition 129', 2);
    await Actions.clickSrcAmount(); // move from State 11 to State 10
    await Actions.clickExchRate(); // move from State 10 to State 12
    await Actions.swapSourceAndDest();

    // Transition 130: Change debt type to "give" and move from State 18 to State 12
    setBlock('Transition 130', 2);
    await Actions.swapSourceAndDest();

    // Transition 131: Change debt type to "take" and move from State 13 to State 19
    setBlock('Transition 131', 2);
    await Actions.clickSrcResultBalance(); // move from State 12 to State 13
    await Actions.swapSourceAndDest();

    // Transition 132: Change debt type to "give" and move from State 19 to State 13
    setBlock('Transition 132', 2);
    await Actions.swapSourceAndDest();

    // Transition 133: Change debt type to "take" and move from State 14 to State 20
    setBlock('Transition 133', 2);
    await Actions.clickDestResultBalance(); // move from State 13 to State 14
    await Actions.swapSourceAndDest();

    // Transition 134: Change debt type to "give" and move from State 20 to State 14
    setBlock('Transition 134', 2);
    await Actions.swapSourceAndDest();

    // Transition 135: Change debt type to "take" and move from State 15 to State 21
    setBlock('Transition 135', 2);
    await Actions.clickSrcAmount(); // move from State 14 to State 15
    await Actions.swapSourceAndDest();

    // Transition 136: Change debt type to "give" and move from State 21 to State 15
    setBlock('Transition 136', 2);
    await Actions.swapSourceAndDest();

    // Test input values for precise currency
    await Actions.clickDestAmount(); // move from State 15 to State 10
    await Actions.changeSourceCurrency(BTC);
    await Actions.inputSrcAmount('0.12345678');
    await Actions.clickSrcResultBalance();
    await Actions.inputResBalance('555.12345678');

    // Test handling invalid date string on show date picker
    await Actions.inputDate('');
    await Actions.selectDate(App.dates.now);
};
