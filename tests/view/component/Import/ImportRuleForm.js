import {
    copyObject,
    TestComponent,
    assert,
    query,
    queryAll,
    prop,
    click,
    asyncMap,
} from 'jezve-test';
import { ImportTransaction } from '../../../model/ImportTransaction.js';
import { ImportRule } from '../../../model/ImportRule.js';
import {
    ConditionFields,
    ImportCondition,
    IMPORT_COND_OP_FIELD_FLAG,
} from '../../../model/ImportCondition.js';
import {
    ImportAction,
    IMPORT_ACTION_SET_TR_TYPE,
    IMPORT_ACTION_SET_ACCOUNT,
    IMPORT_ACTION_SET_PERSON,
} from '../../../model/ImportAction.js';
import { ImportConditionForm } from './ImportConditionForm.js';
import { ImportRuleAccordion } from './ImportRuleAccordion.js';
import { ImportActionForm } from './ImportActionForm.js';
import { trimToDigitsLimit } from '../../../common.js';
import { App } from '../../../Application.js';
import { __ } from '../../../model/locale.js';

export class ImportRuleForm extends TestComponent {
    static getExpectedCondition(model) {
        return {
            field_id: parseInt(model.fieldType, 10),
            operator: parseInt(model.operator, 10),
            value: model.value.toString(),
            flags: (model.isFieldValue) ? IMPORT_COND_OP_FIELD_FLAG : 0,
        };
    }

    static getExpectedAction(model) {
        return {
            action_id: parseInt(model.actionType, 10),
            value: model.value.toString(),
        };
    }

    /** Return expected import rule object */
    static getExpectedRule(model = this.model) {
        const res = {
            flags: 0,
        };

        res.conditions = model.conditions.map((item) => this.getExpectedCondition(item));
        res.actions = model.actions.map((item) => this.getExpectedAction(item));

        if (model.id) {
            res.id = model.id;
        }

        return res;
    }

    static getExpectedState(model) {
        const localModel = copyObject(model);

        const res = {
            conditionsList: { visible: true },
            actionsList: { visible: true },
        };

        this.setExpectedRule(localModel);
        this.setAvailableConditions(localModel);
        this.setAvailableActions(localModel);

        res.conditionsList.items = localModel.conditions.map(
            (item) => ImportConditionForm.getExpectedState(item),
        );

        res.actionsList.items = localModel.actions.map(
            (item) => ImportActionForm.getExpectedState(item),
        );

        return res;
    }

    static setExpectedRule(model) {
        const res = model;
        const ruleData = this.getExpectedRule(model);
        const rule = new ImportRule(ruleData);
        res.rule = rule;
    }

    static setAvailableConditions(model) {
        const res = model;
        const { rule } = model;

        res.conditions = model.conditions.map((condition, ind) => {
            let propFilter = Object.values(ConditionFields);
            // Remove properties which already have `is` operator
            propFilter = propFilter.filter((property) => {
                const found = rule.conditions.findIsCondition(property);
                const foundInd = rule.conditions.indexOf(found);
                return (!found || foundInd === ind);
            });

            return {
                ...condition,
                fieldsAvailable: propFilter.map((type) => type.toString()),
            };
        });
    }

    static setAvailableActions(model) {
        const res = model;
        const { rule } = model;

        res.actions = model.actions.map((action, ind) => {
            let actionsFilter = ImportAction.actionTypes.map(({ id }) => id);
            // Remove already added actions
            actionsFilter = actionsFilter.filter((type) => {
                const found = rule.actions.findAction(type);
                const foundInd = rule.actions.indexOf(found);
                return (!found || foundInd === ind);
            });

            // Show `Set account` action if has `Set transaction type` action with
            // transfer type selected
            const setAccountAction = rule.actions.findAction(IMPORT_ACTION_SET_ACCOUNT);
            const setAccountInd = rule.actions.indexOf(setAccountAction);
            const showSetAccount = (
                rule.actions.hasSetTransfer()
                && (!setAccountAction || setAccountInd === ind)
            );
            if (!showSetAccount) {
                actionsFilter = actionsFilter.filter((type) => type !== IMPORT_ACTION_SET_ACCOUNT);
            }

            // Show `Set person` action if person available and has `Set transaction type` action
            // with debt type selected
            const setPersonAction = rule.actions.findAction(IMPORT_ACTION_SET_PERSON);
            const setPersonInd = rule.actions.indexOf(setPersonAction);
            const showSetPerson = (
                App.state.persons.length > 0
                && rule.actions.hasSetDebt()
                && (!setPersonAction || setPersonInd === ind)
            );
            if (!showSetPerson) {
                actionsFilter = actionsFilter.filter((type) => type !== IMPORT_ACTION_SET_PERSON);
            }

            return {
                ...action,
                actionsAvailable: actionsFilter.map((type) => type.toString()),
            };
        });
    }

    async parseContent() {
        const res = {};

        const accordionElems = await queryAll(this.elem, '.rule-form-collapse');
        const accordionItems = await asyncMap(
            accordionElems,
            (elem) => ImportRuleAccordion.create(this, elem),
        );

        accordionItems.forEach((item) => {
            if (item.content.title === __('IMPORT_CONDITIONS', App.view.locale)) {
                res.conditionsList = item;
            } else if (item.content.title === __('IMPORT_ACTIONS', App.view.locale)) {
                res.actionsList = item;
            } else {
                throw new Error(`Unknown container: '${item.content.title}'`);
            }
        });

        res.idInput = { elem: await query(this.elem, 'input[type=hidden]') };
        res.submitBtn = { elem: await query(this.elem, '.form-controls .submit-btn') };
        res.cancelBtn = { elem: await query(this.elem, '.form-controls .cancel-btn') };
        res.feedbackElem = { elem: await query(this.elem, '.rule-form__feedback .invalid-feedback') };
        assert(
            res.idInput.elem
            && res.conditionsList
            && res.conditionsList.elem
            && res.actionsList
            && res.actionsList.elem
            && res.submitBtn.elem
            && res.cancelBtn.elem
            && res.feedbackElem.elem,
            'Invalid structure of import rule from',
        );

        res.idInput.value = await prop(res.idInput.elem, 'value');

        const condFormElems = await queryAll(res.conditionsList.elem, '.cond-form');
        res.conditionsList.content.items = await asyncMap(
            condFormElems,
            (elem) => ImportConditionForm.create(this, elem),
        );

        const actElems = await queryAll(res.actionsList.elem, '.action-form');
        res.actionsList.content.items = await asyncMap(
            actElems,
            (elem) => ImportActionForm.create(this, elem),
        );

        return res;
    }

    async buildModel(cont) {
        const res = {
            conditions: cont.conditionsList.content.items.map(
                (item) => copyObject(item.model),
            ),
            actions: cont.actionsList.content.items.map(
                (item) => copyObject(item.model),
            ),
        };

        const ruleId = parseInt(cont.idInput.value, 10);
        if (ruleId) {
            res.id = ruleId;
        }

        this.setExpectedRule(res);

        return res;
    }

    getExpectedState(model = this.model) {
        return ImportRuleForm.getExpectedState(model);
    }

    getExpectedRule(model = this.model) {
        return ImportRuleForm.getExpectedRule(model);
    }

    setExpectedRule(model = this.model) {
        return ImportRuleForm.setExpectedRule(model);
    }

    /** Return validation result for expected import rule */
    isValid() {
        return this.model.rule.validate();
    }

    async openConditions() {
        if (this.content.conditionsList.isCollapsed()) {
            await this.content.conditionsList.toggle();
            await this.parse();
        }
    }

    /** Search for first condition field type not used in rule */
    getNextAvailProperty(model) {
        assert(model, 'Invalid model');

        // Obtain condition field types currently used by rule
        const ruleFieldTypes = model.conditions.map((condition) => condition.fieldType);
        // Filter available field types
        const availFields = Object.values(ConditionFields).filter((fieldType) => {
            if (ImportCondition.isTemplateField(fieldType)) {
                return App.state.templates.length > 0;
            }

            return true;
        });

        // Search for first field type not in list
        const resField = availFields.find((fieldType) => !ruleFieldTypes.includes(fieldType));
        return (resField) ? ImportCondition.getFieldTypeById(resField) : null;
    }

    /** Search for first action type not used in rule */
    getNextAvailAction(model) {
        assert(model, 'Invalid model');

        // Obtain action types currently used by rule
        const ruleActionTypes = model.actions.map((action) => action.actionType);
        // Search for first action type not in list
        return ImportAction.actionTypes.find((actionType) => {
            if (ruleActionTypes.includes(actionType.id)) {
                return false;
            }

            if (actionType.id === IMPORT_ACTION_SET_ACCOUNT) {
                return model.rule.actions.hasSetTransfer();
            }

            if (actionType.id === IMPORT_ACTION_SET_PERSON) {
                return (
                    App.state.persons.length > 0
                    && model.rule.actions.hasSetDebt()
                );
            }

            return true;
        });
    }

    getDefaultValue(fieldId) {
        const fieldType = parseInt(fieldId, 10);
        assert(fieldType, 'Invalid field type');

        if (ImportCondition.isAccountField(fieldType)) {
            const account = App.state.accounts.getItemByIndex(0);
            assert(account, 'No accounts available');

            return account.id;
        }

        if (ImportCondition.isTemplateField(fieldType)) {
            const template = App.state.templates.getItemByIndex(0);
            assert(template, 'No template available');

            return template.id;
        }

        if (ImportCondition.isCurrencyField(fieldType)) {
            const currency = App.currency.getItemByIndex(0);
            assert(currency, 'No currency available');

            return currency.id;
        }

        return '';
    }

    getActionDefaultValue(actionType) {
        const type = parseInt(actionType, 10);
        assert(type, 'Invalid action type');

        if (ImportAction.isTransactionTypeValue(type)) {
            const [transType] = ImportTransaction.availTypes;
            return transType.id;
        }

        if (ImportAction.isAccountValue(type)) {
            const account = App.state.getFirstAccount();
            assert(account, 'No accounts available');

            return account.id;
        }

        if (ImportAction.isPersonValue(type)) {
            const person = App.state.getFirstPerson();
            assert(person, 'No persons available');

            return person.id;
        }

        if (ImportAction.isCategoryValue(type)) {
            const category = App.state.categories.getItemByIndex(0);
            assert(category, 'No categories available');

            return category.id;
        }

        return '';
    }

    async addCondition() {
        const { conditions } = this.model.rule;

        const fieldType = this.getNextAvailProperty(this.model);
        const hasNotIsCond = conditions.hasNotIsCondition(fieldType.id);
        if (hasNotIsCond && fieldType.operators.length < 2) {
            return;
        }

        const operator = (hasNotIsCond)
            ? fieldType.operators[0]
            : fieldType.operators[1];

        const condition = {
            fieldType: fieldType.id,
            operator,
            value: this.getDefaultValue(fieldType.id),
            isFieldValue: false,
        };

        condition.state = ImportConditionForm.getStateName(condition);
        condition[condition.state] = condition.value;

        this.model.conditions.push(condition);
        this.expectedState = this.getExpectedState();

        await this.openConditions();

        await this.content.conditionsList.create();
        await this.parse();

        await this.checkState();
    }

    async deleteCondition(index) {
        const ind = parseInt(index, 10);
        assert.arrayIndex(this.content.conditionsList.content.items, ind);

        this.model.conditions.splice(ind, 1);
        this.expectedState = this.getExpectedState();

        await this.openConditions();

        const item = this.content.conditionsList.content.items[index];

        await item.clickDelete();
        await this.parse();

        return this.checkState();
    }

    async runOnCondition(index, { action, data }) {
        const ind = parseInt(index, 10);
        assert.arrayIndex(this.content.conditionsList.content.items, ind);

        if (action === 'changeFieldType') {
            return this.changeConditionFieldType(index, data);
        }
        if (action === 'changeOperator') {
            return this.changeConditionOperator(index, data);
        }
        if (action === 'changeTemplate') {
            return this.changeConditionTemplate(index, data);
        }
        if (action === 'changeAccount') {
            return this.changeConditionAccount(index, data);
        }
        if (action === 'changeCurrency') {
            return this.changeConditionCurrency(index, data);
        }
        if (action === 'changeProperty') {
            return this.changeConditionProperty(index, data);
        }
        if (action === 'inputAmount') {
            return this.inputConditionAmount(index, data);
        }
        if (action === 'inputValue') {
            return this.inputConditionValue(index, data);
        }
        if (action === 'togglePropValue') {
            return this.toggleConditionPropValue(index);
        }
        if (action === 'clickDelete') {
            return this.deleteCondition(index);
        }

        throw new Error(`Invalid action for Import condition: ${action}`);
    }

    async changeConditionFieldType(index, value) {
        const ind = parseInt(index, 10);
        assert.arrayIndex(this.content.conditionsList.content.items, ind);

        const conditionModel = this.model.conditions[ind];

        const fieldId = parseInt(value, 10);
        conditionModel.fieldType = fieldId;
        const field = ImportCondition.getFieldTypeById(fieldId);
        if (!field.operators.includes(conditionModel.operator)) {
            [conditionModel.operator] = field.operators;
        }
        conditionModel.state = ImportConditionForm.getStateName(conditionModel);
        conditionModel.value = ImportConditionForm.getStateValue(conditionModel);
        this.expectedState = this.getExpectedState();

        await this.openConditions();

        const item = this.content.conditionsList.content.items[ind];
        await this.performAction(() => item.changeFieldType(value));

        return this.checkState();
    }

    async changeConditionValue(index, name, value) {
        const ind = parseInt(index, 10);
        assert.arrayIndex(this.content.conditionsList.content.items, ind);

        const conditionModel = this.model.conditions[ind];
        assert(conditionModel.state === name, `Invalid state ${conditionModel.state} expected ${name}`);

        if (name === 'amount') {
            conditionModel[name] = trimToDigitsLimit(value, 2);
        } else {
            conditionModel[name] = value;
        }
        conditionModel.value = ImportConditionForm.getStateValue(conditionModel);
        this.expectedState = this.getExpectedState();

        await this.openConditions();

        const item = this.content.conditionsList.content.items[ind];
        await this.performAction(() => item.changeValue(name, value));

        return this.checkState();
    }

    async changeConditionOperator(index, value) {
        const ind = parseInt(index, 10);
        assert.arrayIndex(this.content.conditionsList.content.items, ind);

        const conditionModel = this.model.conditions[ind];
        conditionModel.operator = value;
        conditionModel.value = ImportConditionForm.getStateValue(conditionModel);
        this.expectedState = this.getExpectedState();

        await this.openConditions();

        const item = this.content.conditionsList.content.items[ind];
        await this.performAction(() => item.changeOperator(value));

        return this.checkState();
    }

    async changeConditionTemplate(index, value) {
        return this.changeConditionValue(index, 'template', value);
    }

    async changeConditionAccount(index, value) {
        return this.changeConditionValue(index, 'account', value);
    }

    async changeConditionCurrency(index, value) {
        return this.changeConditionValue(index, 'currency', value);
    }

    async changeConditionProperty(index, value) {
        return this.changeConditionValue(index, 'property', value);
    }

    async inputConditionAmount(index, value) {
        return this.changeConditionValue(index, 'amount', value);
    }

    async inputConditionValue(index, value) {
        return this.changeConditionValue(index, 'text', value);
    }

    async toggleConditionPropValue(index) {
        const ind = parseInt(index, 10);
        assert.arrayIndex(this.content.conditionsList.content.items, ind);

        const conditionModel = this.model.conditions[ind];
        conditionModel.isFieldValue = !conditionModel.isFieldValue;
        if (conditionModel.isFieldValue) {
            conditionModel.property = ImportConditionForm.getExpectedPropertyValue(conditionModel);
        }
        conditionModel.state = ImportConditionForm.getStateName(conditionModel);
        conditionModel.value = ImportConditionForm.getStateValue(conditionModel);
        this.expectedState = this.getExpectedState();

        await this.openConditions();

        const item = this.content.conditionsList.content.items[ind];
        await this.performAction(() => item.togglePropValue());

        return this.checkState();
    }

    async openActions() {
        if (this.content.actionsList.isCollapsed()) {
            await this.content.actionsList.toggle();
            await this.parse();
        }
    }

    async addAction() {
        const actionType = this.getNextAvailAction(this.model);
        const action = {
            actionType: actionType.id,
            value: this.getActionDefaultValue(actionType.id),
        };
        this.model.actions.push(action);

        this.expectedState = this.getExpectedState();

        await this.openActions();

        await this.content.actionsList.create();
        await this.parse();

        return this.checkState();
    }

    async deleteAction(index) {
        const ind = parseInt(index, 10);
        assert.arrayIndex(this.content.actionsList.content.items, ind);

        const removedAction = this.model.actions[ind];
        this.model.actions.splice(ind, 1);

        // Remove `Set account` and `Set person` actions if `Set transaction type` was removed
        if (removedAction.actionType === IMPORT_ACTION_SET_TR_TYPE) {
            const actionsToRemove = [IMPORT_ACTION_SET_ACCOUNT, IMPORT_ACTION_SET_PERSON];
            this.model.actions = this.model.actions.filter((action) => (
                !actionsToRemove.includes(action.actionType)
            ));
        }

        this.expectedState = this.getExpectedState();

        await this.openActions();

        const item = this.content.actionsList.content.items[index];

        await item.clickDelete();
        await this.parse();

        await this.checkState();
    }

    async runOnAction(index, { action, data }) {
        if (action === 'changeAction') {
            return this.changeActionType(index, data);
        }
        if (action === 'changeTransactionType') {
            return this.changeActionTransactionType(index, data);
        }
        if (action === 'changeAccount') {
            return this.changeActionAccount(index, data);
        }
        if (action === 'changePerson') {
            return this.changeActionPerson(index, data);
        }
        if (action === 'changeCategory') {
            return this.changeActionCategory(index, data);
        }
        if (action === 'inputAmount') {
            return this.inputActionAmount(index, data);
        }
        if (action === 'inputValue') {
            return this.inputActionValue(index, data);
        }
        if (action === 'clickDelete') {
            return this.deleteAction(index);
        }

        throw new Error(`Invalid action for Import action: ${action}`);
    }

    onActionUpdate() {
        this.setExpectedRule();

        // Check `Set transaction type` action was changed and remove not available
        // `Set account` or `Set person` action
        const hasTransfer = this.model.rule.actions.hasSetTransfer();
        const hasDebt = this.model.rule.actions.hasSetDebt();

        this.model.actions = this.model.actions.filter((action) => {
            if (action.actionType === IMPORT_ACTION_SET_ACCOUNT) {
                return hasTransfer;
            }

            if (action.actionType === IMPORT_ACTION_SET_PERSON) {
                return hasDebt;
            }

            return true;
        });
    }

    async changeActionType(index, value) {
        const ind = parseInt(index, 10);
        assert.arrayIndex(this.content.actionsList.content.items, ind);

        const actionModel = this.model.actions[ind];
        const actionId = parseInt(value, 10);
        actionModel.actionType = actionId;
        actionModel.state = ImportActionForm.getStateName(actionModel);
        actionModel.value = ImportActionForm.getStateValue(actionModel);

        this.onActionUpdate();
        this.expectedState = this.getExpectedState();

        await this.openActions();

        const item = this.content.actionsList.content.items[ind];
        await this.performAction(() => item.changeAction(value));

        await this.checkState();
    }

    async changeActionValue(index, name, value) {
        const ind = parseInt(index, 10);
        assert.arrayIndex(this.content.actionsList.content.items, ind);

        const actionModel = this.model.actions[ind];
        if (name === 'amount') {
            actionModel[name] = trimToDigitsLimit(value, 2);
        } else {
            actionModel[name] = value;
        }
        actionModel.value = ImportActionForm.getStateValue(actionModel);

        this.onActionUpdate();
        this.expectedState = this.getExpectedState();

        await this.openActions();

        const item = this.content.actionsList.content.items[ind];
        await this.performAction(() => item.changeValue(name, value));

        await this.checkState();
    }

    async changeActionTransactionType(index, value) {
        return this.changeActionValue(index, 'transType', value);
    }

    async changeActionAccount(index, value) {
        return this.changeActionValue(index, 'account', value);
    }

    async changeActionPerson(index, value) {
        return this.changeActionValue(index, 'person', value);
    }

    async changeActionCategory(index, value) {
        return this.changeActionValue(index, 'category', value);
    }

    async inputActionAmount(index, value) {
        return this.changeActionValue(index, 'amount', value);
    }

    async inputActionValue(index, value) {
        return this.changeActionValue(index, 'text', value);
    }

    async submit() {
        await click(this.content.submitBtn.elem);
    }

    async cancel() {
        await click(this.content.cancelBtn.elem);
    }
}
