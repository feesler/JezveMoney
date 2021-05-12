import { ce, show, isFunction } from '../../js/lib/common.js';
import { AppComponent } from '../AppComponent/AppComponent.js';
import { DropDown } from '../../js/lib/DropDown.js';
import { DecimalInput } from '../../js/lib/DecimalInput.js';
import {
    ImportAction,
    IMPORT_ACTION_SET_TR_TYPE,
    IMPORT_ACTION_SET_ACCOUNT,
    IMPORT_ACTION_SET_PERSON,
} from '../../js/model/ImportAction.js';
import { View } from '../../js/View.js';

/**
 * ImportActionForm component
 */
export class ImportActionForm extends AppComponent {
    constructor(...args) {
        super(...args);

        if (
            !this.parent
            || !this.props
            || !this.props.data
            || !this.props.currencyModel
            || !this.props.accountModel
            || !this.props.personModel
        ) {
            throw new Error('Invalid props');
        }

        this.parentView = (this.parent instanceof View)
            ? this.parent
            : this.parent.parentView;

        this.updateHandler = this.props.update;
        this.deleteHandler = this.props.remove;

        this.model = {
            currency: this.props.currencyModel,
            accounts: this.props.accountModel,
            persons: this.props.personModel,
        };

        if (!(this.props.data instanceof ImportAction)) {
            throw new Error('Invalid action item');
        }
        this.props.data.isValid = this.props.isValid;
        this.props.data.message = this.props.message;

        this.actionTypes = ImportAction.getTypes();
        this.transactionTypes = ImportAction.getTransactionTypes();

        this.init();
        this.setData(this.props.data);
    }

    /** Shortcut for ImportActionForm constructor */
    static create(props) {
        return new ImportActionForm(props);
    }

    /** Form controls initialization */
    init() {
        this.createActionTypeField();
        this.createTransTypeField();
        this.createAccountField();
        this.createPersonField();

        // Create amount input element
        this.amountInput = ce('input', { type: 'text' });
        this.decAmountInput = DecimalInput.create({
            elem: this.amountInput,
            oninput: this.onValueChange.bind(this)
        });
        this.amountField = this.createField('Amount', this.amountInput);
        // Create value input element
        this.valueInput = ce(
            'input',
            { type: 'text' },
            null,
            { input: this.onValueChange.bind(this) },
        );
        this.valueField = this.createField('Value', this.valueInput);
        // Form fields container
        this.fieldsContainer = this.createContainer('action-form__fields', [
            this.actionTypeField,
            this.transTypeField,
            this.accountField,
            this.personField,
            this.amountField,
            this.valueField,
        ]);
        // Invalid feedback message
        this.validFeedback = ce('div', { className: 'invalid-feedback' });
        this.container = this.createContainer('action-form__container validation-block', [
            this.fieldsContainer,
            this.validFeedback,
        ]);

        // Delete button
        this.delBtn = ce(
            'button',
            { className: 'btn icon-btn delete-btn right-align', type: 'button' },
            this.createIcon('del'),
            { click: this.onDelete.bind(this) },
        );

        this.controls = this.createContainer('action-form__controls', [
            this.delBtn
        ]);

        this.elem = this.createContainer('action-form', [
            this.container,
            this.controls,
        ]);
    }

    /** Create action type field */
    createActionTypeField() {
        const items = this.actionTypes.map((type) => ({ id: type.id, title: type.title }));

        const selectElem = ce('select');
        this.actionTypeField = this.createField('Action', selectElem);

        this.actionDropDown = DropDown.create({
            input_id: selectElem,
            onchange: this.onActionTypeChange.bind(this),
            editable: false,
        });
        this.actionDropDown.append(items);
    }

    /** Create transaction type field */
    createTransTypeField() {
        const items = this.transactionTypes.map((type) => ({ id: type.id, title: type.title }));

        const selectElem = ce('select');
        this.transTypeField = this.createField('Transaction type', selectElem);

        this.trTypeDropDown = DropDown.create({
            input_id: selectElem,
            onchange: this.onValueChange.bind(this),
            editable: false,
        });
        this.trTypeDropDown.append(items);
        this.trTypeDropDown.selectItem(items[0].id);
    }

    /** Create account field */
    createAccountField() {
        const items = this.model.accounts.map((account) => ({ id: account.id, title: account.name }));

        const selectElem = ce('select');
        this.accountField = this.createField('Account', selectElem);

        this.accountDropDown = DropDown.create({
            input_id: selectElem,
            onchange: this.onValueChange.bind(this),
            editable: false,
        });
        this.accountDropDown.append(items);
        this.accountDropDown.selectItem(items[0].id);
    }

    /** Create person field */
    createPersonField() {
        const items = this.model.persons.map((person) => ({ id: person.id, title: person.name }));

        const selectElem = ce('select');
        this.personField = this.createField('Person', selectElem);

        this.personDropDown = DropDown.create({
            input_id: selectElem,
            onchange: this.onValueChange.bind(this),
            editable: false,
        });
        this.personDropDown.append(items);
        this.personDropDown.selectItem(items[0].id);
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

        this.state.actionType = action.id;
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
        if (isFunction(this.updateHandler)) {
            this.updateHandler(this.getData(this.state));
        }
    }

    /** Delete button 'click' event handler */
    onDelete() {
        if (isFunction(this.deleteHandler)) {
            this.deleteHandler();
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
            this.parentView.clearBlockValidation(this.container);
        } else {
            this.validFeedback.textContent = state.message;
            this.parentView.invalidateBlock(this.container);
        }

        const isSelectTarget = ImportAction.isSelectValue(state.actionType);
        const isAmountTarget = ImportAction.isAmountValue(state.actionType);
        this.actionDropDown.selectItem(state.actionType);

        show(this.transTypeField, (state.actionType === IMPORT_ACTION_SET_TR_TYPE));
        show(this.accountField, (state.actionType === IMPORT_ACTION_SET_ACCOUNT));
        show(this.personField, (state.actionType === IMPORT_ACTION_SET_PERSON));
        show(this.amountField, isAmountTarget);
        show(this.valueField, !isSelectTarget && !isAmountTarget);

        this.setActionValue(state);
    }
}
