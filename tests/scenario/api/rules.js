import { setBlock } from 'jezve-test';
import {
    IMPORT_COND_FIELD_MAIN_ACCOUNT,
    IMPORT_COND_FIELD_ACC_AMOUNT,
    IMPORT_COND_FIELD_TR_AMOUNT,
    IMPORT_COND_FIELD_COMMENT,
    IMPORT_COND_OP_EQUAL,
    IMPORT_COND_OP_NOT_EQUAL,
    IMPORT_COND_OP_STRING_INCLUDES,
    IMPORT_COND_OP_FIELD_FLAG,
} from '../../model/ImportCondition.js';
import {
    IMPORT_ACTION_SET_TR_TYPE,
    IMPORT_ACTION_SET_COMMENT,
} from '../../model/ImportAction.js';
import { App } from '../../Application.js';
import * as ImportRuleApiTests from '../../run/api/importrule.js';

const create = async () => {
    setBlock('Create import rule', 2);

    const taxiCondition = {
        field_id: IMPORT_COND_FIELD_COMMENT,
        operator: IMPORT_COND_OP_STRING_INCLUDES,
        value: 'BANK MESSAGE',
        flags: 0,
    };
    const taxiAction = {
        action_id: IMPORT_ACTION_SET_COMMENT,
        value: 'Rule',
    };

    const data = [{
        flags: 0,
        conditions: [{
            field_id: IMPORT_COND_FIELD_MAIN_ACCOUNT,
            operator: IMPORT_COND_OP_NOT_EQUAL,
            value: App.scenario.CASH_RUB,
            flags: 0,
        }],
        actions: [{
            action_id: IMPORT_ACTION_SET_COMMENT,
            value: 'Rule',
        }],
    }, {
        flags: 0,
        conditions: [{
            field_id: IMPORT_COND_FIELD_TR_AMOUNT,
            operator: IMPORT_COND_OP_NOT_EQUAL,
            value: IMPORT_COND_FIELD_ACC_AMOUNT,
            flags: IMPORT_COND_OP_FIELD_FLAG,
        }, {
            field_id: IMPORT_COND_FIELD_COMMENT,
            operator: IMPORT_COND_OP_STRING_INCLUDES,
            value: 'BANK MESSAGE',
            flags: 0,
        }],
        actions: [{
            action_id: IMPORT_ACTION_SET_TR_TYPE,
            value: 'transferfrom',
        }, {
            action_id: IMPORT_ACTION_SET_COMMENT,
            value: 'Bank',
        }],
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
        conditions: [{
            field_id: 100,
            operator: IMPORT_COND_OP_STRING_INCLUDES,
            value: 'TEST',
            flags: 0,
        }],
        actions: [null],
    }, {
        flags: 0,
        conditions: [{
            field_id: IMPORT_COND_FIELD_COMMENT,
            operator: 100,
            value: 'TEST',
            flags: 0,
        }],
        actions: [null],
    }, {
        flags: 0,
        conditions: [{
            field_id: IMPORT_COND_FIELD_COMMENT,
            operator: IMPORT_COND_OP_STRING_INCLUDES,
            value: null,
            flags: 0,
        }],
        actions: [null],
    }, {
        flags: 0,
        conditions: [{
            operator: IMPORT_COND_OP_STRING_INCLUDES,
            value: 'TEST',
            flags: 0,
        }],
        actions: [null],
    }, {
        flags: 0,
        conditions: [{
            field_id: IMPORT_COND_FIELD_COMMENT,
            value: 'TEST',
            flags: 0,
        }],
        actions: [null],
    }, {
        flags: 0,
        conditions: [{
            field_id: IMPORT_COND_FIELD_COMMENT,
            operator: IMPORT_COND_OP_STRING_INCLUDES,
            flags: 0,
        }],
        actions: [null],
    }, {
        flags: 0,
        conditions: [{
            field_id: IMPORT_COND_FIELD_COMMENT,
            operator: IMPORT_COND_OP_STRING_INCLUDES,
            value: 'TEST',
        }],
        actions: [null],
    }, {
        flags: 0,
        conditions: [{
            field_id: IMPORT_COND_FIELD_COMMENT,
            operator: IMPORT_COND_OP_STRING_INCLUDES,
            value: 'TEST',
            flags: 0,
        }],
        actions: [{
            action_id: IMPORT_ACTION_SET_COMMENT,
        }],
    }, {
        flags: 0,
        conditions: [{
            field_id: IMPORT_COND_FIELD_COMMENT,
            operator: IMPORT_COND_OP_STRING_INCLUDES,
            value: 'TEST',
            flags: 0,
        }],
        actions: [{
            value: 'Rule',
        }],
    }, {
        flags: 0,
        conditions: [{
            field_id: IMPORT_COND_FIELD_COMMENT,
            operator: IMPORT_COND_OP_STRING_INCLUDES,
            value: 'TEST',
            flags: 0,
        }],
        actions: [{
            action_id: 100,
            value: 'Rule',
        }],
    }, {
        flags: 0,
        conditions: [{
            field_id: IMPORT_COND_FIELD_COMMENT,
            operator: IMPORT_COND_OP_STRING_INCLUDES,
            value: 'TEST',
            flags: 0,
        }],
        actions: [{
            action_id: IMPORT_ACTION_SET_TR_TYPE,
            value: 100,
        }],
    }];

    [
        App.scenario.RULE_1,
        App.scenario.RULE_2,
        App.scenario.RULE_3,
    ] = await App.scenario.runner.runGroup(ImportRuleApiTests.create, data);
};

const update = async () => {
    setBlock('Update import rule', 2);

    const diffAmountCondition = {
        field_id: IMPORT_COND_FIELD_TR_AMOUNT,
        operator: IMPORT_COND_OP_NOT_EQUAL,
        value: IMPORT_COND_FIELD_ACC_AMOUNT,
        flags: IMPORT_COND_OP_FIELD_FLAG,
    };
    const debtAction = {
        action_id: IMPORT_ACTION_SET_TR_TYPE,
        value: 'debtto',
    };

    const data = [{
        id: App.scenario.RULE_1,
        conditions: [{
            field_id: IMPORT_COND_FIELD_MAIN_ACCOUNT,
            operator: IMPORT_COND_OP_EQUAL,
            value: App.scenario.CASH_RUB,
            flags: 0,
        }, {
            field_id: IMPORT_COND_FIELD_COMMENT,
            operator: IMPORT_COND_OP_STRING_INCLUDES,
            value: 'MARKET',
            flags: 0,
        }],
        actions: [{
            action_id: IMPORT_ACTION_SET_TR_TYPE,
            value: 'transferto',
        }],
    }, {
        id: App.scenario.RULE_2,
        conditions: null,
        actions: [debtAction],
    }, {
        id: App.scenario.RULE_2,
        conditions: [],
        actions: [debtAction],
    }, {
        id: App.scenario.RULE_2,
        conditions: [null],
        actions: [debtAction],
    }, {
        id: App.scenario.RULE_2,
        conditions: [diffAmountCondition],
        actions: null,
    }, {
        id: App.scenario.RULE_2,
        conditions: [diffAmountCondition],
        actions: [],
    }, {
        id: App.scenario.RULE_2,
        conditions: [diffAmountCondition],
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
        setBlock('Import rule', 2);

        await create();
        await update();
        await del();
    },
};
