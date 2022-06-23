import { test, setBlock, assert } from 'jezve-test';
import { App } from '../../Application.js';
import { ImportTransaction } from '../../model/ImportTransaction.js';
import { ImportCondition } from '../../model/ImportCondition.js';
import { ImportAction } from '../../model/ImportAction.js';
import { ImportView } from '../../view/ImportView.js';

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

/** Click by create import rule button */
export const createRule = async () => {
    await test('Create rule', async () => {
        await checkRulesDialog();

        await App.view.createRule();

        App.view.expectedState = App.view.getExpectedState(App.view.model);
        return App.view.checkState();
    });
};

/** Click by update import rule button */
export const updateRule = async (index) => {
    const ind = parseInt(index, 10);
    assert(!Number.isNaN(ind), 'Invalid rule index');

    await test(`Update rule [${ind}]`, async () => {
        await checkRulesDialog();

        await App.view.updateRule(ind);

        App.view.expectedState = App.view.getExpectedState(App.view.model);
        return App.view.checkState();
    });
};

/** Click by delete import rule button */
export const deleteRule = async (index) => {
    const ind = parseInt(index, 10);
    assert(!Number.isNaN(ind), 'Invalid rule index');

    await test(`Delete rule [${ind}]`, async () => {
        await checkRulesDialog();

        await App.view.deleteRule(ind);

        App.view.expectedState = App.view.getExpectedState(App.view.model);
        return App.view.checkState();
    });
};

/** Run set of actions on specified rule condition item */
const runOnRuleCondition = async (params) => {
    assert(
        params && ('pos' in params) && ('action' in params),
        'Invalid parameters',
    );

    assert.instanceOf(App.view, ImportView, 'Invalid view instance');

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

    const actions = Array.isArray(params.action) ? params.action : [params.action];
    for (const action of actions) {
        let descr;

        assert(action.action in actDescr, `Unknown action (${action.action})`);

        if (action.action === 'changeFieldType'
            || action.action === 'changeProperty') {
            const property = ImportCondition.getFieldTypeById(action.data);
            assert(property, `Property (${action.data}) not found`);

            descr = `${actDescr[action.action]} to '${property.title}'`;
        } else if (action.action === 'changeOperator') {
            const operator = ImportCondition.getOperatorById(action.data);
            assert(operator, `Operator (${action.data}) not found`);

            descr = `${actDescr[action.action]} to '${operator.title}'`;
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

            descr = `${actDescr[action.action]} to '${currency.name}'`;
        } else if (action.action === 'togglePropValue') {
            descr = `${actDescr[action.action]}`;
        } else {
            descr = `${actDescr[action.action]} '${action.data}'`;
        }

        await test(descr, () => App.view.runOnRuleCondition(params.pos, action));
    }
};

/** Click by create import condition button */
export const addRuleCondition = async () => {
    await test('Add rule condition', async () => {
        assert.instanceOf(App.view, ImportView, 'Invalid view instance');

        await App.view.addRuleCondition();

        App.view.expectedState = App.view.getExpectedState(App.view.model);
        return App.view.checkState();
    });
};

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

    await test(`Delete rule condition [${ind}]`, async () => {
        assert.instanceOf(App.view, ImportView, 'Invalid view instance');

        await App.view.deleteRuleCondition(ind);

        App.view.expectedState = App.view.getExpectedState(App.view.model);
        return App.view.checkState();
    });
};

/** Run set of actions on specified rule action item */
const runOnRuleAction = async (params) => {
    assert(
        params && ('pos' in params) && ('action' in params),
        'Invalid parameters',
    );

    assert.instanceOf(App.view, ImportView, 'Invalid view instance');

    const actDescr = {
        changeAction: 'Change action',
        changeTransactionType: 'Change transaction type',
        changeAccount: 'Change account',
        changePerson: 'Change person',
        inputAmount: 'Input amount value',
        inputValue: 'Input value',
    };

    const actions = Array.isArray(params.action) ? params.action : [params.action];
    for (const action of actions) {
        let descr;

        if (action.action === 'changeAction') {
            const actionType = ImportAction.getActionById(action.data);
            assert(actionType, `Property (${action.data}) not found`);

            descr = `${actDescr[action.action]} to '${actionType.title}'`;
        } else if (action.action === 'changeTransactionType') {
            const transType = ImportTransaction.getTypeById(action.data);
            assert(transType, `Transaction type (${action.data}) not found`);

            descr = `${actDescr[action.action]} to '${transType.title}'`;
        } else if (action.action === 'changeAccount') {
            const userAccounts = App.state.accounts.getUserVisible();
            const account = userAccounts.getItem(action.data);
            assert(account, `Account (${action.data}) not found`);

            descr = `${actDescr[action.action]} to '${account.name}'`;
        } else if (action.action === 'changePerson') {
            const person = App.state.persons.getItem(action.data);
            assert(person, `Person (${action.data}) not found`);

            descr = `${actDescr[action.action]} to '${person.name}'`;
        } else if (action.action === 'togglePropValue') {
            descr = `${actDescr[action.action]}`;
        } else {
            descr = `${actDescr[action.action]} '${action.data}'`;
        }

        await test(descr, () => App.view.runOnRuleAction(params.pos, action));
    }
};

/** Click by create import action button */
export const addRuleAction = async () => {
    await test('Add rule action', async () => {
        assert.instanceOf(App.view, ImportView, 'Invalid view instance');

        await App.view.addRuleAction();

        App.view.expectedState = App.view.getExpectedState(App.view.model);

        return App.view.checkState();
    });
};

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

    await test(`Delete rule action [${ind}]`, async () => {
        assert.instanceOf(App.view, ImportView, 'Invalid view instance');

        await App.view.deleteRuleAction(ind);

        App.view.expectedState = App.view.getExpectedState(App.view.model);

        return App.view.checkState();
    });
};

/** Submit import rule */
export const submitRule = async () => {
    await test('Submit import rule', async () => {
        assert.instanceOf(App.view, ImportView, 'Invalid view instance');

        // Prepare expected content
        const validInput = App.view.isValidRule();
        if (validInput) {
            const expectedRule = App.view.getExpectedRule();
            const dialogState = App.view.getRulesState();
            assert(
                ['create', 'update'].includes(dialogState),
                'Invalid state of rules dialog',
            );

            if (dialogState === 'create') {
                App.state.createRule(expectedRule);
            } else if (dialogState === 'update') {
                App.state.updateRule(expectedRule);
            }
        }

        await App.view.submitRule();

        // Check app state
        return App.state.fetchAndTest();
    });
};

/** Cancel import rule form */
export const cancelRule = async () => {
    await test('Cancel import rule', async () => {
        assert.instanceOf(App.view, ImportView, 'Invalid view instance');

        await App.view.cancelRule();

        // Check app state
        return App.state.fetchAndTest();
    });
};
