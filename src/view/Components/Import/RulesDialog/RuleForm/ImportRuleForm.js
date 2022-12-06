import {
    createElement,
    enable,
    isFunction,
    copyObject,
    Component,
} from 'jezvejs';
import { Collapsible } from 'jezvejs/Collapsible';
import { Icon } from 'jezvejs/Icon';
import {
    IMPORT_ACTION_SET_ACCOUNT,
    IMPORT_ACTION_SET_PERSON,
    IMPORT_ACTION_SET_TR_TYPE,
    ImportAction,
} from '../../../../js/model/ImportAction.js';
import { ImportCondition } from '../../../../js/model/ImportCondition.js';
import { ImportActionList } from '../../../../js/model/ImportActionList.js';
import { ImportConditionForm } from '../ConditionForm/ImportConditionForm.js';
import { ImportActionForm } from '../ActionForm/ImportActionForm.js';
import { ListContainer } from '../../../ListContainer/ListContainer.js';
import './style.scss';
import { ImportRule } from '../../../../js/model/ImportRule.js';

/** Strings */
const BTN_CREATE_CONDITION = 'Create';
const TITLE_CONDITIONS = 'Conditions';
const BTN_CREATE_ACTION = 'Create';
const TITLE_ACTIONS = 'Actions';
const BTN_SAVE = 'Submit';
const BTN_CANCEL = 'Cancel';
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
    constructor(...args) {
        super(...args);

        if (!this.props?.data) {
            throw new Error('Invalid props');
        }

        this.fieldTypes = ImportCondition.getFieldTypes();
        this.actionTypes = ImportAction.getTypes();
        this.transactionTypes = ImportAction.getTransactionTypes();

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        this.state = {
            rule: this.props.data,
            conditionListId: Date.now(),
            actionListId: Date.now(),
        };

        this.init();
        this.render(this.state);
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
        const toggleCondIcon = Icon.create({
            icon: 'toggle-ext',
            className: 'icon toggle-icon',
        });
        this.toggleCondBtn = createElement('button', {
            props: { className: 'btn icon-btn toggle-btn right-align', type: 'button' },
            children: toggleCondIcon.elem,
        });

        this.conditionsList = ListContainer.create({
            ItemComponent: ImportConditionForm,
            className: 'conditions-list',
            itemSelector: '.cond-form',
            noItemsMessage: MSG_NO_CONDITIONS,
            invalidItemIndex: -1,
            message: null,
            isListChanged: (state, prevState) => (
                state.items !== prevState.items
            ),
            getItemProps: (condition, state) => this.getConditionProps(condition, state),
        });

        this.conditionsCollapse = Collapsible.create({
            className: 'rule-form-collapse',
            header: [
                createElement('label', { props: { textContent: TITLE_CONDITIONS } }),
                this.createCondBtn,
                this.toggleCondBtn,
            ],
            content: this.conditionsList.elem,
            onStateChange: (expanded) => this.onToggleConditions(expanded),
        });

        // Actions
        this.createActionBtn = createElement('button', {
            props: { className: 'btn link-btn create-btn', type: 'button', textContent: BTN_CREATE_ACTION },
            events: { click: (e) => this.onCreateActionClick(e) },
        });
        const toggleActIcon = Icon.create({
            icon: 'toggle-ext',
            className: 'icon toggle-icon',
        });
        this.toggleActionsBtn = createElement('button', {
            props: { className: 'btn icon-btn toggle-btn right-align', type: 'button' },
            children: toggleActIcon.elem,
        });

        this.actionsList = ListContainer.create({
            ItemComponent: ImportActionForm,
            className: 'actions-list',
            itemSelector: '.action-form',
            noItemsMessage: MSG_NO_ACTIONS,
            invalidItemIndex: -1,
            message: null,
            isListChanged: (state, prevState) => (
                state.items !== prevState.items
            ),
            getItemProps: (action, state) => this.getActionProps(action, state),
        });

        this.actionsCollapse = new Collapsible({
            className: 'rule-form-collapse',
            header: [
                createElement('label', { props: { textContent: TITLE_ACTIONS } }),
                this.createActionBtn,
                this.toggleActionsBtn,
            ],
            content: this.actionsList.elem,
            onStateChange: (expanded) => this.onToggleActions(expanded),
        });

        // Controls
        this.saveBtn = createElement('button', {
            props: { className: 'btn submit-btn', type: 'button', textContent: BTN_SAVE },
            events: { click: () => this.onSubmit() },
        });
        this.cancelBtn = createElement('button', {
            props: { className: 'btn cancel-btn', type: 'button', textContent: BTN_CANCEL },
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

    getConditionProps(condition, state) {
        const index = state.items.indexOf(condition);
        if (index === -1) {
            throw new Error('Item not found');
        }
        const isInvalidItem = state.invalidItemIndex === index;
        const props = {
            data: condition,
            key: condition.id,

            conditionId: condition.id,
            parent: condition.parent_id,
            fieldType: condition.field_id,
            availOperators: condition.getAvailOperators(),
            operator: condition.operator,
            isFieldValue: condition.isPropertyValue(),
            value: condition.value,

            isValid: !isInvalidItem,
            message: (isInvalidItem) ? state.message : null,

            onUpdate: (id, data) => this.onConditionUpdate(id, data),
            onRemove: (id) => this.onConditionDelete(id),
        };

        let propFilter = this.fieldTypes.map(({ id }) => id);
        // Remove properties which already have `is` operator
        propFilter = propFilter.filter((property) => {
            const found = state.items.findIsCondition(property);
            const foundInd = state.items.indexOf(found);
            return (!found || foundInd === index);
        });

        props.properties = propFilter;

        return props;
    }

    getActionProps(action, state) {
        const index = state.items.indexOf(action);
        if (index === -1) {
            throw new Error('Item not found');
        }
        const isInvalidItem = state.invalidItemIndex === index;
        const props = {
            data: action,
            key: action.id,

            actionId: action.id,
            actionType: action.action_id,
            value: action.value,

            isValid: !isInvalidItem,
            message: (isInvalidItem) ? state.message : null,

            onUpdate: (id, data) => this.onActionUpdate(id, data),
            onRemove: (id) => this.onActionDelete(id),
        };

        let actionsFilter = this.actionTypes.map(({ id }) => id);
        // Remove already added actions
        actionsFilter = actionsFilter.filter((type) => {
            const found = state.items.findAction(type);
            return (!found || found === action);
        });
        // Show `Set account` action if has `Set transaction type` action with
        // transfer type selected
        const setAccountAction = state.items.findAction(IMPORT_ACTION_SET_ACCOUNT);
        const showSetAccount = (
            state.items.hasSetTransfer()
            && (!setAccountAction || setAccountAction === action)
        );
        if (!showSetAccount) {
            actionsFilter = actionsFilter.filter((type) => type !== IMPORT_ACTION_SET_ACCOUNT);
        }
        // Show `Set person` action if person available and has `Set transaction type` action
        // with debt type selected
        const setPersonAction = state.items.findAction(IMPORT_ACTION_SET_PERSON);
        const showSetPerson = (
            window.app.model.persons.length > 0
            && state.items.hasSetDebt()
            && (!setPersonAction || setPersonAction === action)
        );
        if (!showSetPerson) {
            actionsFilter = actionsFilter.filter((type) => type !== IMPORT_ACTION_SET_PERSON);
        }

        props.actions = actionsFilter;

        return props;
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

        let { actionListId } = this.state;
        actionListId += 1;

        const actionData = {
            id: actionListId.toString(),
            action_id: actionType.id,
            value: this.getActionDefaultValue(actionType.id),
        };

        const rule = new ImportRule(this.state.rule);
        rule.actions.addItem(actionData);

        this.conditionsCollapse.collapse();
        this.actionsCollapse.expand();

        this.setState({
            ...this.state,
            validation: null,
            actionListId,
            rule,
        });
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

        let { conditionListId } = this.state;
        conditionListId += 1;

        const conditionData = {
            id: conditionListId.toString(),
            field_id: fieldType.id,
            operator,
            value: this.getConditionDefaultValue(fieldType.id),
            flags: 0,
        };

        const rule = new ImportRule(this.state.rule);
        rule.conditions.addItem(conditionData);

        this.conditionsCollapse.expand();
        this.actionsCollapse.collapse();

        this.setState({
            ...this.state,
            validation: null,
            conditionListId,
            rule,
        });
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
            conditions: copyObject(state.rule.conditions.data),
            actions: copyObject(state.rule.actions.data),
        };
        if (state.rule.id) {
            res.id = state.rule.id;
        }

        return res;
    }

    /** Validate import rule from state object */
    validateRule() {
        const validation = this.state.rule.validate();

        if (validation && !validation.valid) {
            if ('conditionIndex' in validation) {
                this.conditionsCollapse.expand();
                this.actionsCollapse.collapse();
            } else if ('actionIndex' in validation) {
                this.conditionsCollapse.collapse();
                this.actionsCollapse.expand();
            }
        }

        this.setState({ ...this.state, validation });
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
    onConditionUpdate(id, data) {
        const rule = new ImportRule(this.state.rule);
        const index = rule.conditions.findIndex((item) => item.id === id);
        rule.conditions.updateItemByIndex(index, data);

        this.setState({ ...this.state, rule });
    }

    /** Condition 'delete' event handler */
    onConditionDelete(id) {
        const rule = new ImportRule(this.state.rule);
        const index = rule.conditions.findIndex((item) => item.id === id);
        rule.conditions.deleteItemByIndex(index);

        this.setState({
            ...this.state,
            rule,
            validation: null,
        });
    }

    /** Remove `Set account` and `Set person` actions */
    removeTransactionDependActions(state) {
        const actionsToRemove = [IMPORT_ACTION_SET_ACCOUNT, IMPORT_ACTION_SET_PERSON];
        const newActions = state.rule.actions.filter((action) => (
            !actionsToRemove.includes(action.action_id)
        ));

        const rule = new ImportRule(state.rule);
        rule.actions = ImportActionList.create(newActions);

        const newState = {
            ...state,
            rule,
        };

        return newState;
    }

    /** Action 'update' event handler */
    onActionUpdate(id, data) {
        const { actions } = this.state.rule;

        const index = actions.findIndex((item) => item.id === id);
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

        const rule = new ImportRule(this.state.rule);
        rule.actions = ImportActionList.create(newActions);

        this.setState({
            ...this.state,
            rule,
        });
    }

    /** Action 'delete' event handler */
    onActionDelete(id) {
        const rule = new ImportRule(this.state.rule);
        const index = rule.actions.findIndex((item) => item.id === id);
        const removedAction = rule.actions.getItemByIndex(index);
        rule.actions.deleteItemByIndex(index);

        let newState = {
            ...this.state,
            rule,
            validation: null,
        };
        if (removedAction.action_id === IMPORT_ACTION_SET_TR_TYPE) {
            newState = this.removeTransactionDependActions(newState);
        }

        this.setState(newState);
    }

    validateConditionsAvail(state) {
        const isAvail = this.getNextAvailProperty(state);

        enable(this.createCondBtn, !!isAvail);
    }

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

        // Conditions list
        const isInvalidCondition = (
            state.validation
            && !state.validation.valid
            && state.validation.conditionIndex !== -1
        );
        this.conditionsList.setState((conditionsState) => ({
            ...conditionsState,
            items: state.rule.conditions,
            invalidItemIndex: (isInvalidCondition) ? state.validation.conditionIndex : -1,
            message: (isInvalidCondition) ? state.validation.message : null,
            renderTime: Date.now(),
        }));
        // Actions list
        const isInvalidAction = (
            state.validation
            && !state.validation.valid
            && state.validation.actionIndex !== -1
        );
        this.actionsList.setState((actionsState) => ({
            ...actionsState,
            items: state.rule.actions,
            invalidItemIndex: (isInvalidAction) ? state.validation.actionIndex : -1,
            message: (isInvalidAction) ? state.validation.message : null,
            renderTime: Date.now(),
        }));
    }
}
