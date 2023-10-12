import {
    createElement,
    isFunction,
    Component,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { Collapsible } from 'jezvejs/Collapsible';
import { ListContainer } from 'jezvejs/ListContainer';

import { listData, __, dateStringToTime } from '../../../../../utils/utils.js';
import { App } from '../../../../../Application/App.js';

import { ImportRule } from '../../../../../Models/ImportRule.js';
import {
    IMPORT_ACTION_SET_ACCOUNT,
    IMPORT_ACTION_SET_PERSON,
    IMPORT_ACTION_SET_TR_TYPE,
    ImportAction,
} from '../../../../../Models/ImportAction.js';
import { ImportCondition } from '../../../../../Models/ImportCondition.js';
import { ImportConditionList } from '../../../../../Models/ImportConditionList.js';
import { ImportActionList } from '../../../../../Models/ImportActionList.js';

import { ToggleButton } from '../../../../../Components/Common/ToggleButton/ToggleButton.js';
import { FormControls } from '../../../../../Components/Form/FormControls/FormControls.js';
import { NoDataMessage } from '../../../../../Components/Common/NoDataMessage/NoDataMessage.js';
import { ImportConditionForm } from '../ConditionForm/ImportConditionForm.js';
import { ImportActionForm } from '../ActionForm/ImportActionForm.js';

import './ImportRuleForm.scss';

/* CSS classes */
const FORM_CLASS = 'rule-form';
const COLLAPSE_CLASS = 'rule-form-collapse';
const CREATE_BUTTON_CLASS = 'create-btn right-align';
const CONDITIONS_LIST_CLASS = 'conditions-list';
const ACTIONS_LIST_CLASS = 'actions-list';
/* Validation */
const FEEDBACK_CONTAINER_CLASS = 'rule-form__feedback validation-block';
const INV_FEEDBACK_CLASS = 'feedback invalid-feedback';

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
        this.createCondBtn = Button.create({
            id: 'createCondBtn',
            className: CREATE_BUTTON_CLASS,
            icon: 'plus',
            onClick: (e) => this.onCreateConditionClick(e),
        });

        this.toggleCondBtn = ToggleButton.create();

        this.conditionsList = ListContainer.create({
            ItemComponent: ImportConditionForm,
            className: CONDITIONS_LIST_CLASS,
            itemSelector: ImportConditionForm.selector,
            PlaceholderComponent: NoDataMessage,
            getPlaceholderProps: () => ({ title: __('import.conditions.noData') }),
            invalidItemIndex: -1,
            message: null,
            isListChanged: (state, prevState) => (
                state.items !== prevState.items
                || state.invalidItemIndex !== prevState.invalidItemIndex
                || state.message !== prevState.message
            ),
            getItemProps: (condition, state) => this.getConditionProps(condition, state),
        });

        this.conditionsCollapse = Collapsible.create({
            className: COLLAPSE_CLASS,
            animated: true,
            header: [
                createElement('label', { props: { textContent: __('import.conditions.title') } }),
                this.createCondBtn.elem,
                this.toggleCondBtn.elem,
            ],
            content: this.conditionsList.elem,
            onStateChange: (expanded) => this.onToggleConditions(expanded),
        });

        // Actions
        this.createActionBtn = Button.create({
            id: 'createActionBtn',
            className: CREATE_BUTTON_CLASS,
            icon: 'plus',
            onClick: (e) => this.onCreateActionClick(e),
        });

        this.toggleActionsBtn = ToggleButton.create();

        this.actionsList = ListContainer.create({
            ItemComponent: ImportActionForm,
            className: ACTIONS_LIST_CLASS,
            itemSelector: ImportActionForm.selector,
            PlaceholderComponent: NoDataMessage,
            getPlaceholderProps: () => ({ title: __('import.actions.noData') }),
            invalidItemIndex: -1,
            message: null,
            isListChanged: (state, prevState) => (
                state.items !== prevState.items
                || state.invalidItemIndex !== prevState.invalidItemIndex
                || state.message !== prevState.message
            ),
            getItemProps: (action, state) => this.getActionProps(action, state),
        });

        this.actionsCollapse = Collapsible.create({
            className: COLLAPSE_CLASS,
            animated: true,
            header: [
                createElement('label', { props: { textContent: __('import.actions.title') } }),
                this.createActionBtn.elem,
                this.toggleActionsBtn.elem,
            ],
            content: this.actionsList.elem,
            onStateChange: (expanded) => this.onToggleActions(expanded),
        });

        // Invalid feedback message
        this.validFeedback = createElement('div', { props: { className: INV_FEEDBACK_CLASS } });
        this.feedbackContainer = App.createContainer(
            FEEDBACK_CONTAINER_CLASS,
            this.validFeedback,
        );

        // Submit controls
        this.controls = FormControls.create({
            submitBtn: {
                type: 'button',
                title: __('actions.submit'),
                onClick: () => this.onSubmit(),
            },
            cancelBtn: {
                type: 'button',
                title: __('actions.cancel'),
                onClick: () => this.onCancel(),
            },
        });

        this.elem = App.createContainer(FORM_CLASS, [
            this.idInput,
            this.conditionsCollapse.elem,
            this.actionsCollapse.elem,
            this.feedbackContainer,
            this.controls.elem,
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
            const found = ImportConditionList.findIsCondition(state.items, property);
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
            const found = ImportActionList.findAction(state.items, type);
            return (!found || found === action);
        });
        // Show `Set account` action if has `Set transaction type` action with
        // transfer type selected
        const setAccountAction = ImportActionList.findAction(
            state.items,
            IMPORT_ACTION_SET_ACCOUNT,
        );
        const showSetAccount = (
            ImportActionList.hasSetTransfer(state.items)
            && (action.action_id !== IMPORT_ACTION_SET_TR_TYPE)
            && (!setAccountAction || setAccountAction === action)
        );
        if (!showSetAccount) {
            actionsFilter = actionsFilter.filter((type) => type !== IMPORT_ACTION_SET_ACCOUNT);
        }
        // Show `Set person` action if person available and has `Set transaction type` action
        // with debt type selected
        const setPersonAction = ImportActionList.findAction(state.items, IMPORT_ACTION_SET_PERSON);
        const showSetPerson = (
            App.model.persons.length > 0
            && ImportActionList.hasSetDebt(state.items)
            && (action.action_id !== IMPORT_ACTION_SET_TR_TYPE)
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
                    App.model.persons.length > 0
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
            const item = App.model.accounts.getItemByIndex(0);
            if (!item) {
                throw new Error('No accounts available');
            }

            return item.id;
        }

        if (ImportAction.isPersonValue(actionType)) {
            const item = App.model.persons.getItemByIndex(0);
            if (!item) {
                throw new Error('No persons available');
            }

            return item.id;
        }

        if (ImportAction.isCategoryValue(actionType)) {
            return 0;
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
                return App.model.templates.length > 0;
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
            const item = App.model.accounts.getItemByIndex(0);
            if (!item) {
                throw new Error('No accounts available');
            }

            return item.id;
        }

        if (ImportCondition.isTemplateField(fieldType)) {
            const item = App.model.templates.getItemByIndex(0);
            if (!item) {
                throw new Error('No template available');
            }

            return item.id;
        }

        if (ImportCondition.isCurrencyField(fieldType)) {
            const item = App.model.currency.getItemByIndex(0);
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
            conditions: state.rule.conditions.map((item) => {
                const condition = {
                    ...item,
                };

                if (ImportCondition.isDateField(item.field_id)) {
                    condition.value = dateStringToTime(item.value);
                }

                return condition;
            }),
            actions: structuredClone(state.rule.actions.data),
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

        const newState = {
            ...this.state,
            rule,
        };
        if (this.state.validation?.conditionIndex === index) {
            newState.validation = null;
        }

        this.setState(newState);
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
        actions.updateItemByIndex(index, data);

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

        const newState = {
            ...this.state,
            rule,
        };
        if (this.state.validation?.actionIndex === index) {
            newState.validation = null;
        }

        this.setState(newState);
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
        this.createCondBtn.enable(!!isAvail);
    }

    validateActionsAvail(state) {
        const isAvail = this.getNextAvailAction(state);
        this.createActionBtn.enable(!!isAvail);
    }

    /** Render component state */
    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.idInput.value = (state.rule.id) ? state.rule.id : '';

        this.validateConditionsAvail(state);
        this.validateActionsAvail(state);

        const isInvalid = (
            state.validation
            && !state.validation.valid
            && !('conditionIndex' in state.validation)
            && !('actionIndex' in state.validation)
        );

        App.setValidation(this.feedbackContainer, !isInvalid);
        this.validFeedback.textContent = (isInvalid) ? state.validation.message : '';

        // Conditions list
        const isInvalidCondition = (
            !!state.validation
            && !state.validation.valid
            && state.validation.conditionIndex !== -1
        );
        this.conditionsList.setState((conditionsState) => ({
            ...conditionsState,
            items: listData(state.rule.conditions),
            invalidItemIndex: (isInvalidCondition) ? state.validation.conditionIndex : -1,
            message: (isInvalidCondition) ? state.validation.message : null,
            renderTime: Date.now(),
        }));
        // Actions list
        const isInvalidAction = (
            !!state.validation
            && !state.validation.valid
            && state.validation.actionIndex !== -1
        );
        this.actionsList.setState((actionsState) => ({
            ...actionsState,
            items: listData(state.rule.actions),
            invalidItemIndex: (isInvalidAction) ? state.validation.actionIndex : -1,
            message: (isInvalidAction) ? state.validation.message : null,
            renderTime: Date.now(),
        }));
    }
}
