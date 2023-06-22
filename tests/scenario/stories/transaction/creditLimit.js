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
    await Actions.runActions([
        { action: 'changeTransactionType', data: LIMIT_CHANGE },
    ]);

    // State 1
    await test('Initial state of new credit limit view', () => {
        App.view.model.state = 1;
        const expected = App.view.getExpectedState();
        return App.view.checkState(expected);
    });

    // Input destination amount
    await Actions.runGroup('inputDestAmount', Actions.decimalInputTestStrings);

    await Actions.runActions([
        // Transition 2: Click on destination result balance block and move from State 1 to State 0
        { action: 'clickDestResultBalance' },
    ]);

    // Input result balance
    await Actions.runGroup('inputDestResBalance', Actions.decimalInputTestStrings);

    await Actions.runActions([
        // Transition 1: Click on destination amount block and move from State 0 to State 1
        { action: 'clickDestAmount' },
        // Test input values for precise currency
        { action: 'changeDestAccount', data: BTC_CREDIT },
        { action: 'inputDestAmount', data: '0.12345678' },
        { action: 'clickDestResultBalance' },
        { action: 'inputDestResBalance', data: '555.12345678' },
        // Transition 4: Click on destination amount block and move from State 1 to State 0
        { action: 'clickDestAmount' },
        // Test input values for precise currency
        { action: 'changeDestAccount', data: CREDIT_CARD },
        { action: 'inputDestAmount', data: '100' },
    ]);

    // Test handling invalid date string on show date picker
    await Actions.runActions([
        { action: 'inputDate', data: '' },
        { action: 'selectDate', data: App.dates.now },
    ]);
};
