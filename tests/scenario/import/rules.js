import { setBlock } from 'jezve-test';
import {
    IMPORT_COND_FIELD_MAIN_ACCOUNT,
    IMPORT_COND_FIELD_TPL,
    IMPORT_COND_FIELD_ACC_AMOUNT,
    IMPORT_COND_FIELD_TR_AMOUNT,
    IMPORT_COND_FIELD_DATE,
    IMPORT_COND_FIELD_COMMENT,
    IMPORT_COND_OP_EQUAL,
    IMPORT_COND_OP_NOT_EQUAL,
    IMPORT_COND_OP_STRING_INCLUDES,
    IMPORT_COND_OP_LESS,
    IMPORT_COND_OP_GREATER,
} from '../../model/ImportCondition.js';
import {
    IMPORT_ACTION_SET_TR_TYPE,
    IMPORT_ACTION_SET_ACCOUNT,
    IMPORT_ACTION_SET_PERSON,
    IMPORT_ACTION_SET_SRC_AMOUNT,
    IMPORT_ACTION_SET_DEST_AMOUNT,
    IMPORT_ACTION_SET_COMMENT,
} from '../../model/ImportAction.js';
import * as ImportTests from '../../run/import/index.js';
import { api } from '../../model/api.js';
import * as ImportRuleApiTests from '../../run/api/importrule.js';
import { App } from '../../Application.js';

// Import rule action form test for no persons
const noPersonTests = async () => {
    const { RUB } = App.scenario;

    setBlock('No persons test', 1);

    // Create at least one account
    await api.account.create({
        name: 'Test Account 1',
        curr_id: RUB,
        initbalance: '1',
        icon_id: 1,
        flags: 0,
    });
    // Remove all persons
    const personIds = App.state.persons.getIds();
    if (personIds.length > 0) {
        await api.person.del(personIds);
    }
    await App.state.fetch();

    await App.view.navigateToImport();

    await ImportTests.openRulesDialog();

    await ImportTests.createRule();
    await ImportTests.addRuleAction();

    await ImportTests.closeRulesDialog();
};

// Import rule validation tests
const runValidationTests = async () => {
    setBlock('Import rule validation', 1);

    setBlock('Submit empty rule', 2);
    await ImportTests.createRule();
    await ImportTests.submitRule();

    setBlock('Submit rule without actions', 2);
    await ImportTests.createRuleCondition([
        { action: 'changeFieldType', data: IMPORT_COND_FIELD_COMMENT },
        { action: 'changeOperator', data: IMPORT_COND_OP_STRING_INCLUDES },
        { action: 'inputValue', data: 'Bank Name' },
    ]);
    await ImportTests.submitRule();

    setBlock('Submit condition with empty amount', 2);
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_COMMENT },
        { action: 'inputValue', data: 'Ba' },
    ]);
    await ImportTests.createRuleCondition([
        { action: 'changeFieldType', data: IMPORT_COND_FIELD_ACC_AMOUNT },
        { action: 'changeOperator', data: IMPORT_COND_OP_GREATER },
    ]);
    await ImportTests.submitRule();
    await ImportTests.updateRuleCondition({
        pos: 1,
        action: { action: 'changeFieldType', data: IMPORT_COND_FIELD_TR_AMOUNT },
    });
    await ImportTests.submitRule();

    setBlock('Submit duplicate conditions', 2);
    await ImportTests.updateRuleCondition({
        pos: 1,
        action: [
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_ACC_AMOUNT },
            { action: 'inputAmount', data: '100.01' },
        ],
    });
    await ImportTests.createRuleCondition([
        { action: 'changeFieldType', data: IMPORT_COND_FIELD_ACC_AMOUNT },
        { action: 'changeOperator', data: IMPORT_COND_OP_GREATER },
        { action: 'inputAmount', data: '99.99' },
    ]);
    await ImportTests.submitRule();

    setBlock('Submit conditions with non-intersecting value regions', 2);
    await ImportTests.updateRuleCondition({
        pos: 2,
        action: { action: 'changeOperator', data: IMPORT_COND_OP_LESS },
    });
    await ImportTests.submitRule();
    await ImportTests.updateRuleCondition({
        pos: 2,
        action: { action: 'inputAmount', data: '999.99' },
    });
    await ImportTests.createRuleCondition([
        { action: 'changeFieldType', data: IMPORT_COND_FIELD_ACC_AMOUNT },
        { action: 'changeOperator', data: IMPORT_COND_OP_NOT_EQUAL },
        { action: 'inputAmount', data: '5' },
    ]);
    await ImportTests.submitRule();
    await ImportTests.deleteRuleCondition(3);
    await ImportTests.deleteRuleAction(0);

    setBlock('Check available actions', 2);
    // Check available actions if type of `Set transaction type` action is
    // 'transferfrom' or 'transferto'
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_TR_TYPE },
        { action: 'changeTransactionType', data: 'transferfrom' },
    ]);
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_ACCOUNT },
    ]);

    // Check available actions if type of `Set transaction type` action is
    // 'debtfrom' or 'debtto'
    await ImportTests.updateRuleAction({
        pos: 0,
        action: { action: 'changeTransactionType', data: 'debtfrom' },
    });
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_PERSON },
    ]);

    // Check `Set person` action is removed if change type of `Set transaction type` action
    // to 'expense'
    await ImportTests.updateRuleAction({
        pos: 0,
        action: { action: 'changeTransactionType', data: 'expense' },
    });

    // Check `Set account` action is removed if remove `Set transaction type` action
    await ImportTests.updateRuleAction({
        pos: 0,
        action: { action: 'changeTransactionType', data: 'transferfrom' },
    });
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_ACCOUNT },
    ]);
    await ImportTests.deleteRuleAction(0);

    // Check `Set person` action is removed if remove `Set transaction type` action
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_TR_TYPE },
        { action: 'changeTransactionType', data: 'debtfrom' },
    ]);
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_PERSON },
    ]);
    await ImportTests.deleteRuleAction(0);

    // Check `Set account` action is removed if change type of `Set transaction type` action to
    // any value except 'transferfrom' and 'transferto'
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_TR_TYPE },
        { action: 'changeTransactionType', data: 'transferfrom' },
    ]);
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_ACCOUNT },
    ]);
    await ImportTests.updateRuleAction({
        pos: 0,
        action: { action: 'changeAction', data: IMPORT_ACTION_SET_SRC_AMOUNT },
    });

    // Check available actions after remove `Set transaction type` action
    await ImportTests.updateRuleAction({
        pos: 0,
        action: { action: 'changeAction', data: IMPORT_ACTION_SET_TR_TYPE },
    });
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_COMMENT },
    ]);
    await ImportTests.deleteRuleAction(0);

    // Check available actions are correctly set even if changed order
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_TR_TYPE },
    ]);

    setBlock('Submit empty amount action', 2);
    await ImportTests.updateRuleAction({
        pos: 1,
        action: { action: 'changeAction', data: IMPORT_ACTION_SET_SRC_AMOUNT },
    });
    await ImportTests.submitRule();
    await ImportTests.updateRuleAction({
        pos: 1,
        action: { action: 'changeAction', data: IMPORT_ACTION_SET_DEST_AMOUNT },
    });
    await ImportTests.submitRule();

    setBlock('Submit zero amount action', 2);
    await ImportTests.updateRuleAction({
        pos: 1,
        action: { action: 'inputAmount', data: '0.' },
    });
    await ImportTests.submitRule();
    await ImportTests.updateRuleAction({
        pos: 1,
        action: { action: 'changeAction', data: IMPORT_ACTION_SET_SRC_AMOUNT },
    });
    await ImportTests.submitRule();

    setBlock('Submit negative amount action', 2);
    await ImportTests.updateRuleAction({
        pos: 1,
        action: { action: 'inputAmount', data: '-10.' },
    });
    await ImportTests.submitRule();
    await ImportTests.updateRuleAction({
        pos: 1,
        action: { action: 'changeAction', data: IMPORT_ACTION_SET_DEST_AMOUNT },
    });
    await ImportTests.submitRule();
    await ImportTests.deleteRuleAction(1);

    setBlock('Submit rule without conditions', 2);
    await ImportTests.deleteRuleCondition(2);
    await ImportTests.deleteRuleCondition(1);
    await ImportTests.deleteRuleCondition(0);
    await ImportTests.submitRule();

    setBlock('Submit `Comment includes` condition with empty value', 2);
    await ImportTests.createRuleCondition([
        { action: 'changeFieldType', data: IMPORT_COND_FIELD_COMMENT },
        { action: 'changeOperator', data: IMPORT_COND_OP_STRING_INCLUDES },
    ]);
    await ImportTests.submitRule();

    setBlock('Submit date condition with empty value', 2);
    await ImportTests.updateRuleCondition({
        pos: 0,
        action: [
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_DATE },
            { action: 'changeOperator', data: IMPORT_COND_OP_GREATER },
        ],
    });

    setBlock('Submit Date condition with invalid value', 2);
    await ImportTests.updateRuleCondition({
        pos: 0,
        action: { action: 'inputValue', data: '01xx' },
    });
    await ImportTests.submitRule();

    setBlock('Submit rule without guard condition for `Set account` action', 2);
    await ImportTests.deleteRuleAction(0);
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_TR_TYPE },
        { action: 'changeTransactionType', data: 'transferfrom' },
    ]);
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_ACCOUNT },
        { action: 'changeAccount', data: App.scenario.ACC_3 },
    ]);
    await ImportTests.submitRule();

    await ImportTests.cancelRule();
};

// Create import rule tests
const runCreateTests = async () => {
    setBlock('Create import rules', 1);

    setBlock('Create import rule #1', 2);
    await ImportTests.createRule();
    await ImportTests.createRuleCondition([
        { action: 'changeFieldType', data: IMPORT_COND_FIELD_COMMENT },
        { action: 'changeOperator', data: IMPORT_COND_OP_STRING_INCLUDES },
        { action: 'inputValue', data: 'MOBILE' },
    ]);
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_TR_TYPE },
        { action: 'changeTransactionType', data: 'income' },
    ]);
    await ImportTests.submitRule();

    setBlock('Create import rule #2', 2);
    await ImportTests.createRule();
    await ImportTests.createRuleCondition([
        { action: 'changeFieldType', data: IMPORT_COND_FIELD_MAIN_ACCOUNT },
        { action: 'changeOperator', data: IMPORT_COND_OP_NOT_EQUAL },
        { action: 'changeAccount', data: App.scenario.ACC_EUR },
    ]);
    await ImportTests.createRuleCondition([
        { action: 'changeFieldType', data: IMPORT_COND_FIELD_TR_AMOUNT },
        { action: 'changeOperator', data: IMPORT_COND_OP_EQUAL },
        { action: 'inputAmount', data: '80' },
    ]);
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_TR_TYPE },
        { action: 'changeTransactionType', data: 'transferfrom' },
    ]);
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_ACCOUNT },
        { action: 'changeAccount', data: App.scenario.ACC_EUR },
    ]);
    await ImportTests.submitRule();

    setBlock('Create import rule #3', 2);
    await ImportTests.createRule();
    await ImportTests.createRuleCondition([
        { action: 'changeFieldType', data: IMPORT_COND_FIELD_MAIN_ACCOUNT },
        { action: 'changeOperator', data: IMPORT_COND_OP_NOT_EQUAL },
        { action: 'changeAccount', data: App.scenario.ACC_USD },
    ]);
    await ImportTests.createRuleCondition([
        { action: 'changeFieldType', data: IMPORT_COND_FIELD_COMMENT },
        { action: 'changeOperator', data: IMPORT_COND_OP_STRING_INCLUDES },
        { action: 'inputValue', data: 'SIGMA' },
    ]);
    await ImportTests.createRuleCondition([
        { action: 'changeFieldType', data: IMPORT_COND_FIELD_TR_AMOUNT },
        { action: 'changeOperator', data: IMPORT_COND_OP_LESS },
        { action: 'inputAmount', data: '0' },
    ]);
    // Create `Set account` action before `Set transaction type` to check actions sort
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_COMMENT },
    ]);
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_TR_TYPE },
        { action: 'changeTransactionType', data: 'transferto' },
    ]);
    await ImportTests.updateRuleAction({
        pos: 0,
        action: [
            { action: 'changeAction', data: IMPORT_ACTION_SET_ACCOUNT },
            { action: 'changeAccount', data: App.scenario.ACC_USD },
        ],
    });
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_COMMENT },
        { action: 'inputValue', data: 'Local shop' },
    ]);
    await ImportTests.submitRule();

    setBlock('Create import rule #4', 2);
    await ImportTests.createRule();
    await ImportTests.createRuleCondition([
        { action: 'changeFieldType', data: IMPORT_COND_FIELD_COMMENT },
        { action: 'changeOperator', data: IMPORT_COND_OP_STRING_INCLUDES },
        { action: 'inputValue', data: 'TAXI' },
    ]);
    await ImportTests.createRuleCondition([
        { action: 'changeFieldType', data: IMPORT_COND_FIELD_ACC_AMOUNT },
        { action: 'changeOperator', data: IMPORT_COND_OP_GREATER },
        { action: 'inputAmount', data: '-100' },
    ]);
    await ImportTests.createRuleCondition([
        { action: 'changeFieldType', data: IMPORT_COND_FIELD_ACC_AMOUNT },
        { action: 'changeOperator', data: IMPORT_COND_OP_LESS },
        { action: 'inputAmount', data: '500' },
    ]);
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_TR_TYPE },
        { action: 'changeTransactionType', data: 'debtfrom' },
    ]);
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_PERSON },
        { action: 'changePerson', data: App.scenario.MARIA },
    ]);
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_COMMENT },
        { action: 'inputValue', data: '' },
    ]);
    await ImportTests.submitRule();

    setBlock('Create import rule #5', 2);
    await ImportTests.createRule();
    await ImportTests.createRuleCondition([
        { action: 'changeFieldType', data: IMPORT_COND_FIELD_COMMENT },
        { action: 'changeOperator', data: IMPORT_COND_OP_STRING_INCLUDES },
        { action: 'inputValue', data: 'MAGAZIN' },
    ]);
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_TR_TYPE },
        { action: 'changeTransactionType', data: 'debtto' },
    ]);
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_PERSON },
        { action: 'changePerson', data: App.scenario.ALEX },
    ]);
    await ImportTests.submitRule();

    setBlock('Create import rule #6', 2);
    await ImportTests.createRule();
    await ImportTests.createRuleCondition([
        { action: 'changeFieldType', data: IMPORT_COND_FIELD_COMMENT },
        { action: 'changeOperator', data: IMPORT_COND_OP_STRING_INCLUDES },
        { action: 'inputValue', data: 'AMSTERDAM' },
    ]);
    await ImportTests.createRuleCondition([
        { action: 'changeFieldType', data: IMPORT_COND_FIELD_COMMENT },
        { action: 'changeOperator', data: IMPORT_COND_OP_STRING_INCLUDES },
        { action: 'inputValue', data: 'BOOKING' },
    ]);
    await ImportTests.createRuleCondition([
        { action: 'changeFieldType', data: IMPORT_COND_FIELD_ACC_AMOUNT },
        { action: 'changeOperator', data: IMPORT_COND_OP_NOT_EQUAL },
        { action: 'togglePropValue' },
        { action: 'changeProperty', data: IMPORT_COND_FIELD_TR_AMOUNT },
    ]);
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_COMMENT },
        { action: 'inputValue', data: 'Hotel, Booking' },
    ]);
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_DEST_AMOUNT },
        { action: 'inputAmount', data: '500.5' },
    ]);
    await ImportTests.submitRule();
};

// Update import rule tests
const runUpdateTests = async () => {
    setBlock('Update import rules', 1);

    setBlock('Update import rule #1', 2);
    await ImportTests.updateRule(0);
    await ImportTests.createRuleCondition([
        { action: 'changeFieldType', data: IMPORT_COND_FIELD_MAIN_ACCOUNT },
        { action: 'changeOperator', data: IMPORT_COND_OP_EQUAL },
        { action: 'changeAccount', data: App.scenario.ACC_3 },
    ]);
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_COMMENT },
        { action: 'inputValue', data: 'Mobile' },
    ]);
    await ImportTests.submitRule();

    setBlock('Update import rule #4', 2);
    await ImportTests.updateRule(3);
    await ImportTests.updateRuleCondition({
        pos: 1,
        action: { action: 'changeFieldType', data: IMPORT_COND_FIELD_TR_AMOUNT },
    });
    await ImportTests.updateRuleCondition({
        pos: 2,
        action: { action: 'changeFieldType', data: IMPORT_COND_FIELD_TR_AMOUNT },
    });
    await ImportTests.updateRuleAction({
        pos: 2,
        action: { action: 'inputValue', data: 'Taxi for Maria' },
    });
    await ImportTests.submitRule();

    setBlock('Update import rule #6', 2);
    await ImportTests.updateRule(5);
    await ImportTests.deleteRuleCondition(0);
    await ImportTests.deleteRuleAction(0);
    await ImportTests.submitRule();
};

// Delete import rule tests
const runDeleteTests = async () => {
    setBlock('Delete import rules', 1);
    // Delete rule #3
    await ImportTests.deleteRule(2);
};

// Search import rule tests
const runSearchTests = async () => {
    setBlock('Search import rules', 1);

    await ImportTests.inputRulesSearch('MOBILE');
    await ImportTests.inputRulesSearch('Taxi');
    await ImportTests.clearRulesSearch();
};

// Import rules paginator tests
const runPaginatorTests = async () => {
    setBlock('Import rules pagination', 1);

    const data = [];
    const RULES_TO_CREATE = 25;
    const ruleBase = {
        flags: 0,
        conditions: [{
            field_id: IMPORT_COND_FIELD_COMMENT,
            operator: IMPORT_COND_OP_EQUAL,
            value: '',
            flags: 0,
        }],
        actions: [{
            action_id: IMPORT_ACTION_SET_COMMENT,
            value: '',
        }],
    };

    for (let i = 1; i <= RULES_TO_CREATE; i += 1) {
        const rule = {
            ...ruleBase,
            conditions: [...ruleBase.conditions],
            actions: [...ruleBase.actions],
        };
        rule.conditions[0].value = `Cond ${i}`;
        rule.actions[0].value = `Act ${i}`;
        data.push(rule);
    }

    // Create rules via API
    const ruleIds = await App.scenario.runner.runGroup(ImportRuleApiTests.create, data);
    // Refresh page
    await App.view.navigateToImport();
    // Iterate rules list pages
    await ImportTests.iterateRulesList();
    // Remove previously created rules via API
    await ImportRuleApiTests.del(ruleIds);
    // Refresh page
    await App.view.navigateToImport();
};

// Create import rule with template condition
const runCreateTemplateRule = async (templateId) => {
    setBlock('Create import rule with template condition', 2);
    await ImportTests.createRule();
    await ImportTests.createRuleCondition([
        { action: 'changeFieldType', data: IMPORT_COND_FIELD_TPL },
        { action: 'changeOperator', data: IMPORT_COND_OP_EQUAL },
        { action: 'changeTemplate', data: templateId },
    ]);
    await ImportTests.createRuleCondition([
        { action: 'changeFieldType', data: IMPORT_COND_FIELD_COMMENT },
        { action: 'changeOperator', data: IMPORT_COND_OP_STRING_INCLUDES },
        { action: 'inputValue', data: 'SALARY' },
    ]);
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_COMMENT },
        { action: 'inputValue', data: 'Salary+Template' },
    ]);
    await ImportTests.submitRule();
};

export const importRuleTests = {
    /** Run import rules tests */
    async run() {
        setBlock('Import rules', 1);
        await ImportTests.openRulesDialog();

        await runValidationTests();
        await runCreateTests();
        await runUpdateTests();
        await runDeleteTests();
        await runSearchTests();
        await runPaginatorTests();
    },

    async createTemplateRule(templateId) {
        await ImportTests.openRulesDialog();

        await runCreateTemplateRule(templateId);

        await ImportTests.closeRulesDialog();
    },

    async runNoPersonsTest() {
        await noPersonTests();
    },
};
