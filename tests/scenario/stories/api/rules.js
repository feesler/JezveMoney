import { assert } from '@jezvejs/assert';
import { setBlock } from 'jezve-test';
import {
    ConditionFields,
    ConditionOperators,
    conditions,
} from '../../../model/ImportCondition.js';
import { actions, ImportActionTypes } from '../../../model/ImportAction.js';
import { App } from '../../../Application.js';
import * as Actions from '../../actions/api/importrule.js';
import { formatProps } from '../../../common.js';

const create = async () => {
    setBlock('Create import rule', 2);

    const taxiCondition = conditions.comment.includes.value('BANK MESSAGE');
    const taxiAction = actions.setComment('Rule');

    const data = [{
        conditions: [
            conditions.mainAccount.isNot.value(App.scenario.CASH_RUB),
        ],
        actions: [taxiAction],
    }, {
        conditions: [
            conditions.transactionAmount.isNot.prop(ConditionFields.accountAmount),
            conditions.comment.includes.value('BANK MESSAGE'),
        ],
        actions: [
            actions.setTransactionType('transfer_out'),
            actions.setComment('Bank'),
        ],
    }, {
        conditions: [taxiCondition],
        actions: [taxiAction],
    }, {
        conditions: [
            conditions.mainAccount.is.value(App.scenario.ACCOUNT_3),
            conditions.comment.includes.value('CREDIT LIMIT'),
        ],
        actions: [
            actions.setTransactionType('limit'),
        ],
    }, {
        conditions: [
            conditions.comment.includes.value('R-BANK'),
            conditions.comment.notIncludes.value('C2C'),
        ],
        actions: [
            actions.setCategory(App.scenario.INVEST_CATEGORY),
        ],
    }];

    [
        App.scenario.RULE_1,
        App.scenario.RULE_2,
        App.scenario.RULE_3,
    ] = await App.scenario.runner.runGroup(Actions.create, data);
};

const createInvalid = async () => {
    setBlock('Create import rule with invalid data', 2);

    const { PERSON_Y, CASH_RUB } = App.scenario;

    const taxiCondition = conditions.comment.includes.value('BANK MESSAGE');
    const taxiAction = actions.setComment('Rule');

    const data = [{ // empty object
    }, { // Invalid conditions property
        conditions: null,
    }, { // Invalid actions property
        actions: null,
    }, {
        conditions: [taxiCondition],
        actions: null,
    }, { // Empty conditions list
        conditions: [],
        actions: [],
    }, {
        conditions: [],
        actions: [taxiAction],
    }, { // Empty actions list
        conditions: [taxiCondition],
        actions: [],
    }, {
        conditions: [null],
        actions: [null],
    }, {
        conditions: [{ // Invalid field type
            field_id: 100,
            operator: ConditionOperators.includes,
            value: 'TEST',
        }],
        actions: [null],
    }, {
        conditions: [{ // Invalid operator
            field_id: ConditionFields.comment,
            operator: 100,
            value: 'TEST',
        }],
        actions: [null],
    }, {
        conditions: [{ // Invalid value for 'includes' operator
            field_id: ConditionFields.comment,
            operator: ConditionOperators.includes,
            value: null,
        }],
        actions: [null],
    }, {
        conditions: [{ // No field_id
            operator: ConditionOperators.includes,
            value: 'TEST',
        }],
        actions: [null],
    }, {
        conditions: [{ // No operator
            field_id: ConditionFields.comment,
            value: 'TEST',
        }],
        actions: [null],
    }, {
        conditions: [{ // No value
            field_id: ConditionFields.comment,
            operator: ConditionOperators.includes,
        }],
        actions: [null],
    }, {
        conditions: [{ // No flags
            field_id: ConditionFields.comment,
            operator: ConditionOperators.includes,
            value: 'TEST',
        }],
        actions: [null],
    }, { // `Comment includes` condition with empty value
        conditions: [
            conditions.comment.includes.value(''),
        ],
        actions: [taxiAction],
    }, { // Date condition with empty value
        conditions: [
            conditions.date.greater.value(''),
        ],
        actions: [taxiAction],
    }, { // Date condition with invalid value
        conditions: [
            conditions.date.greater.value('01xx'),
        ],
        actions: [taxiAction],
    }, { // Rule without guard condition for `Set account` action
        conditions: [taxiCondition],
        actions: [
            actions.setTransactionType('transfer_out'),
            actions.setAccount(CASH_RUB),
        ],
    }, { // Condition with empty amount
        conditions: [
            conditions.accountAmount.greater.value(''),
        ],
        actions: [taxiAction],
    }, { // Duplicate conditions
        conditions: [
            conditions.accountAmount.greater.value('100.01'),
            conditions.accountAmount.greater.value('99.99'),
        ],
        actions: [taxiAction],
    }, { // Conditions with non-intersecting value regions
        conditions: [
            conditions.accountAmount.greater.value('100.01'),
            conditions.accountAmount.less.value('99.99'),
        ],
        actions: [taxiAction],
    }, { // Conditions action 'Set person' for transfer transaction
        conditions: [taxiCondition],
        actions: [
            actions.setTransactionType('transfer_out'),
            actions.setPerson(PERSON_Y),
        ],
    }, { // Conditions action 'Set person' for transfer transaction
        conditions: [taxiCondition],
        actions: [
            actions.setTransactionType('transfer_in'),
            actions.setPerson(PERSON_Y),
        ],
    }, { // Conditions action 'Set account' for debt transaction
        conditions: [taxiCondition],
        actions: [
            actions.setTransactionType('debt_out'),
            actions.setAccount(CASH_RUB),
        ],
    }, { // Conditions action 'Set account' for debt transaction
        conditions: [taxiCondition],
        actions: [
            actions.setTransactionType('debt_in'),
            actions.setAccount(CASH_RUB),
        ],
    }, { // Conditions with non-intersecting value regions
        conditions: [
            conditions.accountAmount.greater.value('100.01'),
            conditions.accountAmount.less.value('999.99'),
            conditions.accountAmount.isNot.value('5'),
        ],
        actions: [taxiAction],
    }, {
        conditions: [
            conditions.comment.includes.value('TEST'),
        ],
        actions: [{
            // Action without value
            action_id: ImportActionTypes.setComment,
        }],
    }, {
        conditions: [
            conditions.comment.includes.value('TEST'),
        ],
        actions: [{
            // Action without action_id
            value: 'Rule',
        }],
    }, {
        conditions: [
            conditions.comment.includes.value('TEST'),
        ],
        actions: [{
            // Action with invalid action_id
            action_id: 100,
            value: 'Rule',
        }],
    }, {
        conditions: [
            conditions.comment.includes.value('TEST'),
        ],
        actions: [
            // Action with invalid value
            actions.setTransactionType(100),
        ],
    }, { // Empty amount action
        conditions: [taxiCondition],
        actions: [
            actions.setSourceAmount(''),
        ],
    }, { // Zero amount action
        conditions: [taxiCondition],
        actions: [
            actions.setSourceAmount('0.'),
        ],
    }, { // Negative amount action
        conditions: [taxiCondition],
        actions: [
            actions.setSourceAmount('-10.'),
        ],
    }, {
        // Conflicting conditions for comment field
        conditions: [
            conditions.comment.includes.value('C2C R-BANK'),
            conditions.comment.notIncludes.value('C2C'),
        ],
        actions: [
            actions.setCategory(App.scenario.INVEST_CATEGORY),
        ],
    }, {
        // Conflicting conditions for comment field
        conditions: [
            conditions.comment.is.value('C2C R-BANK'),
            conditions.comment.notIncludes.value('C2C'),
        ],
        actions: [
            actions.setCategory(App.scenario.INVEST_CATEGORY),
        ],
    }];

    const res = await App.scenario.runner.runGroup(Actions.create, data);
    // Double check all rules was not created
    res.forEach((item, index) => {
        assert(!item, `Created import rule with invalid data: { ${formatProps(data[index])} }`);
    });
};

const createWithChainedRequest = async () => {
    setBlock('Create import rule with chained request', 2);

    const data = [{
        conditions: [
            conditions.comment.includes.value('Chained'),
        ],
        actions: [
            actions.setComment('Chained rule'),
        ],
        returnState: {
            importrules: {},
        },
    }];

    [
        App.scenario.RULE_CHAINED,
    ] = await App.scenario.runner.runGroup(Actions.create, data);
};

const update = async () => {
    setBlock('Update import rule', 2);

    const isDiffAmount = conditions.transactionAmount.isNot.prop(ConditionFields.accountAmount);
    const setIncomingDebt = actions.setTransactionType('debt_in');

    const data = [{
        id: App.scenario.RULE_1,
        conditions: [{
            field_id: ConditionFields.mainAccount,
            operator: ConditionOperators.is,
            value: App.scenario.CASH_RUB,
        }, {
            field_id: ConditionFields.comment,
            operator: ConditionOperators.includes,
            value: 'MARKET',
        }],
        actions: [
            actions.setTransactionType('transfer_in'),
        ],
    }, {
        id: App.scenario.RULE_2,
        conditions: null,
        actions: [setIncomingDebt],
    }, {
        id: App.scenario.RULE_2,
        conditions: [],
        actions: [setIncomingDebt],
    }, {
        id: App.scenario.RULE_2,
        conditions: [null],
        actions: [setIncomingDebt],
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

    await App.scenario.runner.runGroup(Actions.update, data);
};

const updateWithChainedRequest = async () => {
    setBlock('Update import rule with chained request', 2);

    const data = [{
        id: App.scenario.RULE_CHAINED,
        conditions: [
            conditions.comment.includes.value('Chained'),
        ],
        actions: [
            actions.setComment('Concatenated'),
        ],
        returnState: {
            importrules: {},
            accounts: { visibility: 'visible' },
        },
    }];

    await App.scenario.runner.runGroup(Actions.update, data);
};

const del = async () => {
    setBlock('Delete import rule', 2);

    const data = [
        { id: App.scenario.RULE_3 },
        { id: [App.scenario.RULE_1, App.scenario.RULE_2] },
    ];

    await App.scenario.runner.runGroup(Actions.del, data);
};

const delWithChainedRequest = async () => {
    setBlock('Delete import rule with chained request', 2);

    const data = [
        {
            id: App.scenario.RULE_CHAINED,
            returnState: {
                importrules: {},
            },
        },
    ];

    await App.scenario.runner.runGroup(Actions.del, data);
};

export const apiImportRulesTests = {
    async run() {
        setBlock('Import rule', 1);

        await create();
        await createInvalid();
        await createWithChainedRequest();
        await update();
        await updateWithChainedRequest();
        await del();
        await delWithChainedRequest();
    },
};
