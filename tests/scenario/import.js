import {
    IMPORT_COND_FIELD_MAIN_ACCOUNT,
    IMPORT_COND_FIELD_ACC_AMOUNT,
    IMPORT_COND_FIELD_TR_AMOUNT,
    IMPORT_COND_FIELD_DATE,
    IMPORT_COND_FIELD_COMMENT,
    IMPORT_COND_OP_EQUAL,
    IMPORT_COND_OP_NOT_EQUAL,
    IMPORT_COND_OP_STRING_INCLUDES,
    IMPORT_COND_OP_LESS,
    IMPORT_COND_OP_GREATER,
} from '../model/ImportCondition.js';
import {
    IMPORT_ACTION_SET_TR_TYPE,
    IMPORT_ACTION_SET_ACCOUNT,
    IMPORT_ACTION_SET_PERSON,
    IMPORT_ACTION_SET_SRC_AMOUNT,
    IMPORT_ACTION_SET_DEST_AMOUNT,
    IMPORT_ACTION_SET_COMMENT,
} from '../model/ImportAction.js';
import { generateCSV } from '../model/import.js';
import * as ApiTests from '../run/api.js';
import * as ImportTests from '../run/import.js';
import { App } from '../Application.js';
import { setBlock } from '../env.js';

let scenario = null;
let csvStatement = null;
let uploadFilename = null;

async function runSubmitImportTests() {
    await ImportTests.submit();
    // Verify submit is disabled for empty list
    setBlock('Verify submit is disabled for empty list', 2);
    await ImportTests.submit();

    setBlock('Verify invalid items are not submitted', 2);
    // Empty amount
    await ImportTests.addItem();
    await ImportTests.submit();

    // Zero amount
    await ImportTests.updateItem({
        pos: 0,
        action: { action: 'inputAmount', data: '0' },
    });
    await ImportTests.submit();

    // Valid amount, different currencies and empty dest amount
    await ImportTests.updateItem({
        pos: 0,
        action: [
            { action: 'inputAmount', data: '1' },
            { action: 'changeCurrency', data: scenario.USD },
        ],
    });
    await ImportTests.submit();

    // Empty date
    await ImportTests.updateItem({
        pos: 0,
        action: { action: 'inputDestAmount', data: '2' },
    });
    await ImportTests.submit();

    // Invalida date
    await ImportTests.updateItem({
        pos: 0,
        action: { action: 'inputDate', data: '2.ssa' },
    });
    await ImportTests.submit();

    // Correct date
    await ImportTests.updateItem({
        pos: 0,
        action: { action: 'inputDate', data: App.dates.now },
    });
    await ImportTests.submit();

    // Verify submit is disabled for list with no enabled items
    setBlock('Verify submit is disabled for list with no enabled items', 2);
    await ImportTests.uploadFile({
        filename: uploadFilename,
        data: csvStatement,
    });
    await ImportTests.submitUploaded({
        data: csvStatement,
        template: 0,
    });
    await ImportTests.enableItems({
        index: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
        value: false,
    });
    await ImportTests.submit();
}

async function runCreateImportItemTests() {
    setBlock('Add item', 2);

    await ImportTests.addItem();
    await ImportTests.updateItem({
        pos: 0,
        action: [
            { action: 'inputAmount', data: '1' },
            { action: 'inputDate', data: App.dates.now },
        ],
    });
}

async function runDeleteImportItemTests() {
    await ImportTests.deleteItems([3, 5]);
}

async function runImportItemStateLoop() {
    const { RUB, USD } = scenario;

    setBlock('Import item state loop', 2);

    await ImportTests.changeMainAccount(scenario.ACC_3);

    await ImportTests.updateItem({
        pos: 0,
        action: [
            { action: 'changeCurrency', data: USD }, // 1-2
            { action: 'changeCurrency', data: RUB }, // 2-1
            { action: 'changeType', data: 'income' }, // 1-3
            { action: 'changeType', data: 'expense' }, // 3-1
            { action: 'changeType', data: 'transferfrom' }, // 1-5
            { action: 'changeType', data: 'expense' }, // 5-1
            { action: 'changeType', data: 'transferto' }, // 1-7
            { action: 'changeType', data: 'expense' }, // 7-1
            { action: 'changeType', data: 'debtfrom' }, // 1-9
            { action: 'changeType', data: 'expense' }, // 9-1
            { action: 'changeType', data: 'debtto' }, // 1-10
            { action: 'changeType', data: 'expense' }, // 10-1
            { action: 'changeType', data: 'income' }, // 1-3
            { action: 'changeCurrency', data: USD }, // 3-4
            { action: 'changeType', data: 'expense' }, // 4-2
            { action: 'changeType', data: 'income' }, // 2-4
            { action: 'changeCurrency', data: RUB }, // 4-3
            { action: 'changeType', data: 'transferfrom' }, // 3-5
            { action: 'changeType', data: 'income' }, // 5-3
            { action: 'changeType', data: 'transferto' }, // 3-7
            { action: 'changeType', data: 'income' }, // 7-3
            { action: 'changeType', data: 'debtfrom' }, // 3-9
            { action: 'changeType', data: 'income' }, // 9-3
            { action: 'changeType', data: 'debtto' }, // 3-10
            { action: 'changeType', data: 'income' }, // 10-3
            { action: 'changeCurrency', data: USD }, // 3-4
            { action: 'changeType', data: 'expense' }, // 4-2
            { action: 'changeType', data: 'transferfrom' }, // 2-5
            { action: 'changeType', data: 'transferto' }, // 5-7
            { action: 'changeType', data: 'transferfrom' }, // 7-5
            { action: 'changeType', data: 'debtfrom' }, // 5-9
            { action: 'changeType', data: 'transferfrom' }, // 9-5
            { action: 'changeType', data: 'debtto' }, // 5-10
            { action: 'changeType', data: 'transferfrom' }, // 10-5
            { action: 'changeType', data: 'expense' }, // 5-1
            { action: 'changeCurrency', data: USD }, // 1-2
            { action: 'changeType', data: 'transferto' }, // 2-7
            { action: 'changeType', data: 'debtfrom' }, // 7-9
            { action: 'changeType', data: 'transferto' }, // 9-7
            { action: 'changeType', data: 'debtto' }, // 7-10
            { action: 'changeType', data: 'income' }, // 10-3
            { action: 'changeCurrency', data: USD }, // 3-4
            { action: 'changeType', data: 'transferfrom' }, // 4-5
            { action: 'changeDestAccount', data: scenario.ACC_USD }, // 5-6
            { action: 'changeType', data: 'expense' }, // 6-1
            { action: 'changeType', data: 'transferfrom' }, // 1-5
            { action: 'changeDestAccount', data: scenario.ACC_USD }, // 5-6
            { action: 'changeType', data: 'income' }, // 6-3
            { action: 'changeType', data: 'transferfrom' }, // 3-5
            { action: 'changeDestAccount', data: scenario.ACC_USD }, // 5-6
            { action: 'changeDestAccount', data: scenario.ACC_RUB }, // 6-5
            { action: 'changeDestAccount', data: scenario.ACC_USD }, // 5-6
            { action: 'changeType', data: 'transferto' }, // 6-8
            { action: 'changeType', data: 'expense' }, // 8-1
            { action: 'changeType', data: 'transferto' }, // 1-7
            { action: 'changeDestAccount', data: scenario.ACC_USD }, // 7-8
            { action: 'changeType', data: 'income' }, // 8-3
            { action: 'changeCurrency', data: USD }, // 3-4
            { action: 'changeType', data: 'transferto' }, // 4-7
            { action: 'changeDestAccount', data: scenario.ACC_USD }, // 7-8
        ],
    });

    /** Prepare items of all states */
    await ImportTests.updateItem({
        pos: 1,
        action: [
            { action: 'changeCurrency', data: USD }, // 1-2
            { action: 'inputDestAmount', data: '50.03' },
        ],
    });
    await ImportTests.updateItem({
        pos: 2,
        action: { action: 'changeType', data: 'income' }, // 1-3
    });
    await ImportTests.updateItem({
        pos: 3,
        action: [
            { action: 'changeCurrency', data: USD }, // 1-2
            { action: 'changeType', data: 'income' }, // 2-4
            { action: 'inputDestAmount', data: '500' },
        ],
    });
    await ImportTests.updateItem({
        pos: 4,
        action: { action: 'changeType', data: 'transferfrom' }, // 1-5
    });
    await ImportTests.updateItem({
        pos: 5,
        action: [
            { action: 'changeType', data: 'transferfrom' }, // 1-5
            { action: 'changeDestAccount', data: scenario.ACC_USD }, // 5-6
            { action: 'inputDestAmount', data: '50.03' },
        ],
    });
    await ImportTests.updateItem({
        pos: 6,
        action: { action: 'changeType', data: 'transferto' }, // 1-7
    });
    await ImportTests.updateItem({
        pos: 7,
        action: [
            { action: 'changeType', data: 'debtfrom' }, // 1-9
            { action: 'changePerson', data: scenario.ALEX },
        ],
    });
    await ImportTests.updateItem({
        pos: 8,
        action: { action: 'changeType', data: 'debtto' }, // 1-10
    });
    await ImportTests.changeMainAccount(scenario.ACC_EUR);
    await ImportTests.updateItem({
        pos: 0,
        action: [
            { action: 'changeType', data: 'transferto' },
            { action: 'changeDestAccount', data: scenario.ACC_3 }, // 8-8
        ],
    });
    await ImportTests.changeMainAccount(scenario.ACC_3); // for item 0: 8-1
    await ImportTests.updateItem({
        pos: 0,
        action: [
            { action: 'changeType', data: 'transferto' }, // 1-6
            { action: 'changeDestAccount', data: scenario.ACC_USD }, // 7-8
            { action: 'changeType', data: 'transferfrom' }, // 8-6
            { action: 'changeType', data: 'debtfrom' }, // 6-9
            { action: 'changeType', data: 'debtto' }, // 9-10
            { action: 'changeType', data: 'transferto' }, // 10-7
            { action: 'changeDestAccount', data: scenario.ACC_USD }, // 7-8
            { action: 'changeType', data: 'debtfrom' }, // 8-9
            { action: 'changeType', data: 'income' }, // 9-3
            { action: 'changeCurrency', data: USD }, // 3-4
            { action: 'changeType', data: 'debtfrom' }, // 4-9
            { action: 'changeType', data: 'income' }, // 9-3
            { action: 'changeCurrency', data: USD }, // 3-4
            { action: 'changeType', data: 'debtto' }, // 4-10
            { action: 'changeType', data: 'debtfrom' }, // 10-9
            { action: 'changeType', data: 'transferfrom' }, // 9-5
            { action: 'changeDestAccount', data: scenario.ACC_USD }, // 5-6
            { action: 'changeType', data: 'debtto' }, // 6-10
            { action: 'changeType', data: 'transferto' }, // 10-7
            { action: 'changeDestAccount', data: scenario.ACC_USD }, // 7-8
            { action: 'changeType', data: 'debtto' }, // 8-10
            { action: 'changeType', data: 'expense' }, // 10-1
            { action: 'changeCurrency', data: USD }, // 1-2
            { action: 'changeType', data: 'debtfrom' }, // 2-9
            { action: 'changeType', data: 'expense' }, // 9-1
            { action: 'changeCurrency', data: USD }, // 1-2
            { action: 'changeType', data: 'debtto' }, // 2-10
        ],
    });

    await ImportTests.updateItem({
        pos: 7,
        action: [
            { action: 'changeType', data: 'debtto' },
            { action: 'changePerson', data: scenario.MARIA },
        ],
    });

    await ImportTests.submit();
}

// Create import template tests
async function runCreateImportTemplateTests() {
    setBlock('Create import template', 2);
    // Select columns for template
    await scenario.runner.runGroup(ImportTests.selectTemplateColumn, [
        { column: 'accountAmount', index: 11 },
        { column: 'transactionAmount', index: 9 },
        { column: 'accountCurrency', index: 10 },
        { column: 'transactionCurrency', index: 8 },
        { column: 'date', index: 1 },
        { column: 'comment', index: 2 },
    ]);
    // Input template name and save
    await ImportTests.inputTemplateName('Template_1');
    await ImportTests.submitTemplate();

    // Create another template
    await ImportTests.createTemplate();
    await scenario.runner.runGroup(ImportTests.selectTemplateColumn, [
        { column: 'accountAmount', index: 11 },
        { column: 'transactionAmount', index: 9 },
        { column: 'accountCurrency', index: 10 },
        { column: 'transactionCurrency', index: 8 },
        { column: 'date', index: 1 },
        { column: 'comment', index: 4 },
    ]);
    await ImportTests.inputTemplateName('Template_dup');
    await ImportTests.submitTemplate();
}

// Update import template tests
async function runUpdateImportTemplateTests() {
    setBlock('Update import template', 2);

    await ImportTests.selectTemplateByIndex(0);
    await ImportTests.updateTemplate();
    await ImportTests.inputTemplateName('Template_2');
    await scenario.runner.runGroup(ImportTests.selectTemplateColumn, [
        { column: 'transactionAmount', index: 11 },
        { column: 'transactionCurrency', index: 10 },
    ]);
    await ImportTests.submitTemplate();
}

// Delete import template tests
async function runDeleteImportTemplateTests() {
    setBlock('Delete import template', 2);

    await ImportTests.selectTemplateByIndex(0);
    await ImportTests.deleteTemplate();
}

// Import templates
async function runImportTemplateTests() {
    await runCreateImportTemplateTests();
    await runUpdateImportTemplateTests();
    await runDeleteImportTemplateTests();
}

// Import rule validation tests
async function runImportRuleValidationTests() {
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

    setBlock('Submit duplicate actions', 2);
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_COMMENT },
        { action: 'inputValue', data: 'New comment' },
    ]);
    await ImportTests.submitRule();

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

    setBlock('Submit `Set person` action without set transaction type to debt', 2);
    await ImportTests.updateRuleAction({
        pos: 0,
        action: [
            { action: 'changeAction', data: IMPORT_ACTION_SET_PERSON },
            { action: 'changePerson', data: scenario.MARIA },
        ],
    });
    await ImportTests.submitRule();

    setBlock('Submit `Set account` action without set transaction type to transfer', 2);
    await ImportTests.updateRuleAction({
        pos: 0,
        action: [
            { action: 'changeAction', data: IMPORT_ACTION_SET_ACCOUNT },
            { action: 'changeAccount', data: scenario.ACC_3 },
        ],
    });
    await ImportTests.submitRule();

    setBlock('Submit rule without guard condition for `Set account` action', 2);
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_TR_TYPE },
        { action: 'changeTransactionType', data: 'transferfrom' },
    ]);
    await ImportTests.submitRule();

    await ImportTests.cancelRule();
}

// Create import rule tests
async function runCreateImportRuleTests() {
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
        { action: 'changeAccount', data: scenario.ACC_EUR },
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
        { action: 'changeAccount', data: scenario.ACC_EUR },
    ]);
    await ImportTests.submitRule();

    setBlock('Create import rule #3', 2);
    await ImportTests.createRule();
    await ImportTests.createRuleCondition([
        { action: 'changeFieldType', data: IMPORT_COND_FIELD_MAIN_ACCOUNT },
        { action: 'changeOperator', data: IMPORT_COND_OP_NOT_EQUAL },
        { action: 'changeAccount', data: scenario.ACC_USD },
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
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_TR_TYPE },
        { action: 'changeTransactionType', data: 'transferto' },
    ]);
    await ImportTests.createRuleAction([
        { action: 'changeAction', data: IMPORT_ACTION_SET_ACCOUNT },
        { action: 'changeAccount', data: scenario.ACC_USD },
    ]);
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
        { action: 'changePerson', data: scenario.MARIA },
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
        { action: 'changePerson', data: scenario.ALEX },
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
}

// Update import rule tests
async function runUpdateImportRuleTests() {
    setBlock('Update import rules', 1);

    setBlock('Update import rule #1', 2);
    await ImportTests.updateRule(0);
    await ImportTests.createRuleCondition([
        { action: 'changeFieldType', data: IMPORT_COND_FIELD_MAIN_ACCOUNT },
        { action: 'changeOperator', data: IMPORT_COND_OP_EQUAL },
        { action: 'changeAccount', data: scenario.ACC_3 },
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
}

// Delete import rule tests
async function runDeleteImportRuleTests() {
    setBlock('Delete import rules', 1);
    // Delete rule #3
    await ImportTests.deleteRule(2);
}

// Import rules
async function runImportRuleTests() {
    setBlock('Import rules', 1);
    await ImportTests.openRulesDialog();

    await runImportRuleValidationTests();
    await runCreateImportRuleTests();
    await runUpdateImportRuleTests();
    await runDeleteImportRuleTests();

    await ImportTests.closeRulesDialog();
}

export const importTests = {
    /** Initialize tests */
    init(scenarioInstance) {
        scenario = scenarioInstance;
    },

    /** Upload CSV file for import tests */
    async prepare() {
        // Login as admin to upload CSV file
        await ApiTests.loginTest(App.config.testAdminUser);

        const now = new Date();
        csvStatement = generateCSV([
            [now, 'MOBILE', 'MOSKVA', 'RU', 'RUB', '-500.00'],
            [now, 'SALON', 'SANKT-PETERBU', 'RU', 'RUB', '-80.00'],
            [now, 'OOO SIGMA', 'MOSKVA', 'RU', 'RUB', '-128.00'],
            [now, 'TAXI', 'MOSKVA', 'RU', 'RUB', '-188.00'],
            [now, 'TAXI', 'MOSKVA', 'RU', 'RUB', '-306.00'],
            [now, 'MAGAZIN', 'SANKT-PETERBU', 'RU', 'RUB', '-443.00'],
            [now, 'BAR', 'SANKT-PETERBU', 'RU', 'RUB', '-443.00'],
            [now, 'DOSTAVKA', 'SANKT-PETERBU', 'RU', 'RUB', '-688.00'],
            [now, 'PRODUCTY', 'SANKT-PETERBU', 'RU', 'RUB', '-550.5'],
            [now, 'BOOKING', 'AMSTERDAM', 'NL', 'EUR', '-500.00', 'RUB', '-50750.35'],
            [now, 'SALARY', 'MOSKVA', 'RU', 'RUB', '100000.00'],
            [now, 'INTEREST', 'SANKT-PETERBU', 'RU', 'RUB', '23.16'],
            [now, 'RBA R-BANK', 'SANKT-PETERBU', 'RU', 'RUB', '-5000.00'],
            [now, 'C2C R-BANK', 'SANKT-PETERBU', 'RU', 'RUB', '-10000.00'],
        ]);

        uploadFilename = await ImportTests.putFile(csvStatement);
        if (!uploadFilename) {
            throw new Error('Fail to put file');
        }

        await ApiTests.loginTest(App.config.testUser);
    },

    /** Remove previously uploaded file */
    async clean() {
        await ApiTests.loginTest(App.config.testAdminUser);
        await ImportTests.removeFile(uploadFilename);
        uploadFilename = null;
        await ApiTests.loginTest(App.config.testUser);
    },

    /** Run import view tests */
    async run() {
        setBlock('Import', 1);

        await this.prepare();

        const accIndexes = App.state.getAccountIndexesByNames([
            'acc_3', 'acc RUB', 'acc USD', 'acc EUR',
        ]);
        [
            scenario.ACC_3,
            scenario.ACC_RUB,
            scenario.ACC_USD,
            scenario.ACC_EUR,
        ] = App.state.getAccountsByIndexes(accIndexes);
        const personIndexes = App.state.getPersonIndexesByNames([
            'Maria', 'Alex',
        ]);
        [scenario.MARIA, scenario.ALEX] = App.state.getPersonsByIndexes(personIndexes);

        await ImportTests.checkInitialState();
        await runImportRuleTests();
        await runCreateImportItemTests();

        // Upload CSV file
        setBlock('Upload CSV', 2);
        await ImportTests.uploadFile({
            filename: uploadFilename,
            data: csvStatement,
        });

        await runImportTemplateTests();

        // Submit converted transactions
        await ImportTests.submitUploaded({
            data: csvStatement,
            account: scenario.ACC_RUB,
        });
        // Delete all
        setBlock('Delete all items', 2);
        await ImportTests.deleteAllItems();

        // Enable/disable rules
        setBlock('Enable/disable rules', 2);
        // Upload again
        await ImportTests.uploadFile({
            filename: uploadFilename,
            data: csvStatement,
        });
        await ImportTests.submitUploaded({
            data: csvStatement,
            account: scenario.ACC_RUB,
        });

        await ImportTests.enableRules(false);
        await ImportTests.enableRules(true);

        // Disable all items except 0 and 1
        await ImportTests.enableItems({
            index: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
            value: false,
        });
        await runDeleteImportItemTests();
        await runSubmitImportTests();
        await runImportItemStateLoop();

        await this.clean();
    },

    /** Initialize and run tests */
    async initAndRun(scenarioInstance) {
        this.init(scenarioInstance);
        await this.run();
    },
};
