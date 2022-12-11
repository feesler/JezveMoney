import {
    createElement,
    show,
    isFunction,
    asArray,
    Component,
} from 'jezvejs';
import { DropDown } from 'jezvejs/DropDown';
import { DecimalInput } from 'jezvejs/DecimalInput';
import { Icon } from 'jezvejs/Icon';
import {
    ImportAction,
    IMPORT_ACTION_SET_TR_TYPE,
    IMPORT_ACTION_SET_ACCOUNT,
    IMPORT_ACTION_SET_PERSON,
    IMPORT_ACTION_SET_CATEGORY,
} from '../../../../js/model/ImportAction.js';
import { CategorySelect } from '../../../CategorySelect/CategorySelect.js';
import './style.scss';

/** CSS classes */
const FORM_CLASS = 'action-form';
const CONTAINER_CLASS = 'action-form__container';
/* Fields */
const FIELDS_CLASS = 'action-form__fields';
const ACTION_FIELD_CLASS = 'action-type-field';
const AMOUNT_FIELD_CLASS = 'amount-field';
const TRANS_TYPE_FIELD_CLASS = 'trans-type-field';
const ACCOUNT_FIELD_CLASS = 'account-field';
const PERSON_FIELD_CLASS = 'person-field';
const CATEGORY_FIELD_CLASS = 'category-field';
const VALUE_FIELD_CLASS = 'action-value-field';
/* Validation */
const VALIDATION_BLOCK_CLASS = 'validation-block';
const INV_FEEDBACK_CLASS = 'invalid-feedback';
/* Controls */
const CONTROLS_CLASS = 'action-form__controls';

const defaultProps = {
    actions: null,
    onUpdate: null,
    onRemove: null,
};

/**
 * ImportActionForm component
 */
export class ImportActionForm extends Component {
    constructor(props) {
        super(props);

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        if (!this.props?.data) {
            throw new Error('Invalid props');
        }

        const { data } = this.props;
        this.state = {
            actionId: data.id,
            actionType: data.action_id,
            value: data.value,
            isValid: this.props.isValid,
            message: this.props.message,
            actions: this.props.actions,
        };

        this.init();
        this.render(this.state);
        // Check value changed
        const value = this.getActionValue(this.state);
        if (data.value.toString() !== value.toString()) {
            this.state.value = value;
            this.sendUpdate();
        }
    }

    get id() {
        return this.state.actionId;
    }

    /** Form controls initialization */
    init() {
        this.createActionTypeField();
        this.createTransTypeField();
        this.createAccountField();
        this.createPersonField();
        this.createCategoryField();

        // Create amount input element
        this.amountInput = createElement('input', {
            props: { className: `stretch-input ${AMOUNT_FIELD_CLASS}`, type: 'text' },
        });
        this.decAmountInput = DecimalInput.create({
            elem: this.amountInput,
            digits: 2,
            oninput: () => this.onValueChange(),
        });
        // Create value input element
        this.valueInput = createElement('input', {
            props: { className: `stretch-input ${VALUE_FIELD_CLASS}`, type: 'text' },
            events: { input: () => this.onValueChange() },
        });
        // Form fields container
        this.fieldsContainer = window.app.createContainer(FIELDS_CLASS, [
            this.actionDropDown.elem,
            this.trTypeDropDown.elem,
            this.accountDropDown.elem,
            this.personDropDown.elem,
            this.categorySelect.elem,
            this.amountInput,
            this.valueInput,
        ]);

        // Invalid feedback message
        this.validFeedback = createElement('div', { props: { className: INV_FEEDBACK_CLASS } });
        this.container = window.app.createContainer(`${CONTAINER_CLASS} ${VALIDATION_BLOCK_CLASS}`, [
            this.fieldsContainer,
            this.validFeedback,
        ]);

        // Delete button
        const delIcon = Icon.create({
            icon: 'del',
            className: 'icon delete-icon',
        });
        this.delBtn = createElement('button', {
            props: { className: 'btn icon-btn delete-btn right-align', type: 'button' },
            children: delIcon.elem,
            events: { click: () => this.onDelete() },
        });

        this.controls = window.app.createContainer(CONTROLS_CLASS, [
            this.delBtn,
        ]);

        this.elem = window.app.createContainer(FORM_CLASS, [
            this.container,
            this.controls,
        ]);
    }

    getActionTypes(state) {
        const actionTypes = ImportAction.getTypes();
        if (!state.actions) {
            return actionTypes;
        }

        const typesFilter = asArray(state.actions);
        if (!typesFilter.length) {
            return actionTypes;
        }

        return actionTypes.filter((type) => typesFilter.includes(type.id));
    }

    /** Create action type field */
    createActionTypeField() {
        this.actionDropDown = DropDown.create({
            className: ACTION_FIELD_CLASS,
            onchange: (action) => this.onActionTypeChange(action),
        });
    }

    /** Render action type field */
    renderActionTypeField(state) {
        const actionTypes = this.getActionTypes(state);
        const items = actionTypes.map(({ id, title }) => ({ id, title }));

        this.actionDropDown.removeAll();
        this.actionDropDown.append(items);
    }

    /** Create transaction type field */
    createTransTypeField() {
        const transactionTypes = ImportAction.getTransactionTypes();
        const items = transactionTypes.map(({ id, title }) => ({ id, title }));

        this.trTypeDropDown = DropDown.create({
            className: TRANS_TYPE_FIELD_CLASS,
            onchange: () => this.onValueChange(),
        });
        this.trTypeDropDown.append(items);
        this.trTypeDropDown.selectItem(items[0].id);
    }

    /** Create account field */
    createAccountField() {
        this.accountDropDown = DropDown.create({
            className: ACCOUNT_FIELD_CLASS,
            onchange: () => this.onValueChange(),
        });
        window.app.initAccountsList(this.accountDropDown);
    }

    /** Create person field */
    createPersonField() {
        this.personDropDown = DropDown.create({
            className: PERSON_FIELD_CLASS,
            onchange: () => this.onValueChange(),
        });
        window.app.initPersonsList(this.personDropDown);
    }

    /** Create category field */
    createCategoryField() {
        this.categorySelect = CategorySelect.create({
            className: CATEGORY_FIELD_CLASS,
            onchange: () => this.onValueChange(),
        });
    }

    /** Action type select 'change' event handler */
    onActionTypeChange(action) {
        const actionType = parseInt(action?.id, 10);
        if (this.state.actionType === actionType) {
            return;
        }

        const newState = {
            ...this.state,
            actionType,
            isValid: true,
        };
        newState.value = this.getActionValue(newState);

        this.setState(newState);
        this.sendUpdate();
    }

    /** Return action value */
    getActionValue(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (state.actionType === IMPORT_ACTION_SET_TR_TYPE) {
            const selection = this.trTypeDropDown.getSelectionData();
            return selection.id;
        }
        if (state.actionType === IMPORT_ACTION_SET_ACCOUNT) {
            const selection = this.accountDropDown.getSelectionData();
            return parseInt(selection.id, 10);
        }
        if (state.actionType === IMPORT_ACTION_SET_PERSON) {
            const selection = this.personDropDown.getSelectionData();
            return parseInt(selection.id, 10);
        }
        if (state.actionType === IMPORT_ACTION_SET_CATEGORY) {
            const selection = this.categorySelect.getSelectionData();
            return parseInt(selection.id, 10);
        }
        if (ImportAction.isAmountValue(state.actionType)) {
            return this.decAmountInput.value;
        }

        return this.valueInput.value;
    }

    /** Set action value */
    setActionValue(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (state.actionType === IMPORT_ACTION_SET_TR_TYPE) {
            this.trTypeDropDown.selectItem(state.value);
        } else if (state.actionType === IMPORT_ACTION_SET_ACCOUNT) {
            this.accountDropDown.selectItem(parseInt(state.value, 10));
        } else if (state.actionType === IMPORT_ACTION_SET_PERSON) {
            this.personDropDown.selectItem(parseInt(state.value, 10));
        } else if (state.actionType === IMPORT_ACTION_SET_CATEGORY) {
            this.categorySelect.selectItem(parseInt(state.value, 10));
        } else if (ImportAction.isAmountValue(state.actionType)) {
            this.decAmountInput.value = state.value;
        } else {
            this.valueInput.value = state.value;
        }
    }

    /** Value select 'change' event handler */
    onValueChange() {
        const value = this.getActionValue(this.state);
        if (this.state.value === value) {
            return;
        }

        this.setState({
            ...this.state,
            value,
            isValid: true,
        });

        this.sendUpdate();
    }

    /** Send component 'update' event */
    sendUpdate() {
        if (isFunction(this.props.onUpdate)) {
            this.props.onUpdate(this.id, this.getData(this.state));
        }
    }

    /** Delete button 'click' event handler */
    onDelete() {
        if (isFunction(this.props.onRemove)) {
            this.props.onRemove(this.id);
        }
    }

    /** Return import action object */
    getData(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        const res = {
            action_id: state.actionType,
            value: state.value,
        };

        if (state.actionId) {
            res.id = state.actionId;
        }

        return res;
    }

    /** Render component state */
    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        window.app.setValidation(this.container, state.isValid);
        this.validFeedback.textContent = (state.isValid) ? '' : state.message;

        const isSelectTarget = ImportAction.isSelectValue(state.actionType);
        const isAmountTarget = ImportAction.isAmountValue(state.actionType);

        this.renderActionTypeField(state);
        this.actionDropDown.selectItem(state.actionType);

        this.trTypeDropDown.show(state.actionType === IMPORT_ACTION_SET_TR_TYPE);
        this.accountDropDown.show(state.actionType === IMPORT_ACTION_SET_ACCOUNT);
        this.personDropDown.show(state.actionType === IMPORT_ACTION_SET_PERSON);
        this.categorySelect.show(state.actionType === IMPORT_ACTION_SET_CATEGORY);
        show(this.amountInput, isAmountTarget);
        show(this.valueInput, !isSelectTarget && !isAmountTarget);

        this.setActionValue(state);
    }
}
