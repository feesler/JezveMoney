import {
    test,
    assert,
    formatDate,
} from 'jezve-test';
import { App } from '../../Application.js';
import { ScheduledTransaction } from '../../model/ScheduledTransaction.js';
import { Transaction } from '../../model/Transaction.js';

export const inputStartDate = async (value) => {
    await test(`Input schedule start date '${value}'`, () => (
        App.view.inputStartDate(value)
    ));
};

export const selectStartDate = async (date) => {
    await test(`Select schedule start date '${formatDate(date, { locales: App.view.locale })}'`, () => (
        App.view.selectStartDate(date)
    ));
};

export const inputEndDate = async (value) => {
    await test(`Input schedule end date '${value}'`, () => (
        App.view.inputEndDate(value)
    ));
};

export const selectEndDate = async (date) => {
    await test(`Select schedule end date '${formatDate(date, { locales: App.view.locale })}'`, () => (
        App.view.selectEndDate(date)
    ));
};

export const clearEndDate = async () => {
    await test('Clear schedule end date', () => (
        App.view.clearEndDate()
    ));
};

export const inputIntervalStep = async (data) => {
    await test(`Input schedule interval step '${data}'`, () => (
        App.view.inputIntervalStep(data)
    ));
};

export const selectWeekDayOffset = async (data) => {
    await test(`Select schedule interval week day offset '${data}'`, () => (
        App.view.selectWeekDayOffset(data)
    ));
};

export const selectWeekdaysOffset = async () => {
    await test('Select weekdays as schedule interval offset', () => (
        App.view.selectWeekdaysOffset()
    ));
};

export const selectWeekendOffset = async () => {
    await test('Select weekend as schedule interval offset', () => (
        App.view.selectWeekendOffset()
    ));
};

export const selectMonthDayOffset = async (data) => {
    await test(`Select schedule interval month day offset '${data}'`, () => (
        App.view.selectMonthDayOffset(data)
    ));
};

export const selectMonthOffset = async (data) => {
    await test(`Select schedule interval month offset '${data}'`, () => (
        App.view.selectMonthOffset(data)
    ));
};

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

export const toggleAccount = async () => {
    await test(App.view.formModel.noAccount ? 'Enable account' : 'Disable account', () => (
        App.view.toggleAccount()
    ));
};

export const swapSourceAndDest = async () => {
    await test('Swap source and destination', () => (
        App.view.swapSourceAndDest()
    ));
};

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

export const inputSrcAmount = async (value) => {
    await test(`Input source amount '${value}'`, () => (
        App.view.inputSrcAmount(value)
    ));
};

export const inputDestAmount = async (value) => {
    await test(`Input destination amount '${value}'`, () => (
        App.view.inputDestAmount(value)
    ));
};

export const inputResBalance = async (value) => {
    await test(`Input source result balance '${value}'`, () => (
        App.view.inputResBalance(value)
    ));
};

export const inputDestResBalance = async (value) => {
    await test(`Input destination result balance '${value}'`, () => (
        App.view.inputDestResBalance(value)
    ));
};

export const inputExchRate = async (value) => {
    await test(`Input exchange rate '${value}'`, () => (
        App.view.inputExchRate(value)
    ));
};

export const toggleExchange = async () => {
    await test('Toggle exchange rate direction', () => (
        App.view.toggleExchange()
    ));
};

export const clickSrcAmount = async () => {
    await test('Click on source amount', () => (
        App.view.clickSrcAmount()
    ));
};

export const clickDestAmount = async () => {
    await test('Click on destination amount', () => (
        App.view.clickDestAmount()
    ));
};

export const clickSrcResultBalance = async () => {
    await test('Click on source result balance', () => (
        App.view.clickSrcResultBalance()
    ));
};

export const clickDestResultBalance = async () => {
    await test('Click on destination result balance', () => (
        App.view.clickDestResultBalance()
    ));
};

export const clickExchRate = async () => {
    await test('Click on exchange rate', () => (
        App.view.clickExchRate()
    ));
};

export const inputDate = async (value) => {
    await test(`Input date '${value}'`, () => (
        App.view.inputDate(value)
    ));
};

export const selectDate = async (date) => {
    await test(`Select date '${formatDate(date, { locales: App.view.locale })}'`, () => (
        App.view.selectDate(date)
    ));
};

export const inputComment = async (value) => {
    await test(`Input comment '${value}'`, () => (
        App.view.inputComment(value)
    ));
};

export const changeTransactionType = async (type) => {
    await test(`Change type to ${Transaction.typeToString(type)}`, () => (
        App.view.changeTransactionType(type)
    ));
};
