import { assert } from '@jezvejs/assert';
import { asArray } from '@jezvejs/types';
import { test, setBlock } from 'jezve-test';
import { App } from '../../../Application.js';
import { __ } from '../../../model/locale.js';
import { ImportTransaction } from '../../../model/ImportTransaction.js';
import { ImportCondition } from '../../../model/ImportCondition.js';
import { ImportAction } from '../../../model/ImportAction.js';
import { ImportView } from '../../../view/ImportView.js';

/** Navigate to import page */
const checkNavigation = async () => {
    if (App.view instanceof ImportView) {
        return;
    }

    await App.view.navigateToImport();
};

/** Check rules dialog is open */
const checkRulesDialog = async () => {
    await checkNavigation();

    if (!App.view.isRulesState()) {
        await App.view.launchRulesDialog();
    }
};

/** Open import rules dialog */
export const openRulesDialog = async () => {
    await test('Open rules dialog', async () => {
        await checkNavigation();

        await App.view.launchRulesDialog();

        App.view.expectedState = App.view.getExpectedState(App.view.model);
        return App.view.checkState();
    });
};

/** Close import rules dialog */
export const closeRulesDialog = async () => {
    await test('Close rules dialog', async () => {
        await checkNavigation();

        await App.view.closeRulesDialog();

        App.view.expectedState = App.view.getExpectedState(App.view.model);
        return App.view.checkState();
    });
};

/** Navigates to the first page */
export const goToFirstRulesPage = () => (
    test('Navigate to first page', () => (
        App.view.goToFirstRulesPage()
    ))
);

/** Navigates to the last page */
export const goToLastRulesPage = () => (
    test('Navigate to last page', () => (
        App.view.goToLastRulesPage()
    ))
);

/** Navigates to previous page */
export const goToPrevRulesPage = () => (
    test('Navigate to previous page', () => (
        App.view.goToPrevRulesPage()
    ))
);

/** Navigates to next page */
export const goToNextRulesPage = () => (
    test('Navigate to next page', () => (
        App.view.goToNextRulesPage()
    ))
);

/** Clicks by 'Show more' button */
export const showMoreRules = () => (
    test('Show more items', () => (
        App.view.showMoreRules()
    ))
);

/** Click by create import rule button */
export const iterateRulesList = async () => {
    await test('Iterate rules list', async () => {
        await checkRulesDialog();

        return App.view.iterateRulesList();
    });
};

/** Click by 'toggle' button of specified import rule */
export const toggleExpandRule = (index) => (
    test(`Toggle expand rule [${index}]`, () => (
        App.view.toggleExpandRule(index)
    ))
);

/** Click by create import rule button */
export const createRule = () => (
    test('Create rule', () => (
        App.view.createRule()
    ))
);

/** Click by update import rule button */
export const updateRule = async (index) => {
    const ind = parseInt(index, 10);
    assert(!Number.isNaN(ind), 'Invalid rule index');

    await test(`Update rule [${ind}]`, () => (
        App.view.updateRule(ind)
    ));
};

/** Click by 'Duplicate' import rule button */
export const duplicateRule = (index) => (
    test(`Update rule [${index}]`, () => (
        App.view.duplicateRule(index)
    ))
);

/** Click by delete import rule button */
export const deleteRule = (index) => (
    test(`Delete rule [${index}]`, () => (
        App.view.deleteRule(index)
    ))
);

/** Run set of actions on specified rule condition item */
const runOnRuleCondition = async (params) => {
    assert(
        params && ('pos' in params) && ('action' in params),
        'Invalid parameters',
    );

    const actDescr = {
        changeFieldType: 'Change field type',
        changeProperty: 'Change value property',
        changeOperator: 'Change operator',
        changeTemplate: 'Change template',
        changeAccount: 'Change account',
        changeCurrency: 'Change currency',
        togglePropValue: 'Toggle enable property value',
        inputAmount: 'Input amount value',
        inputValue: 'Input value',
    };

    const actions = asArray(params.action);
    for (const action of actions) {
        let descr;

        assert(action.action in actDescr, `Unknown action (${action.action})`);

        if (action.action === 'changeFieldType'
            || action.action === 'changeProperty') {
            const property = ImportCondition.getFieldTypeById(action.data);
            assert(property, `Property (${action.data}) not found`);

            descr = `${actDescr[action.action]} to '${__(property.titleToken, App.config.logsLocale)}'`;
        } else if (action.action === 'changeOperator') {
            const operator = ImportCondition.getOperatorById(action.data);
            assert(operator, `Operator (${action.data}) not found`);

            descr = `${actDescr[action.action]} to '${__(operator.titleToken, App.config.logsLocale)}'`;
        } else if (action.action === 'changeTemplate') {
            const template = App.state.templates.getItem(action.data);
            assert(template, `Template (${action.data}) not found`);

            descr = `${actDescr[action.action]} to '${template.name}'`;
        } else if (action.action === 'changeAccount') {
            const userAccounts = App.state.accounts.getUserVisible();
            const account = userAccounts.getItem(action.data);
            assert(account, `Account (${action.data}) not found`);

            descr = `${actDescr[action.action]} to '${account.name}'`;
        } else if (action.action === 'changeCurrency') {
            const currency = App.currency.getItem(action.data);
            assert(currency, `Currency (${action.data}) not found`);

            descr = `${actDescr[action.action]} to '${currency.code}'`;
        } else if (action.action === 'togglePropValue') {
            descr = `${actDescr[action.action]}`;
        } else {
            descr = `${actDescr[action.action]} '${action.data}'`;
        }

        await test(descr, () => App.view.runOnRuleCondition(params.pos, action));
    }
};

/** Click by create import condition button */
export const addRuleCondition = () => (
    test('Add rule condition', () => App.view.addRuleCondition())
);

/** Create new import rule condition */
export const createRuleCondition = async (params) => {
    setBlock('Create rule condition', 2);

    await addRuleCondition();

    if (params) {
        const conditions = App.view.getRuleConditions();
        await runOnRuleCondition({
            pos: conditions.length - 1,
            action: params,
        });
    }
};

/** Update rule condition */
export const updateRuleCondition = async (params) => {
    assert(
        params && ('pos' in params) && ('action' in params),
        'Invalid parameters',
    );

    setBlock(`Update rule condition [${params.pos}]`, 2);

    await runOnRuleCondition(params);
};

/** Click by delete import condition button */
export const deleteRuleCondition = async (index) => {
    const ind = parseInt(index, 10);
    assert(!Number.isNaN(ind), 'Invalid index');

    await test(`Delete rule condition [${ind}]`, () => App.view.deleteRuleCondition(ind));
};

/** Run set of actions on specified rule action item */
const runOnRuleAction = async (params) => {
    assert(
        params && ('pos' in params) && ('action' in params),
        'Invalid parameters',
    );

    const actDescr = {
        changeAction: 'Change action',
        changeTransactionType: 'Change transaction type',
        changeAccount: 'Change account',
        changePerson: 'Change person',
        changeCategory: 'Change category',
        inputAmount: 'Input amount value',
        inputValue: 'Input value',
    };

    const actions = asArray(params.action);
    for (const action of actions) {
        let descr;

        if (action.action === 'changeAction') {
            const actionType = ImportAction.getActionById(action.data);
            assert(actionType, `Property (${action.data}) not found`);

            descr = `${actDescr[action.action]} to '${__(actionType.titleToken, App.config.logsLocale)}'`;
        } else if (action.action === 'changeTransactionType') {
            const transType = ImportTransaction.getTypeById(action.data);
            assert(transType, `Transaction type (${action.data}) not found`);

            descr = `${actDescr[action.action]} to '${__(transType.titleToken, App.config.logsLocale)}'`;
        } else if (action.action === 'changeAccount') {
            const userAccounts = App.state.accounts.getUserVisible();
            const account = userAccounts.getItem(action.data);
            assert(account, `Account (${action.data}) not found`);

            descr = `${actDescr[action.action]} to '${account.name}'`;
        } else if (action.action === 'changePerson') {
            const person = App.state.persons.getItem(action.data);
            assert(person, `Person (${action.data}) not found`);

            descr = `${actDescr[action.action]} to '${person.name}'`;
        } else if (action.action === 'changeCategory') {
            const categoryId = parseInt(action.data, 10);
            const category = App.state.categories.getItem(categoryId);
            if (categoryId !== 0) {
                assert(category, `Category (${action.data}) not found`);
            }
            const categoryName = (categoryId === 0)
                ? 'No category'
                : category.name;

            descr = `${actDescr[action.action]} to '${categoryName}'`;
        } else if (action.action === 'togglePropValue') {
            descr = `${actDescr[action.action]}`;
        } else {
            descr = `${actDescr[action.action]} '${action.data}'`;
        }

        await test(descr, () => App.view.runOnRuleAction(params.pos, action));
    }
};

/** Click by create import action button */
export const addRuleAction = () => (
    test('Add rule action', () => App.view.addRuleAction())
);

/** Create new import rule action */
export const createRuleAction = async (params) => {
    setBlock('Create rule action', 2);

    await addRuleAction();

    if (params) {
        const actions = App.view.getRuleActions();
        await runOnRuleAction({
            pos: actions.length - 1,
            action: params,
        });
    }
};

export const updateRuleAction = async (params) => {
    assert(
        params && ('pos' in params) && ('action' in params),
        'Invalid parameters',
    );

    setBlock(`Update rule action [${params.pos}]`, 2);

    await runOnRuleAction(params);
};

/** Click by delete import action button */
export const deleteRuleAction = async (index) => {
    const ind = parseInt(index, 10);
    assert(!Number.isNaN(ind), 'Invalid index');

    await test(`Delete rule action [${ind}]`, () => App.view.deleteRuleAction(ind));
};

/** Submit import rule */
export const submitRule = () => (
    test('Submit import rule', () => App.view.submitRule())
);

/** Cancel import rule form */
export const cancelRule = async () => {
    await test('Cancel import rule', async () => {
        await App.view.cancelRule();
        return App.state.fetchAndTest();
    });
};

/** Input import rule search filter */
export const inputRulesSearch = (value) => (
    test('Search rules', () => App.view.inputRulesSearch(value))
);

/** Clear import rules search filter */
export const clearRulesSearch = () => (
    test('Clear rules filter', () => App.view.clearRulesSearch())
);
