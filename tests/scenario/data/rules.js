import { App } from '../../Application.js';
import { ConditionFields, conditions } from '../../model/ImportCondition.js';
import { actions } from '../../model/ImportAction.js';
import { api } from '../../model/api.js';

export const createImportRules = async () => {
    const rulesList = [{
        conditions: [
            conditions.comment.includes.value('MOBILE'),
            conditions.mainAccount.is.value(App.scenario.ACC_3),
        ],
        actions: [
            actions.setTransactionType('income'),
            actions.setComment('Mobile'),
        ],
    }, {
        conditions: [
            conditions.mainAccount.isNot.value(App.scenario.ACC_EUR),
            conditions.transactionAmount.is.value(80),
        ],
        actions: [
            actions.setTransactionType('transfer_out'),
            actions.setAccount(App.scenario.ACC_EUR),
        ],
    }, {
        conditions: [
            conditions.mainAccount.isNot.value(App.scenario.ACC_USD),
            conditions.comment.includes.value('SIGMA'),
            conditions.transactionAmount.less.value(0),
        ],
        actions: [
            actions.setTransactionType('transfer_in'),
            actions.setAccount(App.scenario.ACC_USD),
            actions.setComment('Local shop'),
        ],
    }, {
        conditions: [
            conditions.comment.includes.value('TAXI'),
            conditions.transactionAmount.greater.value(-100),
            conditions.transactionAmount.less.value(500),
        ],
        actions: [
            actions.setTransactionType('debt_out'),
            actions.setPerson(App.scenario.MARIA),
            actions.setComment('Taxi for Maria'),
            actions.setCategory(App.scenario.TRANSPORT_CATEGORY),
        ],
    }, {
        conditions: [
            conditions.comment.includes.value('MAGAZIN'),
        ],
        actions: [
            actions.setTransactionType('debt_in'),
            actions.setPerson(App.scenario.IVAN),
        ],
    }, {
        conditions: [
            conditions.comment.includes.value('BOOKING'),
            conditions.accountAmount.isNot.prop(ConditionFields.transactionAmount),
        ],
        actions: [
            actions.setDestAmount('500.5'),
        ],
    }, {
        conditions: [
            conditions.mainAccount.is.value(App.scenario.CREDIT_CARD),
            conditions.comment.includes.value('CREDIT LIMIT'),
        ],
        actions: [
            actions.setTransactionType('limit'),
        ],
    }, {
        conditions: [
            conditions.date.is.value(App.datesSec.now),
            conditions.comment.includes.value('BAR'),
        ],
        actions: [
            actions.setComment('Bar date'),
        ],
    }];

    await App.scenario.runner.runGroup(api.importrule.create, rulesList);

    await App.state.fetch();
};
