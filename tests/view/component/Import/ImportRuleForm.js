import { copyObject } from 'jezve-test';
import { AppComponent } from '../AppComponent.js';
import { Currency } from '../../../model/Currency.js';
import { ImportTransaction } from '../../../model/ImportTransaction.js';
import { ImportRule } from '../../../model/ImportRule.js';
import {
    ImportCondition,
    IMPORT_COND_OP_FIELD_FLAG,
} from '../../../model/ImportCondition.js';
import { ImportAction } from '../../../model/ImportAction.js';
import { ImportConditionForm } from './ImportConditionForm.js';
import { ImportRuleAccordion } from './ImportRuleAccordion.js';
import { ImportActionForm } from './ImportActionForm.js';
import { asyncMap } from '../../../common.js';
import { App } from '../../../Application.js';
import {
    query,
    queryAll,
    prop,
    click,
} from '../../../env.js';

export class ImportRuleForm extends AppComponent {
    async parseContent() {
        const res = {};

        const accordionElems = await queryAll(this.elem, '.rule-form-collapse');
        const accordionItems = await asyncMap(
            accordionElems,
            (elem) => ImportRuleAccordion.create(this, elem),
        );

        accordionItems.forEach((item) => {
            if (item.content.title === 'Conditions') {
                res.conditionsList = item;
            } else if (item.content.title === 'Actions') {
                res.actionsList = item;
            } else {
                throw new Error(`Unknown container: '${item.content.title}'`);
            }
        });

        res.idInput = { elem: await query(this.elem, 'input[type=hidden]') };
        res.submitBtn = { elem: await query(this.elem, '.rule-form__controls .submit-btn') };
        res.cancelBtn = { elem: await query(this.elem, '.rule-form__controls .cancel-btn') };
        res.feedbackElem = { elem: await query(this.elem, '.rule-form__feedback .invalid-feedback') };
        if (
            !res.idInput.elem
            || !res.conditionsList
            || !res.conditionsList.elem
            || !res.actionsList
            || !res.actionsList.elem
            || !res.submitBtn.elem
            || !res.cancelBtn.elem
            || !res.feedbackElem.elem
        ) {
            throw new Error('Invalid structure of import rule from');
        }

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

        const ruleData = {};
        const ruleId = parseInt(cont.idInput.value, 10);
        if (ruleId) {
            res.id = ruleId;
            ruleData.id = ruleId;
        }

        ruleData.conditions = res.conditions.map(
            (item) => this.getExpectedCondition(item),
        );
        ruleData.actions = res.actions.map(
            (item) => this.getExpectedAction(item),
        );

        res.rule = new ImportRule(ruleData);

        return res;
    }

    static getExpectedState(model) {
        const res = {
            visibility: {
                conditionsList: true,
                actionsList: true,
            },
            values: {
                conditionsList: {},
                actionsList: {},
            },
        };

        res.values.conditionsList.items = model.conditions.map(
            (item) => ImportConditionForm.getExpectedState(item).values,
        );

        res.values.actionsList.items = model.actions.map(
            (item) => ImportActionForm.getExpectedState(item).values,
        );

        return res;
    }

    getExpectedCondition(model) {
        return {
            field_id: parseInt(model.fieldType, 10),
            operator: parseInt(model.operator, 10),
            value: model.value.toString(),
            flags: (model.isFieldValue) ? IMPORT_COND_OP_FIELD_FLAG : 0,
        };
    }

    getExpectedAction(model) {
        return {
            action_id: parseInt(model.actionType, 10),
            value: model.value.toString(),
        };
    }

    /** Return expected import rule object */
    getExpectedRule() {
        const res = {
            flags: 0,
        };

        res.conditions = this.model.conditions.map((item) => this.getExpectedCondition(item));
        res.actions = this.model.actions.map((item) => this.getExpectedAction(item));

        if (this.model.id) {
            res.id = this.model.id;
        }

        return res;
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
        if (!model) {
            throw new Error('Invalid model');
        }

        // Obtain condition field types currently used by rule
        const ruleFieldTypes = model.conditions.map((condition) => condition.fieldType);
        // Filter available field types
        const availFields = ImportCondition.fieldTypes.filter((fieldType) => {
            if (ImportCondition.isTemplateField(fieldType.id)) {
                return App.state.templates.length > 0;
            }

            return true;
        });

        // Search for first field type not in list
        return availFields.find((fieldType) => !ruleFieldTypes.includes(fieldType.id));
    }

    /** Search for first action type not used in rule */
    getNextAvailAction(model) {
        if (!model) {
            throw new Error('Invalid model');
        }

        // Obtain action types currently used by rule
        const ruleActionTypes = model.actions.map((action) => action.actionType);
        // Search for first action type not in list
        return ImportAction.actionTypes.find(
            (actionType) => !ruleActionTypes.includes(actionType.id),
        );
    }

    getDefaultValue(fieldId) {
        const fieldType = parseInt(fieldId, 10);
        if (!fieldType) {
            throw new Error('Invalid field type');
        }

        if (ImportCondition.isAccountField(fieldType)) {
            const account = App.state.accounts.getUserVisible().getItemByIndex(0);
            if (!account) {
                throw new Error('No accounts available');
            }

            return account.id;
        }

        if (ImportCondition.isTemplateField(fieldType)) {
            const template = App.state.template.getItemByIndex(0);
            if (!template) {
                throw new Error('No template available');
            }

            return template.id;
        }

        if (ImportCondition.isCurrencyField(fieldType)) {
            const currency = Currency.getItemByIndex(0);
            if (!currency) {
                throw new Error('No currency available');
            }

            return currency.id;
        }

        return '';
    }

    getActionDefaultValue(actionType) {
        const type = parseInt(actionType, 10);
        if (!type) {
            throw new Error('Invalid action type');
        }

        if (ImportAction.isTransactionTypeValue(type)) {
            const [transType] = ImportTransaction.availTypes;
            return transType.id;
        }

        if (ImportAction.isAccountValue(type)) {
            const account = App.state.accounts.getUserVisible().getItemByIndex(0);
            if (!account) {
                throw new Error('No accounts available');
            }

            return account.id;
        }

        if (ImportAction.isPersonValue(type)) {
            const person = App.state.persons.getVisible().getItemByIndex(0);
            if (!person) {
                throw new Error('No persons available');
            }

            return person.id;
        }

        return '';
    }

    async addCondition() {
        const fieldType = this.getNextAvailProperty(this.model);
        const condition = {
            fieldType: fieldType.id,
            operator: fieldType.operators[0],
            value: this.getDefaultValue(fieldType.id),
            isFieldValue: false,
        };

        condition.state = ImportConditionForm.getStateName(condition);
        condition[condition.state] = condition.value;

        this.model.conditions.push(condition);
        this.expectedState = ImportRuleForm.getExpectedState(this.model);

        await this.openConditions();

        await this.content.conditionsList.create();
        await this.parse();

        await this.checkState();
    }

    async deleteCondition(index) {
        const ind = parseInt(index, 10);
        if (
            Number.isNaN(ind)
            || ind < 0
            || ind >= this.content.conditionsList.content.items.length
        ) {
            throw new Error(`Invalid condition index: ${index}`);
        }

        this.model.conditions.splice(ind, 1);
        this.expectedState = ImportRuleForm.getExpectedState(this.model);

        await this.openConditions();

        const item = this.content.conditionsList.content.items[index];

        await item.clickDelete();
        await this.parse();

        return this.checkState();
    }

    async runOnCondition(index, { action, data }) {
        const ind = parseInt(index, 10);
        if (
            Number.isNaN(ind)
            || ind < 0
            || ind >= this.content.conditionsList.content.items.length
        ) {
            throw new Error(`Invalid condition index: ${index}`);
        }

        await this.openConditions();

        const item = this.content.conditionsList.content.items[index];
        await item.runAction(action, data);
        await this.parse();
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
        this.expectedState = ImportRuleForm.getExpectedState(this.model);

        await this.openActions();

        await this.content.actionsList.create();
        await this.parse();

        return this.checkState();
    }

    async deleteAction(index) {
        const ind = parseInt(index, 10);
        if (
            Number.isNaN(ind)
            || ind < 0
            || ind >= this.content.actionsList.content.items.length
        ) {
            throw new Error(`Invalid action index: ${index}`);
        }

        this.model.actions.splice(ind, 1);
        this.expectedState = ImportRuleForm.getExpectedState(this.model);

        await this.openActions();

        const item = this.content.actionsList.content.items[index];

        await item.clickDelete();
        await this.parse();

        await this.checkState();
    }

    async runOnAction(index, { action, data }) {
        const ind = parseInt(index, 10);
        if (
            Number.isNaN(ind)
            || ind < 0
            || ind >= this.content.actionsList.content.items.length
        ) {
            throw new Error(`Invalid action index: ${index}`);
        }

        await this.openActions();

        const item = this.content.actionsList.content.items[index];
        await item.runAction(action, data);
        await this.parse();
    }

    async submit() {
        await click(this.content.submitBtn.elem);
    }

    async cancel() {
        await click(this.content.cancelBtn.elem);
    }

    /**
     * Convert import rule object to expected state of component
     * @param {Object} item - import rule object
     * @param {AppState} state - application state
     */
    static render(item, state) {
        if (!item || !state) {
            throw new Error('Invalid parameters');
        }
    }
}
