import { assert } from '@jezvejs/assert';
import { formatDate } from '@jezvejs/datetime';
import { test } from 'jezve-test';
import { App } from '../../Application.js';
import { ScheduledTransaction } from '../../model/ScheduledTransaction.js';
import { Transaction } from '../../model/Transaction.js';
import { Reminder } from '../../model/Reminder.js';

export const inputScheduleName = (value) => (
    test(`Input schedule name '${value}'`, () => (
        App.view.inputScheduleName(value)
    ))
);

export const inputStartDate = (value) => (
    test(`Input schedule start date '${value}'`, () => (
        App.view.inputStartDate(value)
    ))
);

export const selectStartDate = (date) => (
    test(`Select schedule start date '${formatDate(date, { locales: App.view.locale })}'`, () => (
        App.view.selectStartDate(date)
    ))
);

export const inputEndDate = (value) => (
    test(`Input schedule end date '${value}'`, () => (
        App.view.inputEndDate(value)
    ))
);

export const selectEndDate = (date) => (
    test(`Select schedule end date '${formatDate(date, { locales: App.view.locale })}'`, () => (
        App.view.selectEndDate(date)
    ))
);

export const clearEndDate = () => (
    test('Clear schedule end date', () => (
        App.view.clearEndDate()
    ))
);

export const inputIntervalStep = (data) => (
    test(`Input schedule interval step '${data}'`, () => (
        App.view.inputIntervalStep(data)
    ))
);

export const selectWeekDayOffset = (data) => (
    test(`Select schedule interval week day offset '${data}'`, () => (
        App.view.selectWeekDayOffset(data)
    ))
);

export const selectWeekdaysOffset = () => (
    test('Select weekdays as schedule interval offset', () => (
        App.view.selectWeekdaysOffset()
    ))
);

export const selectWeekendOffset = () => (
    test('Select weekend as schedule interval offset', () => (
        App.view.selectWeekendOffset()
    ))
);

export const selectMonthDayOffset = (data) => (
    test(`Select schedule interval month day offset '${data}'`, () => (
        App.view.selectMonthDayOffset(data)
    ))
);

export const selectMonthOffset = (data) => (
    test(`Select schedule interval month offset '${data}'`, () => (
        App.view.selectMonthOffset(data)
    ))
);

export const toggleEnableRepeat = async () => {
    const descr = (App.view.formModel.repeatEnabled)
        ? 'Disable transaction repeat'
        : 'Enable transaction repeat';
    await test(descr, () => App.view.toggleEnableRepeat());
};

export const changeIntervalType = async (data) => {
    const intervalType = parseInt(data, 10);
    const type = ScheduledTransaction.intervalTypes[intervalType];
    assert(type, `Invalid interval type: ${data}`);

    await test(`Change schedule interval to '${type}'`, () => (
        App.view.changeIntervalType(data)
    ));
};

export const changeSrcAccount = async (data) => {
    const userAccounts = App.state.getUserAccounts();
    const acc = userAccounts.getItem(data);
    assert(acc, `Account '${data}' not found`);

    await test(`Change source account to '${acc.name}'`, () => (
        App.view.changeSrcAccount(data)
    ));
};

export const changeDestAccount = async (data) => {
    const userAccounts = App.state.getUserAccounts();
    const acc = userAccounts.getItem(data);
    assert(acc, `Account '${data}' not found`);

    await test(`Change destination account to '${acc.name}'`, () => (
        App.view.changeDestAccount(data)
    ));
};

export const changePerson = async (data) => {
    const person = App.state.persons.getItem(data);
    assert(person, `Person '${data}' not found`);

    await test(`Change person to '${person.name}'`, () => (
        App.view.changePerson(data)
    ));
};

export const changeAccount = async (value) => {
    const userAccounts = App.state.getUserAccounts();
    const acc = userAccounts.getItem(value);
    assert(acc, `Account '${value}' not found`);

    await test(`Change account to '${acc.name}'`, async () => {
        if (App.view.formModel.noAccount) {
            await App.view.toggleAccount();
        }

        return App.view.changeAccount(value);
    });
};

export const toggleAccount = () => (
    test(App.view.formModel.noAccount ? 'Enable account' : 'Disable account', () => (
        App.view.toggleAccount()
    ))
);

export const swapSourceAndDest = () => (
    test('Swap source and destination', () => (
        App.view.swapSourceAndDest()
    ))
);

export const changeSourceCurrency = async (data) => {
    const curr = App.currency.getItem(data);
    assert(curr, `Currency (${data}) not found`);

    await test(`Change source currency to '${curr.code}'`, () => (
        App.view.changeSourceCurrency(data)
    ));
};

export const changeDestCurrency = async (data) => {
    const curr = App.currency.getItem(data);
    assert(curr, `Currency (${data}) not found`);

    await test(`Change destination currency to '${curr.code}'`, () => (
        App.view.changeDestCurrency(data)
    ));
};

export const changeCategory = async (data) => {
    const category = App.state.categories.getItem(data);
    assert(category, `Category '${data}' not found`);

    await test(`Change category to '${category.name}'`, () => (
        App.view.changeCategory(data)
    ));
};

export const inputSrcAmount = (value) => (
    test(`Input source amount '${value}'`, () => (
        App.view.inputSrcAmount(value)
    ))
);

export const inputDestAmount = (value) => (
    test(`Input destination amount '${value}'`, () => (
        App.view.inputDestAmount(value)
    ))
);

export const inputResBalance = (value) => (
    test(`Input source result balance '${value}'`, () => (
        App.view.inputResBalance(value)
    ))
);

export const inputDestResBalance = (value) => (
    test(`Input destination result balance '${value}'`, () => (
        App.view.inputDestResBalance(value)
    ))
);

export const inputExchRate = (value) => (
    test(`Input exchange rate '${value}'`, () => (
        App.view.inputExchRate(value)
    ))
);

export const toggleExchange = () => (
    test('Toggle exchange rate direction', () => (
        App.view.toggleExchange()
    ))
);

export const clickSrcAmount = () => (
    test('Click on source amount', () => (
        App.view.clickSrcAmount()
    ))
);

export const clickDestAmount = () => (
    test('Click on destination amount', () => (
        App.view.clickDestAmount()
    ))
);

export const clickSrcResultBalance = () => (
    test('Click on source result balance', () => (
        App.view.clickSrcResultBalance()
    ))
);

export const clickDestResultBalance = () => (
    test('Click on destination result balance', () => (
        App.view.clickDestResultBalance()
    ))
);

export const clickExchRate = () => (
    test('Click on exchange rate', () => (
        App.view.clickExchRate()
    ))
);

export const inputDate = (value) => (
    test(`Input date '${value}'`, () => (
        App.view.inputDate(value)
    ))
);

export const selectDate = (date) => (
    test(`Select date '${formatDate(date, { locales: App.view.locale })}'`, () => (
        App.view.selectDate(date)
    ))
);

export const inputComment = (value) => (
    test(`Input comment '${value}'`, () => (
        App.view.inputComment(value)
    ))
);

export const changeTransactionType = (type) => (
    test(`Change type to ${Transaction.typeToString(type, App.config.logsLocale)}`, () => (
        App.view.changeTransactionType(type)
    ))
);

export const openReminderDialog = () => (
    test('Open \'Select reminder\' dialog', () => (
        App.view.openReminderDialog()
    ))
);

export const closeReminderDialog = () => (
    test('Close \'Select reminder\' dialog', () => (
        App.view.closeReminderDialog()
    ))
);

export const selectReminderByIndex = (index) => (
    test(`Select reminder by index [${index}]`, () => (
        App.view.selectReminderByIndex(index)
    ))
);

export const removeReminder = () => (
    test('Remove reminder', () => (
        App.view.removeReminder()
    ))
);

export const clearAllRemindersFilters = () => (
    test('Clear all filters', () => (
        App.view.clearAllRemindersFilters()
    ))
);

export const filterRemindersByState = async (state) => {
    const stateType = parseInt(state, 10);
    const stateName = Reminder.stateNames[stateType];
    assert(stateName, 'Invalid reminder state');

    await test(`Filter reminders by state '${stateName}'`, () => (
        App.view.filterRemindersByState(state)
    ));
};

export const selectRemindersStartDateFilter = async (date) => {
    const dateFmt = App.reformatDate(date);

    await test(`Select reminders start date filter (${dateFmt})`, () => (
        App.view.selectRemindersStartDateFilter(date)
    ));
};

export const selectRemindersEndDateFilter = async (date) => {
    const dateFmt = App.reformatDate(date);

    await test(`Select reminders end date filter (${dateFmt})`, () => (
        App.view.selectRemindersEndDateFilter(date)
    ));
};

export const clearRemindersStartDateFilter = () => (
    test('Clear reminders start date filter', () => (
        App.view.clearRemindersStartDateFilter()
    ))
);

export const clearRemindersEndDateFilter = () => (
    test('Clear reminders end date filter', () => (
        App.view.clearRemindersEndDateFilter()
    ))
);

export const goToRemindersFirstPage = () => (
    test('Navigate to reminders first page', () => (
        App.view.goToRemindersFirstPage()
    ))
);

export const goToRemindersLastPage = () => (
    test('Navigate to reminders last page', () => (
        App.view.goToRemindersLastPage()
    ))
);

export const goToRemindersPrevPage = () => (
    test('Navigate to reminders previous page', () => (
        App.view.goToRemindersPrevPage()
    ))
);

export const goToRemindersNextPage = () => (
    test('Navigate to reminders next page', () => (
        App.view.goToRemindersNextPage()
    ))
);

export const showMoreReminders = () => (
    test('Show more reminders', () => (
        App.view.showMoreReminders()
    ))
);

export const setRemindersClassicMode = () => (
    test('Set reminders list classic mode', () => (
        App.view.setRemindersClassicMode()
    ))
);

export const setRemindersDetailsMode = () => (
    test('Set reminders list details mode', () => (
        App.view.setRemindersDetailsMode()
    ))
);
