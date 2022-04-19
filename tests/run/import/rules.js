import { test } from 'jezve-test';
import { App } from '../../Application.js';
import { setBlock } from '../../env.js';
import { Currency } from '../../model/Currency.js';
import { ImportTransaction } from '../../model/ImportTransaction.js';
import { ImportCondition } from '../../model/ImportCondition.js';
import { ImportAction } from '../../model/ImportAction.js';
import { ImportView } from '../../view/ImportView.js';
import { TransactionsView } from '../../view/TransactionsView.js';

/** Navigate to import page */
async function checkNavigation() {
    if (App.view instanceof ImportView) {
        return;
    }

    if (!(App.view instanceof TransactionsView)) {
        await App.goToMainView();
        await App.view.goToTransactions();
    }

    await App.view.goToImportView();
}

/** Check rules dialog is open */
async function checkRulesDialog() {
    await checkNavigation();

    if (!App.view.isRulesState()) {
        await App.view.launchRulesDialog();
    }
}

/** Open import rules dialog */
export async function openRulesDialog() {
    await test('Open rules dialog', async () => {
        await checkNavigation();

        await App.view.launchRulesDialog();

        App.view.expectedState = App.view.getExpectedState(App.view.model);
        return App.view.checkState();
    });
}

/** Close import rules dialog */
export async function closeRulesDialog() {
    await test('Close rules dialog', async () => {
        await checkNavigation();

        await App.view.closeRulesDialog();

        App.view.expectedState = App.view.getExpectedState(App.view.model);
        return App.view.checkState();
    });
}

/** Click by create import rule button */
export async function createRule() {
    await test('Create rule', async () => {
        await checkRulesDialog();

        await App.view.createRule();

        App.view.expectedState = App.view.getExpectedState(App.view.model);
        return App.view.checkState();
    });
}

/** Click by update import rule button */
export async function updateRule(index) {
    const ind = parseInt(index, 10);
    if (Number.isNaN(ind)) {
        throw new Error('Invalid rule index');
    }

    await test(`Update rule [${ind}]`, async () => {
        await checkRulesDialog();

        await App.view.updateRule(ind);

        App.view.expectedState = App.view.getExpectedState(App.view.model);
        return App.view.checkState();
    });
}

/** Click by delete import rule button */
export async function deleteRule(index) {
    const ind = parseInt(index, 10);
    if (Number.isNaN(ind)) {
        throw new Error('Invalid rule index');
    }

    await test(`Delete rule [${ind}]`, async () => {
        await checkRulesDialog();

        await App.view.deleteRule(ind);

        App.view.expectedState = App.view.getExpectedState(App.view.model);
        return App.view.checkState();
    });
}

/** Run set of actions on specified rule condition item */
async function runOnRuleCondition(params) {
    if (!params || !('pos' in params) || !('action' in params)) {
        throw new Error('Invalid parameters');
    }

    if (!(App.view instanceof ImportView)) {
        throw new Error('Invalid view instance');
    }

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

        if (!(action.action in actDescr)) {
            throw new Error(`Unknown action (${action.action})`);
        }

        if (action.action === 'changeFieldType'
            || action.action === 'changeProperty') {
            const property = ImportCondition.getFieldTypeById(action.data);
            if (!property) {
                throw new Error(`Property (${action.data}) not found`);
            }

            descr = `${actDescr[action.action]} to '${property.title}'`;
        } else if (action.action === 'changeOperator') {
            const operator = ImportCondition.getOperatorById(action.data);
            if (!operator) {
                throw new Error(`Operator (${action.data}) not found`);
            }

            descr = `${actDescr[action.action]} to '${operator.title}'`;
        } else if (action.action === 'changeTemplate') {
            const template = App.state.templates.getItem(action.data);
            if (!template) {
                throw new Error(`Template (${action.data}) not found`);
            }

            descr = `${actDescr[action.action]} to '${template.name}'`;
        } else if (action.action === 'changeAccount') {
            const userAccounts = App.state.accounts.getUserVisible();
            const account = userAccounts.getItem(action.data);
            if (!account) {
                throw new Error(`Account (${action.data}) not found`);
            }

            descr = `${actDescr[action.action]} to '${account.name}'`;
        } else if (action.action === 'changeCurrency') {
            const currency = Currency.getById(action.data);
            if (!currency) {
                throw new Error(`Currency (${action.data}) not found`);
            }

            descr = `${actDescr[action.action]} to '${currency.name}'`;
        } else if (action.action === 'togglePropValue') {
            descr = `${actDescr[action.action]}`;
        } else {
            descr = `${actDescr[action.action]} '${action.data}'`;
        }

        await test(descr, () => App.view.runOnRuleCondition(params.pos, action));
    }
}

/** Click by create import condition button */
export async function addRuleCondition() {
    await test('Add rule condition', async () => {
        if (!(App.view instanceof ImportView)) {
            throw new Error('Invalid view instance');
        }

        await App.view.addRuleCondition();

        App.view.expectedState = App.view.getExpectedState(App.view.model);
        return App.view.checkState();
    });
}

/** Create new import rule condition */
export async function createRuleCondition(params) {
    setBlock('Create rule condition', 2);

    await addRuleCondition();

    if (params) {
        const conditions = App.view.getRuleConditions();
        await runOnRuleCondition({
            pos: conditions.length - 1,
            action: params,
        });
    }
}

/** Update rule condition */
export async function updateRuleCondition(params) {
    if (!params || !('pos' in params) || !('action' in params)) {
        throw new Error('Invalid parameters');
    }

    setBlock(`Update rule condition [${params.pos}]`, 2);

    await runOnRuleCondition(params);
}

/** Click by delete import condition button */
export async function deleteRuleCondition(index) {
    const ind = parseInt(index, 10);
    if (Number.isNaN(ind)) {
        throw new Error('Invalid index');
    }

    await test(`Delete rule condition [${ind}]`, async () => {
        if (!(App.view instanceof ImportView)) {
            throw new Error('Invalid view instance');
        }

        await App.view.deleteRuleCondition(ind);

        App.view.expectedState = App.view.getExpectedState(App.view.model);
        return App.view.checkState();
    });
}

/** Run set of actions on specified rule action item */
async function runOnRuleAction(params) {
    if (!params || !('pos' in params) || !('action' in params)) {
        throw new Error('Invalid parameters');
    }

    if (!(App.view instanceof ImportView)) {
        throw new Error('Invalid view instance');
    }

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
            if (!actionType) {
                throw new Error(`Property (${action.data}) not found`);
            }

            descr = `${actDescr[action.action]} to '${actionType.title}'`;
        } else if (action.action === 'changeTransactionType') {
            const transType = ImportTransaction.getTypeById(action.data);
            if (!transType) {
                throw new Error(`Transaction type (${action.data}) not found`);
            }

            descr = `${actDescr[action.action]} to '${transType.title}'`;
        } else if (action.action === 'changeAccount') {
            const userAccounts = App.state.accounts.getUserVisible();
            const account = userAccounts.getItem(action.data);
            if (!account) {
                throw new Error(`Account (${action.data}) not found`);
            }

            descr = `${actDescr[action.action]} to '${account.name}'`;
        } else if (action.action === 'changePerson') {
            const person = App.state.persons.getItem(action.data);
            if (!person) {
                throw new Error(`Person (${action.data}) not found`);
            }

            descr = `${actDescr[action.action]} to '${person.name}'`;
        } else if (action.action === 'togglePropValue') {
            descr = `${actDescr[action.action]}`;
        } else {
            descr = `${actDescr[action.action]} '${action.data}'`;
        }

        await test(descr, () => App.view.runOnRuleAction(params.pos, action));
    }
}

/** Click by create import action button */
export async function addRuleAction() {
    await test('Add rule action', async () => {
        if (!(App.view instanceof ImportView)) {
            throw new Error('Invalid view instance');
        }

        await App.view.addRuleAction();

        App.view.expectedState = App.view.getExpectedState(App.view.model);

        return App.view.checkState();
    });
}

/** Create new import rule action */
export async function createRuleAction(params) {
    setBlock('Create rule action', 2);

    await addRuleAction();

    if (params) {
        const actions = App.view.getRuleActions();
        await runOnRuleAction({
            pos: actions.length - 1,
            action: params,
        });
    }
}

export async function updateRuleAction(params) {
    if (!params || !('pos' in params) || !('action' in params)) {
        throw new Error('Invalid parameters');
    }

    setBlock(`Update rule action [${params.pos}]`, 2);

    await runOnRuleAction(params);
}

/** Click by delete import action button */
export async function deleteRuleAction(index) {
    const ind = parseInt(index, 10);
    if (Number.isNaN(ind)) {
        throw new Error('Invalid index');
    }

    await test(`Delete rule action [${ind}]`, async () => {
        if (!(App.view instanceof ImportView)) {
            throw new Error('Invalid view instance');
        }

        await App.view.deleteRuleAction(ind);

        App.view.expectedState = App.view.getExpectedState(App.view.model);

        return App.view.checkState();
    });
}

/** Submit import rule */
export async function submitRule() {
    await test('Submit import rule', async () => {
        if (!(App.view instanceof ImportView)) {
            throw new Error('Invalid view instance');
        }

        // Prepare expected content
        const validInput = App.view.isValidRule();
        if (validInput) {
            const expectedRule = App.view.getExpectedRule();
            const dialogState = App.view.getRulesState();
            if (dialogState === 'create') {
                App.state.createRule(expectedRule);
            } else if (dialogState === 'update') {
                App.state.updateRule(expectedRule);
            } else {
                throw new Error('Invalid state of rules dialog');
            }
        }

        await App.view.submitRule();

        // Check app state
        return App.state.fetchAndTest();
    });
}

/** Cancel import rule form */
export async function cancelRule() {
    await test('Cancel import rule', async () => {
        if (!(App.view instanceof ImportView)) {
            throw new Error('Invalid view instance');
        }

        await App.view.cancelRule();

        // Check app state
        return App.state.fetchAndTest();
    });
}
