import { App } from '../../Application.js';
import {
    IMPORT_COND_FIELD_MAIN_ACCOUNT,
    IMPORT_COND_FIELD_ACC_AMOUNT,
    IMPORT_COND_FIELD_TR_AMOUNT,
    IMPORT_COND_FIELD_COMMENT,
    IMPORT_COND_OP_EQUAL,
    IMPORT_COND_OP_NOT_EQUAL,
    IMPORT_COND_OP_STRING_INCLUDES,
    IMPORT_COND_OP_LESS,
    IMPORT_COND_OP_GREATER,
    IMPORT_COND_OP_FIELD_FLAG,
} from '../../model/ImportCondition.js';
import {
    IMPORT_ACTION_SET_TR_TYPE,
    IMPORT_ACTION_SET_ACCOUNT,
    IMPORT_ACTION_SET_PERSON,
    IMPORT_ACTION_SET_DEST_AMOUNT,
    IMPORT_ACTION_SET_COMMENT,
} from '../../model/ImportAction.js';
import { api } from '../../model/api.js';

export const createImportRules = async () => {
    const rulesList = [
        /** Comment includes 'MOBILE' and main account is 'ACC_3'
         *  Set type to 'Income' and set comment 'Mobile'
         */
        {
            flags: 0,
            conditions: [{
                field_id: IMPORT_COND_FIELD_COMMENT,
                operator: IMPORT_COND_OP_STRING_INCLUDES,
                value: 'MOBILE',
                flags: 0,
            }, {
                field_id: IMPORT_COND_FIELD_MAIN_ACCOUNT,
                operator: IMPORT_COND_OP_EQUAL,
                value: App.scenario.ACC_3,
                flags: 0,
            }],
            actions: [{
                action_id: IMPORT_ACTION_SET_TR_TYPE,
                value: 'income',
            }, {
                action_id: IMPORT_ACTION_SET_COMMENT,
                value: 'Mobile',
            }],
        },
        /** Main account is not 'ACC_EUR' and transaction amount = 80
         *  Set type to 'Transfer from' and set account to 'ACC_USD'
         */
        {
            flags: 0,
            conditions: [{
                field_id: IMPORT_COND_FIELD_MAIN_ACCOUNT,
                operator: IMPORT_COND_OP_NOT_EQUAL,
                value: App.scenario.ACC_EUR,
                flags: 0,
            }, {
                field_id: IMPORT_COND_FIELD_TR_AMOUNT,
                operator: IMPORT_COND_OP_EQUAL,
                value: 80,
                flags: 0,
            }],
            actions: [{
                action_id: IMPORT_ACTION_SET_TR_TYPE,
                value: 'transferfrom',
            }, {
                action_id: IMPORT_ACTION_SET_ACCOUNT,
                value: App.scenario.ACC_EUR,
            }],
        },
        /** Main account is not 'ACC_USD', comment includes 'SIGMA' and
         *  transaction amount < 0
         *  Set type to 'Transfer to', set account to 'ACC_USD' and
         *  set comment 'Local shop'
         */
        {
            flags: 0,
            conditions: [{
                field_id: IMPORT_COND_FIELD_MAIN_ACCOUNT,
                operator: IMPORT_COND_OP_NOT_EQUAL,
                value: App.scenario.ACC_USD,
                flags: 0,
            }, {
                field_id: IMPORT_COND_FIELD_COMMENT,
                operator: IMPORT_COND_OP_STRING_INCLUDES,
                value: 'SIGMA',
                flags: 0,
            }, {
                field_id: IMPORT_COND_FIELD_TR_AMOUNT,
                operator: IMPORT_COND_OP_LESS,
                value: 0,
                flags: 0,
            }],
            actions: [{
                action_id: IMPORT_ACTION_SET_TR_TYPE,
                value: 'transferto',
            }, {
                action_id: IMPORT_ACTION_SET_ACCOUNT,
                value: App.scenario.ACC_USD,
            }, {
                action_id: IMPORT_ACTION_SET_COMMENT,
                value: 'Local shop',
            }],
        },
        /** Comment includes 'TAXI' and -100 < account amount < 500
         *  Set type to 'Debt from', set person to 'MARIA' and
         *  set empty comment
         */
        {
            flags: 0,
            conditions: [{
                field_id: IMPORT_COND_FIELD_COMMENT,
                operator: IMPORT_COND_OP_STRING_INCLUDES,
                value: 'TAXI',
                flags: 0,
            }, {
                field_id: IMPORT_COND_FIELD_TR_AMOUNT,
                operator: IMPORT_COND_OP_GREATER,
                value: -100,
                flags: 0,
            }, {
                field_id: IMPORT_COND_FIELD_TR_AMOUNT,
                operator: IMPORT_COND_OP_LESS,
                value: 500,
                flags: 0,
            }],
            actions: [{
                action_id: IMPORT_ACTION_SET_TR_TYPE,
                value: 'debtfrom',
            }, {
                action_id: IMPORT_ACTION_SET_PERSON,
                value: App.scenario.MARIA,
            }, {
                action_id: IMPORT_ACTION_SET_COMMENT,
                value: 'Taxi for Maria',
            }],
        },
        /** Comment includes 'MAGAZIN'
         *  Set type to 'Debt to' and set person 'IVAN'
         */
        {
            flags: 0,
            conditions: [{
                field_id: IMPORT_COND_FIELD_COMMENT,
                operator: IMPORT_COND_OP_STRING_INCLUDES,
                value: 'MAGAZIN',
                flags: 0,
            }],
            actions: [{
                action_id: IMPORT_ACTION_SET_TR_TYPE,
                value: 'debtto',
            }, {
                action_id: IMPORT_ACTION_SET_PERSON,
                value: App.scenario.IVAN,
            }],
        },
        /** Comment includes 'BOOKING' and amount not equal to transaction amount
         *  Set destination amount '500.5'
         */
        {
            flags: 0,
            conditions: [{
                field_id: IMPORT_COND_FIELD_COMMENT,
                operator: IMPORT_COND_OP_STRING_INCLUDES,
                value: 'BOOKING',
                flags: 0,
            }, {
                field_id: IMPORT_COND_FIELD_ACC_AMOUNT,
                operator: IMPORT_COND_OP_NOT_EQUAL,
                value: IMPORT_COND_FIELD_TR_AMOUNT,
                flags: IMPORT_COND_OP_FIELD_FLAG,
            }],
            actions: [{
                action_id: IMPORT_ACTION_SET_DEST_AMOUNT,
                value: '500.5',
            }],
        }];

    await App.scenario.runner.runGroup(api.importrule.create, rulesList);

    await App.state.fetch();
};
