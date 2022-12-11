import { setBlock } from 'jezve-test';
import {
    ConditionFields,
    ConditionOperators,
    conditions,
} from '../../../model/ImportCondition.js';
import { actions, ImportActionTypes } from '../../../model/ImportAction.js';
import { App } from '../../../Application.js';
import * as ImportRuleApiTests from '../../../run/api/importrule.js';

const create = async () => {
    setBlock('Create import rule', 2);

    const taxiCondition = conditions.comment.includes.value('BANK MESSAGE');
    const taxiAction = actions.setComment('Rule');

    const data = [{
        flags: 0,
        conditions: [
            conditions.mainAccount.isNot.value(App.scenario.CASH_RUB),
        ],
        actions: [taxiAction],
    }, {
        flags: 0,
        conditions: [
            conditions.transactionAmount.isNot.prop(ConditionFields.accountAmount),
            conditions.comment.includes.value('BANK MESSAGE'),
        ],
        actions: [
            actions.setTransactionType('transferfrom'),
            actions.setComment('Bank'),
        ],
    }, {
        flags: 0,
        conditions: [
            conditions.comment.includes.value('ANOTHER BANK'),
        ],
        actions: [
            actions.setCategory(App.scenario.INVEST_CATEGORY),
        ],
    }, {
        flags: 0,
        conditions: [taxiCondition],
        actions: [taxiAction],
    }, {
        // Invalid rules
        flags: 0,
    }, {
        flags: 0,
        conditions: null,
    }, {
        flags: 0,
        actions: null,
    }, {
        flags: 0,
        conditions: [],
        actions: [],
    }, {
        flags: 0,
        conditions: [taxiCondition],
        actions: [],
    }, {
        flags: 0,
        conditions: [],
        actions: [taxiAction],
    }, {
        flags: 0,
        conditions: [null],
        actions: [null],
    }, {
        flags: 0,
        conditions: [{ // Invalid field type
            field_id: 100,
            operator: ConditionOperators.includes,
            value: 'TEST',
            flags: 0,
        }],
        actions: [null],
    }, {
        flags: 0,
        conditions: [{ // Invalid operator
            field_id: ConditionFields.comment,
            operator: 100,
            value: 'TEST',
            flags: 0,
        }],
        actions: [null],
    }, {
        flags: 0,
        conditions: [{ // Invalid value for 'includes' operator
            field_id: ConditionFields.comment,
            operator: ConditionOperators.includes,
            value: null,
            flags: 0,
        }],
        actions: [null],
    }, {
        flags: 0,
        conditions: [{ // No field_id
            operator: ConditionOperators.includes,
            value: 'TEST',
            flags: 0,
        }],
        actions: [null],
    }, {
        flags: 0,
        conditions: [{ // No operator
            field_id: ConditionFields.comment,
            value: 'TEST',
            flags: 0,
        }],
        actions: [null],
    }, {
        flags: 0,
        conditions: [{ // No value
            field_id: ConditionFields.comment,
            operator: ConditionOperators.includes,
            flags: 0,
        }],
        actions: [null],
    }, {
        flags: 0,
        conditions: [{ // No flags
            field_id: ConditionFields.comment,
            operator: ConditionOperators.includes,
            value: 'TEST',
        }],
        actions: [null],
    }, {
        flags: 0,
        conditions: [
            conditions.comment.includes.value('TEST'),
        ],
        actions: [{
            // Action without value
            action_id: ImportActionTypes.setComment,
        }],
    }, {
        flags: 0,
        conditions: [
            conditions.comment.includes.value('TEST'),
        ],
        actions: [{
            // Action without action_id
            value: 'Rule',
        }],
    }, {
        flags: 0,
        conditions: [
            conditions.comment.includes.value('TEST'),
        ],
        actions: [{
            // Action with invalid action_id
            action_id: 100,
            value: 'Rule',
        }],
    }, {
        flags: 0,
        conditions: [
            conditions.comment.includes.value('TEST'),
        ],
        actions: [
            // Action with invalid value
            actions.setTransactionType(100),
        ],
    }];

    [
        App.scenario.RULE_1,
        App.scenario.RULE_2,
        App.scenario.RULE_3,
    ] = await App.scenario.runner.runGroup(ImportRuleApiTests.create, data);
};

const update = async () => {
    setBlock('Update import rule', 2);

    const isDiffAmount = conditions.transactionAmount.isNot.prop(ConditionFields.accountAmount);
    const setDebtTo = actions.setTransactionType('debtto');

    const data = [{
        id: App.scenario.RULE_1,
        conditions: [{
            field_id: ConditionFields.mainAccount,
            operator: ConditionOperators.is,
            value: App.scenario.CASH_RUB,
            flags: 0,
        }, {
            field_id: ConditionFields.comment,
            operator: ConditionOperators.includes,
            value: 'MARKET',
            flags: 0,
        }],
        actions: [
            actions.setTransactionType('transferto'),
        ],
    }, {
        id: App.scenario.RULE_2,
        conditions: null,
        actions: [setDebtTo],
    }, {
        id: App.scenario.RULE_2,
        conditions: [],
        actions: [setDebtTo],
    }, {
        id: App.scenario.RULE_2,
        conditions: [null],
        actions: [setDebtTo],
    }, {
        id: App.scenario.RULE_2,
        conditions: [isDiffAmount],
        actions: null,
    }, {
        id: App.scenario.RULE_2,
        conditions: [isDiffAmount],
        actions: [],
    }, {
        id: App.scenario.RULE_2,
        conditions: [isDiffAmount],
        actions: [null],
    }];

    await App.scenario.runner.runGroup(ImportRuleApiTests.update, data);
};

const del = async () => {
    setBlock('Delete import rule', 2);

    const data = [
        [App.scenario.RULE_3],
        [App.scenario.RULE_1, App.scenario.RULE_2],
    ];

    await App.scenario.runner.runGroup(ImportRuleApiTests.del, data);
};

export const apiImportRulesTests = {
    async run() {
        setBlock('Import rule', 1);

        await create();
        await update();
        await del();
    },
};
