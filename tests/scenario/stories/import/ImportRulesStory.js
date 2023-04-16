import {
    setBlock,
    assert,
    TestStory,
    copyObject,
} from 'jezve-test';
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
} from '../../../model/ImportCondition.js';
import {
    IMPORT_ACTION_SET_TR_TYPE,
    IMPORT_ACTION_SET_ACCOUNT,
    IMPORT_ACTION_SET_PERSON,
    IMPORT_ACTION_SET_SRC_AMOUNT,
    IMPORT_ACTION_SET_DEST_AMOUNT,
    IMPORT_ACTION_SET_COMMENT,
    IMPORT_ACTION_SET_CATEGORY,
} from '../../../model/ImportAction.js';
import { api } from '../../../model/api.js';
import * as ImportTests from '../../../run/import/index.js';
import * as ImportRuleApiTests from '../../../run/api/importrule.js';
import { testLocales } from '../../../run/locale.js';
import { App } from '../../../Application.js';

export class ImportRulesStory extends TestStory {
    async beforeRun() {
        await App.scenario.prepareTestUser();
        await App.scenario.resetData({
            accounts: true,
            persons: true,
            categories: true,
            transactions: true,
            importtpl: true,
            importrules: true,
        });

        await App.scenario.createAccounts();
        await App.scenario.createPersons();
        await App.scenario.createCategories();
        await App.scenario.createCsvFiles();
        await App.scenario.createImportTemplates();

        await App.view.navigateToImport();
    }

    async afterRun() {
        await App.scenario.removeCsvFiles();
    }

    async run() {
        setBlock('Import rules', 1);

        await ImportTests.openRulesDialog();

        await this.validation();
        await this.create();
        await this.update();
        await this.del();
        await this.search();
        await this.pagination();
        await this.createTemplateRule(0);
        await this.locales();
        await this.noPersonTests();
    }

    // Import rule validation tests
    async validation() {
        setBlock('Import rule validation', 1);

        const { ACC_3 } = App.scenario;

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
        // 'transfer_out' or 'transfer_in'
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_TR_TYPE },
            { action: 'changeTransactionType', data: 'transfer_out' },
        ]);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_ACCOUNT },
        ]);

        // Check available actions if type of `Set transaction type` action is
        // 'debt_out' or 'debt_in'
        await ImportTests.updateRuleAction({
            pos: 0,
            action: { action: 'changeTransactionType', data: 'debt_out' },
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
            action: { action: 'changeTransactionType', data: 'transfer_out' },
        });
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_ACCOUNT },
        ]);
        await ImportTests.deleteRuleAction(0);

        // Check `Set person` action is removed if remove `Set transaction type` action
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_TR_TYPE },
            { action: 'changeTransactionType', data: 'debt_out' },
        ]);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_PERSON },
        ]);
        await ImportTests.deleteRuleAction(0);

        // Check `Set account` action is removed if change type of `Set transaction type` action to
        // any value except 'transfer_out' and 'transfer_in'
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_TR_TYPE },
            { action: 'changeTransactionType', data: 'transfer_out' },
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
            { action: 'changeTransactionType', data: 'transfer_out' },
        ]);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_ACCOUNT },
            { action: 'changeAccount', data: ACC_3 },
        ]);
        await ImportTests.submitRule();

        await ImportTests.cancelRule();

        setBlock('Add all actions', 2);
        await ImportTests.createRule();

        await ImportTests.addRuleAction();
        await ImportTests.addRuleAction();
        await ImportTests.addRuleAction();
        await ImportTests.addRuleAction();
        await ImportTests.addRuleAction();

        await ImportTests.cancelRule();
    }

    // Create import rule tests
    async create() {
        setBlock('Create import rules', 1);

        const { CREDIT_CARD, MARIA, TRANSPORT_CATEGORY } = App.scenario;

        setBlock('Create import rule #1', 2);
        await ImportTests.createRule();
        await ImportTests.createRuleCondition([
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_COMMENT },
            { action: 'changeOperator', data: IMPORT_COND_OP_STRING_INCLUDES },
            { action: 'inputValue', data: 'MOBILE' },
        ]);
        await ImportTests.createRuleCondition([
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_ACC_AMOUNT },
            { action: 'changeOperator', data: IMPORT_COND_OP_GREATER },
            { action: 'inputAmount', data: '-100' },
        ]);
        await ImportTests.createRuleCondition([
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_ACC_AMOUNT },
            { action: 'changeOperator', data: IMPORT_COND_OP_LESS },
            { action: 'inputAmount', data: '500.1234' },
        ]);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_TR_TYPE },
            { action: 'changeTransactionType', data: 'income' },
        ]);

        await ImportTests.submitRule();

        setBlock('Create import rule #2', 2);
        await ImportTests.createRule();
        await ImportTests.createRuleCondition([
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_COMMENT },
            { action: 'changeOperator', data: IMPORT_COND_OP_STRING_INCLUDES },
            { action: 'inputValue', data: 'TAXI' },
        ]);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_TR_TYPE },
            { action: 'changeTransactionType', data: 'debt_out' },
        ]);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_PERSON },
            { action: 'changePerson', data: MARIA },
        ]);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_CATEGORY },
            { action: 'changeCategory', data: TRANSPORT_CATEGORY },
        ]);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_COMMENT },
            { action: 'inputValue', data: '' },
        ]);
        await ImportTests.submitRule();

        setBlock('Create import rule #3', 2);
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
            { action: 'inputAmount', data: '500.5678' },
        ]);
        await ImportTests.submitRule();

        setBlock('Create import rule #4', 2);
        await ImportTests.createRule();
        await ImportTests.createRuleCondition([
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_MAIN_ACCOUNT },
            { action: 'changeOperator', data: IMPORT_COND_OP_EQUAL },
            { action: 'changeAccount', data: CREDIT_CARD },
        ]);
        await ImportTests.createRuleCondition([
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_COMMENT },
            { action: 'changeOperator', data: IMPORT_COND_OP_STRING_INCLUDES },
            { action: 'inputValue', data: 'CREDIT LIMIT' },
        ]);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_TR_TYPE },
            { action: 'changeTransactionType', data: 'limit' },
        ]);
        await ImportTests.submitRule();

        setBlock('Create import rule #5', 2);
        await ImportTests.createRule();
        await ImportTests.createRuleCondition([
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_DATE },
            { action: 'changeOperator', data: IMPORT_COND_OP_EQUAL },
            { action: 'inputValue', data: App.datesFmt.now },
        ]);
        await ImportTests.createRuleCondition([
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_COMMENT },
            { action: 'changeOperator', data: IMPORT_COND_OP_STRING_INCLUDES },
            { action: 'inputValue', data: 'BAR' },
        ]);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_COMMENT },
            { action: 'inputValue', data: 'Bar date' },
        ]);
        await ImportTests.submitRule();
    }

    // Update import rule tests
    async update() {
        setBlock('Update import rules', 1);

        const { ACC_3 } = App.scenario;

        setBlock('Add conditions and actions', 2);
        await ImportTests.updateRule(0);
        await ImportTests.createRuleCondition([
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_MAIN_ACCOUNT },
            { action: 'changeOperator', data: IMPORT_COND_OP_EQUAL },
            { action: 'changeAccount', data: ACC_3 },
        ]);
        await ImportTests.createRuleAction([
            { action: 'changeAction', data: IMPORT_ACTION_SET_COMMENT },
            { action: 'inputValue', data: 'Mobile' },
        ]);
        await ImportTests.submitRule();

        setBlock('Update conditions and actions', 2);
        await ImportTests.updateRule(0);
        await ImportTests.updateRuleCondition({
            pos: 1,
            action: { action: 'changeFieldType', data: IMPORT_COND_FIELD_TR_AMOUNT },
        });
        await ImportTests.updateRuleCondition({
            pos: 2,
            action: { action: 'changeFieldType', data: IMPORT_COND_FIELD_TR_AMOUNT },
        });
        await ImportTests.submitRule();

        setBlock('Delete conditions and actions', 2);
        await ImportTests.updateRule(2);
        await ImportTests.deleteRuleCondition(0);
        await ImportTests.deleteRuleAction(0);
        await ImportTests.submitRule();
    }

    // Delete import rule tests
    async del() {
        setBlock('Delete import rules', 1);
        // Delete rule #3
        await ImportTests.deleteRule(2);
    }

    // Search import rule tests
    async search() {
        setBlock('Search import rules', 1);

        await ImportTests.inputRulesSearch('MOBILE');
        await ImportTests.inputRulesSearch('Taxi');
        await ImportTests.clearRulesSearch();
    }

    // Import rules paginator tests
    async pagination() {
        setBlock('Import rules pagination', 1);

        const data = [];
        const RULES_TO_CREATE = 25;
        const ruleBase = {
            conditions: [{
                field_id: IMPORT_COND_FIELD_COMMENT,
                operator: IMPORT_COND_OP_EQUAL,
                value: '',
            }],
            actions: [{
                action_id: IMPORT_ACTION_SET_COMMENT,
                value: '',
            }],
        };

        for (let i = 1; i <= RULES_TO_CREATE; i += 1) {
            const rule = copyObject(ruleBase);
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
        await ImportRuleApiTests.del({ id: ruleIds });
        // Refresh page
        await App.view.navigateToImport();
    }

    // Create import rule with template condition
    async createTemplateRule(templateIndex) {
        const template = App.state.templates.getItemByIndex(templateIndex);
        assert(template?.id, `Template index ${templateIndex} not found`);

        setBlock('Create import rule with template condition', 2);

        await ImportTests.openRulesDialog();

        await ImportTests.createRule();
        await ImportTests.createRuleCondition([
            { action: 'changeFieldType', data: IMPORT_COND_FIELD_TPL },
            { action: 'changeOperator', data: IMPORT_COND_OP_EQUAL },
            { action: 'changeTemplate', data: template.id },
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

        await ImportTests.closeRulesDialog();
    }

    async locales() {
        setBlock('Import rules locales', 1);

        await testLocales((locale) => this.checkLocale(locale));
    }

    async checkLocale(locale) {
        setBlock(`Locale: '${locale}'`, 1);

        const date = (locale === 'en')
            ? App.datesFmt.weekAgo
            : App.datesFmt.now;

        setBlock('Update conditions and actions', 2);
        await ImportTests.updateRule(3);
        await ImportTests.updateRuleCondition({
            pos: 0,
            action: { action: 'inputValue', data: date },
        });
        await ImportTests.submitRule();
    }

    // Import rule action form test for no persons
    async noPersonTests() {
        const { RUB } = App.scenario;

        setBlock('No persons test', 1);

        // Create at least one account
        await api.account.create({
            name: 'Test Account 1',
            curr_id: RUB,
            initbalance: '1',
            icon_id: 1,
        });
        // Remove all persons
        await App.scenario.resetData({
            persons: true,
        });

        await App.view.navigateToImport();

        await ImportTests.openRulesDialog();

        await ImportTests.createRule();
        await ImportTests.addRuleAction();

        await ImportTests.closeRulesDialog();
    }
}
