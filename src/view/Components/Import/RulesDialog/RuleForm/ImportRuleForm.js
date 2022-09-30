import {
    ce,
    enable,
    isFunction,
    copyObject,
    Component,
    Collapsible,
} from 'jezvejs';
import { ImportRule } from '../../../../js/model/ImportRule.js';
import { ImportAction } from '../../../../js/model/ImportAction.js';
import { ImportCondition } from '../../../../js/model/ImportCondition.js';
import { ImportConditionForm } from '../ConditionForm/ImportConditionForm.js';
import { ImportActionForm } from '../ActionForm/ImportActionForm.js';
import './style.scss';

/** Strings */
const BTN_CREATE_CONDITION = 'Create';
const TITLE_CONDITIONS = 'Conditions';
const BTN_CREATE_ACTION = 'Create';
const TITLE_ACTIONS = 'Actions';
const BTN_SAVE = 'Submit';
const BTN_CANCEL = 'Cancel';
const MSG_NO_DATA = 'No data';
const MSG_NO_ACTIONS = 'No actions';
const MSG_NO_CONDITIONS = 'No conditions';

/**
 * ImportRuleForm component
 */
export class ImportRuleForm extends Component {
    static create(props) {
        return new ImportRuleForm(props);
    }

    constructor(...args) {
        super(...args);

        if (!this.props || !this.props.data) {
            throw new Error('Invalid props');
        }

        this.submitHandler = this.props.submit;
        this.cancelHandler = this.props.cancel;
        this.updateHandler = this.props.update;
        this.deleteHandler = this.props.remove;

        if (!(this.props.data instanceof ImportRule)) {
            throw new Error('Invalid rule item');
        }

        this.fieldTypes = ImportCondition.getFieldTypes();
        this.actionTypes = ImportAction.getTypes();
        this.transactionTypes = ImportAction.getTransactionTypes();

        this.init();
        this.setData(this.props.data);
    }

    /** Form controls initialization */
    init() {
        // Hidden id input
        this.idInput = ce('input', { type: 'hidden' });
        // Conditions
        this.createCondBtn = ce(
            'button',
            { className: 'btn link-btn create-btn', type: 'button', textContent: BTN_CREATE_CONDITION },
            null,
            { click: (e) => this.onCreateConditionClick(e) },
        );
        this.toggleCondBtn = ce(
            'button',
            { className: 'btn icon-btn toggle-btn right-align', type: 'button' },
            window.app.createIcon('toggle-ext', 'icon toggle-icon'),
        );

        this.conditionsCollapse = new Collapsible({
            className: 'rule-form-collapse',
            header: [
                ce('label', { textContent: TITLE_CONDITIONS }),
                this.createCondBtn,
                this.toggleCondBtn,
            ],
            content: [],
            onStateChange: (expanded) => this.onToggleConditions(expanded),
        });

        // Actions
        this.createActionBtn = ce(
            'button',
            { className: 'btn link-btn create-btn', type: 'button', textContent: BTN_CREATE_ACTION },
            null,
            { click: (e) => this.onCreateActionClick(e) },
        );
        this.toggleActionsBtn = ce(
            'button',
            { className: 'btn icon-btn toggle-btn right-align', type: 'button' },
            window.app.createIcon('toggle-ext', 'icon toggle-icon'),
        );

        this.actionsCollapse = new Collapsible({
            className: 'rule-form-collapse',
            header: [
                ce('label', { textContent: TITLE_ACTIONS }),
                this.createActionBtn,
                this.toggleActionsBtn,
            ],
            content: [],
            onStateChange: (expanded) => this.onToggleActions(expanded),
        });

        // Controls
        this.saveBtn = ce(
            'button',
            { className: 'btn submit-btn', type: 'button', textContent: BTN_SAVE },
            null,
            { click: () => this.onSubmit() },
        );
        this.cancelBtn = ce(
            'button',
            { className: 'btn link-btn cancel-btn', type: 'button', textContent: BTN_CANCEL },
            null,
            { click: () => this.onCancel() },
        );

        // Invalid feedback message
        this.validFeedback = ce('div', { className: 'invalid-feedback' });
        this.feedbackContainer = window.app.createContainer(
            'rule-form__feedback validation-block',
            this.validFeedback,
        );

        this.controls = window.app.createContainer('form-controls', [
            this.saveBtn,
            this.cancelBtn,
        ]);

        this.elem = window.app.createContainer('rule-form', [
            this.idInput,
            this.conditionsCollapse.elem,
            this.actionsCollapse.elem,
            this.feedbackContainer,
            this.controls,
        ]);
    }

    /** Set main state of component */
    setData(data) {
        if (!data) {
            throw new Error('Invalid data');
        }

        this.state = {
            rule: data,
        };

        this.render(this.state);
    }

    /** Search for first action type not used in rule */
    getNextAvailAction(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        // Obtain action types currently used by rule
        const ruleActionTypes = state.rule.actions.map((action) => action.action_id);
        // Search for first action type not in list
        return this.actionTypes.find(
            (actionType) => !ruleActionTypes.includes(actionType.id),
        );
    }

    /** Return default value for specified action type */
    getActionDefaultValue(actionTypeId) {
        const actionType = parseInt(actionTypeId, 10);
        if (!actionType) {
            throw new Error('Invalid action type');
        }

        if (ImportAction.isTransactionTypeValue(actionType)) {
            const item = this.transactionTypes[0];
            return item.id;
        }

        if (ImportAction.isAccountValue(actionType)) {
            const item = window.app.model.accounts.getItemByIndex(0);
            if (!item) {
                throw new Error('No accounts available');
            }

            return item.id;
        }

        if (ImportAction.isPersonValue(actionType)) {
            const item = window.app.model.persons.getItemByIndex(0);
            if (!item) {
                throw new Error('No persons available');
            }

            return item.id;
        }

        return '';
    }

    /** Create action button 'click' event handler */
    onCreateActionClick(e) {
        e.stopPropagation();

        const actionType = this.getNextAvailAction(this.state);
        if (!actionType) {
            return;
        }

        const actionData = {
            action_id: actionType.id,
            value: this.getActionDefaultValue(actionType.id),
        };

        this.state.rule.actions.addItem(actionData);

        this.conditionsCollapse.collapse();
        this.actionsCollapse.expand();
        this.state.validation = null;

        this.render(this.state);
    }

    /** Search for first condition field type not used in rule */
    getNextAvailProperty(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        // Obtain condition field types currently used by rule
        const ruleFieldTypes = state.rule.conditions.map((condition) => condition.field_id);
        // Filter available field types
        const availFields = this.fieldTypes.filter(
            (fieldType) => !ImportCondition.isTemplateField(fieldType.id),
        );

        // Search for first field type not in list
        return availFields.find((fieldType) => !ruleFieldTypes.includes(fieldType.id));
    }

    /** Return default condition value for specified field type */
    getConditionDefaultValue(fieldId) {
        const fieldType = parseInt(fieldId, 10);
        if (!fieldType) {
            throw new Error('Invalid field type');
        }

        if (ImportCondition.isAccountField(fieldType)) {
            const item = window.app.model.accounts.getItemByIndex(0);
            if (!item) {
                throw new Error('No accounts available');
            }

            return item.id;
        }

        if (ImportCondition.isTemplateField(fieldType)) {
            const item = window.app.model.templates.getItemByIndex(0);
            if (!item) {
                throw new Error('No template available');
            }

            return item.id;
        }

        if (ImportCondition.isCurrencyField(fieldType)) {
            const item = window.app.model.currency.getItemByIndex(0);
            if (!item) {
                throw new Error('No currency available');
            }

            return item.id;
        }

        return '';
    }

    /** Create condition button 'click' event handler */
    onCreateConditionClick(e) {
        e.stopPropagation();

        const fieldType = this.getNextAvailProperty(this.state);
        if (!fieldType) {
            return;
        }

        const conditionData = {
            field_id: fieldType.id,
            operator: fieldType.operators[0],
            value: this.getConditionDefaultValue(fieldType.id),
            flags: 0,
        };

        this.state.rule.conditions.addItem(conditionData);

        this.conditionsCollapse.expand();
        this.actionsCollapse.collapse();
        this.state.validation = null;

        this.render(this.state);
    }

    /** Conditions collapse state change event handler */
    onToggleConditions(expanded) {
        if (expanded) {
            this.actionsCollapse.collapse();
        }
    }

    /** Actions collapse state change  event handler */
    onToggleActions(expanded) {
        if (expanded) {
            this.conditionsCollapse.collapse();
        }
    }

    /** Return import rule object */
    getData(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        const res = {
            flags: 0,
        };
        if (state.rule.id) {
            res.id = state.rule.id;
        }

        res.conditions = copyObject(state.rule.conditions.data);
        res.actions = copyObject(state.rule.actions.data);

        return res;
    }

    /** Validate import rule from state object */
    validateRule() {
        const validation = this.state.rule.validate();

        this.state.validation = validation;

        if (validation && !validation.valid) {
            if ('conditionIndex' in validation) {
                this.conditionsCollapse.expand();
                this.actionsCollapse.collapse();
            } else if ('actionIndex' in validation) {
                this.conditionsCollapse.collapse();
                this.actionsCollapse.expand();
            }
        }

        this.render(this.state);
    }

    /** Save button 'click' event handler */
    onSubmit() {
        this.validateRule();
        if (!this.state.validation.valid) {
            return;
        }

        if (isFunction(this.submitHandler)) {
            this.submitHandler(this.getData(this.state));
        }
    }

    /** Cancel button 'click' event handler */
    onCancel() {
        if (isFunction(this.cancelHandler)) {
            this.cancelHandler();
        }
    }

    /** Condition 'update' event handler */
    onConditionUpdate(index, data) {
        this.state.rule.conditions.updateItemByIndex(index, data);
    }

    /** Condition 'delete' event handler */
    onConditionDelete(index) {
        this.state.rule.conditions.deleteItemByIndex(index);
        this.state.validation = null;
        this.render(this.state);
    }

    /** Action 'update' event handler */
    onActionUpdate(index, data) {
        this.state.rule.actions.updateItemByIndex(index, data);
    }

    /** Action 'delete' event handler */
    onActionDelete(index) {
        this.state.rule.actions.deleteItemByIndex(index);
        this.state.validation = null;
        this.render(this.state);
    }

    /** Set data for list container */
    setListContainerData(container, data, noDataMessage) {
        if (!container) {
            throw new Error('Invalid list container');
        }

        const message = (typeof noDataMessage === 'string')
            ? noDataMessage
            : MSG_NO_DATA;

        if (Array.isArray(data) && data.length > 0) {
            const dataItems = data.map((item) => item.elem);
            container.setContent(dataItems);
        } else {
            const noDataMsgElem = ce('span', { className: 'nodata-message', textContent: message });
            container.setContent(noDataMsgElem);
        }
    }

    /** Validate rule data and enable/disable submit button */
    validateActionsAvail(state) {
        const isAvail = this.getNextAvailAction(state);

        enable(this.createActionBtn, !!isAvail);
    }

    /** Render component state */
    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.idInput.value = (state.rule.id) ? state.rule.id : '';

        this.validateActionsAvail(state);

        if (state.validation
            && !state.validation.valid
            && !('conditionIndex' in state.validation)
            && !('actionIndex' in state.validation)) {
            this.validFeedback.textContent = state.validation.message;
            window.app.invalidateBlock(this.feedbackContainer);
        } else {
            this.validFeedback.textContent = '';
            window.app.clearBlockValidation(this.feedbackContainer);
        }

        // Actions
        const actionItems = state.rule.actions.map((action, index) => {
            const props = {
                data: action,
                isValid: true,
                update: (data) => this.onActionUpdate(index, data),
                remove: () => this.onActionDelete(index),
            };

            if (
                state.validation
                && !state.validation.valid
                && state.validation.actionIndex === index
            ) {
                props.isValid = false;
                props.message = state.validation.message;
            }

            return new ImportActionForm(props);
        });
        this.setListContainerData(this.actionsCollapse, actionItems, MSG_NO_ACTIONS);

        // Conditions
        const conditionItems = state.rule.conditions.map((condition, index) => {
            const props = {
                data: condition,
                isValid: true,
                update: (data) => this.onConditionUpdate(index, data),
                remove: () => this.onConditionDelete(index),
            };

            if (state.validation
                && !state.validation.valid
                && state.validation.conditionIndex === index) {
                props.isValid = false;
                props.message = state.validation.message;
            }

            return new ImportConditionForm(props);
        });
        this.setListContainerData(this.conditionsCollapse, conditionItems, MSG_NO_CONDITIONS);
    }
}
