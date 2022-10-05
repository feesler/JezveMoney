import {
    createElement,
    enable,
    isFunction,
    copyObject,
    Component,
    Collapsible,
} from 'jezvejs';
import { ImportRule } from '../../../../js/model/ImportRule.js';
import {
    IMPORT_ACTION_SET_ACCOUNT,
    IMPORT_ACTION_SET_PERSON,
    IMPORT_ACTION_SET_TR_TYPE,
    ImportAction,
} from '../../../../js/model/ImportAction.js';
import { ImportCondition, IMPORT_COND_OP_EQUAL } from '../../../../js/model/ImportCondition.js';
import { ImportConditionForm } from '../ConditionForm/ImportConditionForm.js';
import { ImportActionForm } from '../ActionForm/ImportActionForm.js';
import './style.scss';
import { ImportActionList } from '../../../../js/model/ImportActionList.js';

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

const defaultProps = {
    onSubmit: null,
    onCancel: null,
};

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
        if (!(this.props.data instanceof ImportRule)) {
            throw new Error('Invalid rule item');
        }

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        this.fieldTypes = ImportCondition.getFieldTypes();
        this.actionTypes = ImportAction.getTypes();
        this.transactionTypes = ImportAction.getTransactionTypes();

        this.init();
        this.setData(this.props.data);
    }

    /** Form controls initialization */
    init() {
        // Hidden id input
        this.idInput = createElement('input', { props: { type: 'hidden' } });
        // Conditions
        this.createCondBtn = createElement('button', {
            props: {
                className: 'btn link-btn create-btn',
                type: 'button',
                textContent: BTN_CREATE_CONDITION,
            },
            events: { click: (e) => this.onCreateConditionClick(e) },
        });
        this.toggleCondBtn = createElement('button', {
            props: { className: 'btn icon-btn toggle-btn right-align', type: 'button' },
            children: window.app.createIcon('toggle-ext', 'icon toggle-icon'),
        });

        this.conditionsCollapse = Collapsible.create({
            className: 'rule-form-collapse',
            header: [
                createElement('label', { props: { textContent: TITLE_CONDITIONS } }),
                this.createCondBtn,
                this.toggleCondBtn,
            ],
            content: [],
            onStateChange: (expanded) => this.onToggleConditions(expanded),
        });

        // Actions
        this.createActionBtn = createElement('button', {
            props: { className: 'btn link-btn create-btn', type: 'button', textContent: BTN_CREATE_ACTION },
            events: { click: (e) => this.onCreateActionClick(e) },
        });
        this.toggleActionsBtn = createElement('button', {
            props: { className: 'btn icon-btn toggle-btn right-align', type: 'button' },
            children: window.app.createIcon('toggle-ext', 'icon toggle-icon'),
        });

        this.actionsCollapse = new Collapsible({
            className: 'rule-form-collapse',
            header: [
                createElement('label', { props: { textContent: TITLE_ACTIONS } }),
                this.createActionBtn,
                this.toggleActionsBtn,
            ],
            content: [],
            onStateChange: (expanded) => this.onToggleActions(expanded),
        });

        // Controls
        this.saveBtn = createElement('button', {
            props: { className: 'btn submit-btn', type: 'button', textContent: BTN_SAVE },
            events: { click: () => this.onSubmit() },
        });
        this.cancelBtn = createElement('button', {
            props: { className: 'btn link-btn cancel-btn', type: 'button', textContent: BTN_CANCEL },
            events: { click: () => this.onCancel() },
        });

        // Invalid feedback message
        this.validFeedback = createElement('div', { props: { className: 'invalid-feedback' } });
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

        // Search for first action type not in list
        return this.actionTypes.find((actionType) => {
            if (state.rule.actions.hasAction(actionType.id)) {
                return false;
            }

            if (actionType.id === IMPORT_ACTION_SET_ACCOUNT) {
                return state.rule.actions.hasSetTransfer();
            }

            if (actionType.id === IMPORT_ACTION_SET_PERSON) {
                return (
                    window.app.model.persons.length > 0
                    && state.rule.actions.hasSetDebt()
                );
            }

            return true;
        });
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
        const availFields = this.fieldTypes.filter((fieldType) => {
            if (ImportCondition.isTemplateField(fieldType.id)) {
                return window.app.model.templates.length > 0;
            }

            return true;
        });

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

        const { conditions } = this.state.rule;

        const fieldType = this.getNextAvailProperty(this.state);
        if (!fieldType) {
            return;
        }

        const hasNotIsCond = conditions.hasNotIsCondition(fieldType.id);
        if (hasNotIsCond && fieldType.operators.length < 2) {
            return;
        }

        const operator = (hasNotIsCond)
            ? fieldType.operators[0]
            : fieldType.operators[1];

        const conditionData = {
            field_id: fieldType.id,
            operator,
            value: this.getConditionDefaultValue(fieldType.id),
            flags: 0,
        };

        conditions.addItem(conditionData);

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

        if (isFunction(this.props.onSubmit)) {
            this.props.onSubmit(this.getData(this.state));
        }
    }

    /** Cancel button 'click' event handler */
    onCancel() {
        if (isFunction(this.props.onCancel)) {
            this.props.onCancel();
        }
    }

    /** Condition 'update' event handler */
    onConditionUpdate(index, data) {
        const { conditions } = this.state.rule;

        const conditionToUpdate = copyObject(conditions.getItemByIndex(index));
        conditions.updateItemByIndex(index, data);

        // If condition operator not changed and current operator is not `is`
        // then skip conditions list update
        if (
            conditionToUpdate.operator === data.operator
            && data.operator !== IMPORT_COND_OP_EQUAL
        ) {
            return;
        }

        this.render(this.state);
    }

    /** Condition 'delete' event handler */
    onConditionDelete(index) {
        this.state.rule.conditions.deleteItemByIndex(index);
        this.state.validation = null;
        this.render(this.state);
    }

    /** Remove `Set account` and `Set person` actions */
    removeTransactionDependActions() {
        const actionsToRemove = [IMPORT_ACTION_SET_ACCOUNT, IMPORT_ACTION_SET_PERSON];
        const newActions = this.state.rule.actions.filter((action) => (
            !actionsToRemove.includes(action.action_id)
        ));
        this.state.rule.actions = ImportActionList.create(newActions);
    }

    /** Action 'update' event handler */
    onActionUpdate(index, data) {
        const { actions } = this.state.rule;

        const actionToUpdate = copyObject(actions.getItemByIndex(index));
        actions.updateItemByIndex(index, data);

        // If action type not changed and current type is not `Set transaction type`
        // then skip action list update
        if (
            actionToUpdate.action_id === data.action_id
            && data.action_id !== IMPORT_ACTION_SET_TR_TYPE
        ) {
            return;
        }

        // Check `Set transaction type` action was changed and remove not available
        // `Set account` or `Set person` action
        const hasTransfer = actions.hasSetTransfer();
        const hasDebt = actions.hasSetDebt();

        const newActions = actions.filter((action) => {
            if (action.action_id === IMPORT_ACTION_SET_ACCOUNT) {
                return hasTransfer;
            }

            if (action.action_id === IMPORT_ACTION_SET_PERSON) {
                return hasDebt;
            }

            return true;
        });
        this.state.rule.actions = ImportActionList.create(newActions);

        this.render(this.state);
    }

    /** Action 'delete' event handler */
    onActionDelete(index) {
        const removedAction = this.state.rule.actions.getItemByIndex(index);
        this.state.rule.actions.deleteItemByIndex(index);

        if (removedAction.action_id === IMPORT_ACTION_SET_TR_TYPE) {
            this.removeTransactionDependActions();
        }

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
            const noDataMsgElem = createElement('span', {
                props: { className: 'nodata-message', textContent: message },
            });
            container.setContent(noDataMsgElem);
        }
    }

    validateConditionsAvail(state) {
        const isAvail = this.getNextAvailProperty(state);

        enable(this.createCondBtn, !!isAvail);
    }

    validateActionsAvail(state) {
        const isAvail = this.getNextAvailAction(state);

        enable(this.createActionBtn, !!isAvail);
    }

    /** Renders conditions list */
    renderConditionsList(state) {
        const { conditions } = state.rule;

        const conditionItems = conditions.map((condition, index) => {
            const props = {
                data: condition,
                isValid: true,
                onUpdate: (data) => this.onConditionUpdate(index, data),
                onRemove: () => this.onConditionDelete(index),
            };

            if (
                state.validation
                && !state.validation.valid
                && state.validation.conditionIndex === index
            ) {
                props.isValid = false;
                props.message = state.validation.message;
            }

            let propFilter = this.fieldTypes.map(({ id }) => id);
            // Remove properties which already have `is` operator
            propFilter = propFilter.filter((property) => {
                const found = conditions.findIsCondition(property);
                const foundInd = conditions.indexOf(found);
                return (!found || foundInd === index);
            });

            props.properties = propFilter;

            return ImportConditionForm.create(props);
        });
        this.setListContainerData(this.conditionsCollapse, conditionItems, MSG_NO_CONDITIONS);
    }

    /** Render actions list */
    renderActionsList(state) {
        const { actions } = state.rule;

        const actionItems = actions.map((action, index) => {
            const props = {
                data: action,
                isValid: true,
                onUpdate: (data) => this.onActionUpdate(index, data),
                onRemove: () => this.onActionDelete(index),
            };

            if (
                state.validation
                && !state.validation.valid
                && state.validation.actionIndex === index
            ) {
                props.isValid = false;
                props.message = state.validation.message;
            }

            let actionsFilter = this.actionTypes.map(({ id }) => id);
            // Remove already added actions
            actionsFilter = actionsFilter.filter((type) => {
                const found = actions.findAction(type);
                return (!found || found === action);
            });

            // Show `Set account` action if has `Set transaction type` action with
            // transfer type selected
            const setAccountAction = actions.findAction(IMPORT_ACTION_SET_ACCOUNT);
            const showSetAccount = (
                actions.hasSetTransfer()
                && (!setAccountAction || setAccountAction === action)
            );
            if (!showSetAccount) {
                actionsFilter = actionsFilter.filter((type) => type !== IMPORT_ACTION_SET_ACCOUNT);
            }

            // Show `Set person` action if person available and has `Set transaction type` action
            // with debt type selected
            const setPersonAction = actions.findAction(IMPORT_ACTION_SET_PERSON);
            const showSetPerson = (
                window.app.model.persons.length > 0
                && actions.hasSetDebt()
                && (!setPersonAction || setPersonAction === action)
            );
            if (!showSetPerson) {
                actionsFilter = actionsFilter.filter((type) => type !== IMPORT_ACTION_SET_PERSON);
            }

            props.actions = actionsFilter;

            return ImportActionForm.create(props);
        });
        this.setListContainerData(this.actionsCollapse, actionItems, MSG_NO_ACTIONS);
    }

    /** Render component state */
    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.idInput.value = (state.rule.id) ? state.rule.id : '';

        this.validateConditionsAvail(state);
        this.validateActionsAvail(state);

        if (
            state.validation
            && !state.validation.valid
            && !('conditionIndex' in state.validation)
            && !('actionIndex' in state.validation)
        ) {
            this.validFeedback.textContent = state.validation.message;
            window.app.invalidateBlock(this.feedbackContainer);
        } else {
            this.validFeedback.textContent = '';
            window.app.clearBlockValidation(this.feedbackContainer);
        }

        this.renderActionsList(state);
        this.renderConditionsList(state);
    }
}
