import { test, setBlock } from 'jezve-test';
import { App } from '../../../Application.js';
import { LIMIT_CHANGE } from '../../../model/Transaction.js';
import * as Actions from '../../actions/transaction.js';

export const stateLoop = async () => {
    await App.state.fetch();

    const { CREDIT_CARD, BTC_CREDIT } = App.scenario;

    setBlock('Credit limit loop', 2);

    // Navigate to create income view
    const sortedAccounts = App.state.getSortedUserAccounts();
    const index = sortedAccounts.getIndexById(CREDIT_CARD);

    await Actions.createFromAccount(index);
    await Actions.changeTransactionType(LIMIT_CHANGE);

    // State 1
    await test('Initial state of new credit limit view', () => {
        App.view.model.state = 1;
        const expected = App.view.getExpectedState();
        return App.view.checkState(expected);
    });

    // Input destination amount
    await App.scenario.runner.runGroup(Actions.inputDestAmount, Actions.decimalInputTestStrings);

    // Transition 2: Click on destination result balance block and move from State 1 to State 0
    await Actions.clickDestResultBalance();

    // Input result balance
    await App.scenario.runner.runGroup(
        Actions.inputDestResBalance,
        Actions.decimalInputTestStrings,
    );

    // Transition 1: Click on destination amount block and move from State 0 to State 1
    await Actions.clickDestAmount();
    // Test input values for precise currency
    await Actions.changeDestAccount(BTC_CREDIT);
    await Actions.inputDestAmount('0.12345678');
    await Actions.clickDestResultBalance();
    await Actions.inputDestResBalance('555.12345678');
    // Transition 4: Click on destination amount block and move from State 1 to State 0
    await Actions.clickDestAmount();
    // Test input values for precise currency
    await Actions.changeDestAccount(CREDIT_CARD);
    await Actions.inputDestAmount('100');

    // Test handling invalid date string on show date picker
    await Actions.inputDate('');
    await Actions.selectDate(App.dates.now);
};
