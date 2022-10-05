import {
    createElement,
    show,
    isFunction,
    asArray,
    Component,
    DropDown,
    DecimalInput,
} from 'jezvejs';
import {
    ImportAction,
    IMPORT_ACTION_SET_TR_TYPE,
    IMPORT_ACTION_SET_ACCOUNT,
    IMPORT_ACTION_SET_PERSON,
} from '../../../../js/model/ImportAction.js';
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
    static create(props) {
        return new ImportActionForm(props);
    }

    constructor(...args) {
        super(...args);

        if (!this.props || !this.props.data) {
            throw new Error('Invalid props');
        }
        if (!(this.props.data instanceof ImportAction)) {
            throw new Error('Invalid action item');
        }

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        this.props.data.isValid = this.props.isValid;
        this.props.data.message = this.props.message;

        this.init();
        this.setData(this.props.data);
    }

    /** Form controls initialization */
    init() {
        this.createActionTypeField();
        this.createTransTypeField();
        this.createAccountField();
        this.createPersonField();

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
        this.delBtn = createElement('button', {
            props: { className: 'btn icon-btn delete-btn right-align', type: 'button' },
            children: window.app.createIcon('del', 'icon delete-icon'),
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

    getActionTypes() {
        const actionTypes = ImportAction.getTypes();
        if (!this.props.actions) {
            return actionTypes;
        }

        const typesFilter = asArray(this.props.actions);
        if (!typesFilter.length) {
            return actionTypes;
        }

        return actionTypes.filter((type) => typesFilter.includes(type.id));
    }

    /** Create action type field */
    createActionTypeField() {
        const actionTypes = this.getActionTypes();
        // const items = actionTypes.map((type) => ({ id: type.id, title: type.title }));
        const items = actionTypes.map(({ id, title }) => ({ id, title }));

        this.actionDropDown = DropDown.create({
            className: ACTION_FIELD_CLASS,
            onchange: (action) => this.onActionTypeChange(action),
        });
        this.actionDropDown.append(items);
    }

    /** Create transaction type field */
    createTransTypeField() {
        const transactionTypes = ImportAction.getTransactionTypes();
        // const items = transactionTypes.map((type) => ({ id: type.id, title: type.title }));
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

    /** Set data for component */
    setData(data) {
        if (!data) {
            throw new Error('Invalid data');
        }

        this.state = {
            actionId: data.id,
            actionType: data.action_id,
            value: data.value,
            isValid: data.isValid,
            message: data.message,
        };

        this.render(this.state);
        // Check value changed
        const value = this.getActionValue(this.state);
        if (data.value !== value) {
            this.state.value = value;
            this.sendUpdate();
        }
    }

    /** Action type select 'change' event handler */
    onActionTypeChange(action) {
        if (!action) {
            return;
        }

        const actionId = parseInt(action.id, 10);
        this.state.actionType = actionId;
        this.state.value = this.getActionValue(this.state);
        this.state.isValid = true;
        this.render(this.state);
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
            return selection.id;
        }
        if (state.actionType === IMPORT_ACTION_SET_PERSON) {
            const selection = this.personDropDown.getSelectionData();
            return selection.id;
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

        this.state.value = value;
        this.state.isValid = true;
        this.render(this.state);
        this.sendUpdate();
    }

    /** Send component 'update' event */
    sendUpdate() {
        if (isFunction(this.props.onUpdate)) {
            this.props.onUpdate(this.getData(this.state));
        }
    }

    /** Delete button 'click' event handler */
    onDelete() {
        if (isFunction(this.props.onRemove)) {
            this.props.onRemove();
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

        if (state.isValid) {
            this.validFeedback.textContent = '';
            window.app.clearBlockValidation(this.container);
        } else {
            this.validFeedback.textContent = state.message;
            window.app.invalidateBlock(this.container);
        }

        const isSelectTarget = ImportAction.isSelectValue(state.actionType);
        const isAmountTarget = ImportAction.isAmountValue(state.actionType);
        this.actionDropDown.selectItem(state.actionType);

        this.trTypeDropDown.show(state.actionType === IMPORT_ACTION_SET_TR_TYPE);
        this.accountDropDown.show(state.actionType === IMPORT_ACTION_SET_ACCOUNT);
        this.personDropDown.show(state.actionType === IMPORT_ACTION_SET_PERSON);
        show(this.amountInput, isAmountTarget);
        show(this.valueInput, !isSelectTarget && !isAmountTarget);

        this.setActionValue(state);
    }
}
