import { App } from '../../Application.js';
import { ConditionFields, conditions } from '../../model/ImportCondition.js';
import { actions } from '../../model/ImportAction.js';
import { api } from '../../model/api.js';

export const createImportRules = async () => {
    const rulesList = [{
        flags: 0,
        conditions: [
            conditions.comment.includes.value('MOBILE'),
            conditions.mainAccount.is.value(App.scenario.ACC_3),
        ],
        actions: [
            actions.setTransactionType('income'),
            actions.setComment('Mobile'),
        ],
    }, {
        flags: 0,
        conditions: [
            conditions.mainAccount.isNot.value(App.scenario.ACC_EUR),
            conditions.transactionAmount.is.value(80),
        ],
        actions: [
            actions.setTransactionType('transferfrom'),
            actions.setAccount(App.scenario.ACC_EUR),
        ],
    }, {
        flags: 0,
        conditions: [
            conditions.mainAccount.isNot.value(App.scenario.ACC_USD),
            conditions.comment.includes.value('SIGMA'),
            conditions.transactionAmount.less.value(0),
        ],
        actions: [
            actions.setTransactionType('transferto'),
            actions.setAccount(App.scenario.ACC_USD),
            actions.setComment('Local shop'),
        ],
    }, {
        flags: 0,
        conditions: [
            conditions.comment.includes.value('TAXI'),
            conditions.transactionAmount.greater.value(-100),
            conditions.transactionAmount.less.value(500),
        ],
        actions: [
            actions.setTransactionType('debtfrom'),
            actions.setPerson(App.scenario.MARIA),
            actions.setComment('Taxi for Maria'),
            actions.setCategory(App.scenario.TRANSPORT_CATEGORY),
        ],
    }, {
        flags: 0,
        conditions: [
            conditions.comment.includes.value('MAGAZIN'),
        ],
        actions: [
            actions.setTransactionType('debtto'),
            actions.setPerson(App.scenario.IVAN),
        ],
    }, {
        flags: 0,
        conditions: [
            conditions.comment.includes.value('BOOKING'),
            conditions.accountAmount.isNot.prop(ConditionFields.transactionAmount),
        ],
        actions: [
            actions.setDestAmount('500.5'),
        ],
    }];

    await App.scenario.runner.runGroup(api.importrule.create, rulesList);

    await App.state.fetch();
};
