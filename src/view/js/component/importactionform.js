'use strict';

/* global ce, show, isFunction, selectedValue, selectByValue, extend, AppComponent */
/* global DecimalInput, ImportAction, View */
/* global IMPORT_ACTION_SET_TR_TYPE, IMPORT_ACTION_SET_ACCOUNT, IMPORT_ACTION_SET_PERSON */

/**
 * ImportActionForm component constructor
 * @param {Object} props
 */
function ImportActionForm() {
    ImportActionForm.parent.constructor.apply(this, arguments);

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
        persons: this.props.personModel
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

extend(ImportActionForm, AppComponent);

/** Shortcut for ImportActionForm constructor */
ImportActionForm.create = function (props) {
    var res;

    try {
        res = new ImportActionForm(props);
    } catch (e) {
        res = null;
    }

    return res;
};

/** Form controls initialization */
ImportActionForm.prototype.init = function () {
    // Create action type select element
    this.actionTypeSel = ce(
        'select',
        {},
        this.actionTypes.map(function (type) {
            return ce('option', { value: type.id, textContent: type.title });
        }),
        { change: this.onActionTypeChange.bind(this) }
    );
    this.actionTypeField = this.createField('Action', this.actionTypeSel);
    // Create transaction type select element
    this.transTypeSel = ce(
        'select',
        {},
        this.transactionTypes.map(function (type) {
            return ce('option', { value: type.id, textContent: type.title });
        }),
        { change: this.onValueChange.bind(this) }
    );
    this.transTypeField = this.createField('Transaction type', this.transTypeSel);
    // Create account select element
    this.accountSel = ce(
        'select',
        {},
        this.model.accounts.map(function (account) {
            return ce('option', { value: account.id, textContent: account.name });
        }),
        { change: this.onValueChange.bind(this) }
    );
    this.accountField = this.createField('Account', this.accountSel);
    // Create person select element
    this.personSel = ce(
        'select',
        {},
        this.model.persons.map(function (person) {
            return ce('option', { value: person.id, textContent: person.name });
        }),
        { change: this.onValueChange.bind(this) }
    );
    this.personField = this.createField('Person', this.personSel);
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
        { input: this.onValueChange.bind(this) }
    );
    this.valueField = this.createField('Value', this.valueInput);
    // Form fields container
    this.fieldsContainer = this.createContainer('action-form__fields', [
        this.actionTypeField,
        this.transTypeField,
        this.accountField,
        this.personField,
        this.amountField,
        this.valueField
    ]);
    // Invalid feedback message
    this.validFeedback = ce('div', { className: 'invalid-feedback' });
    this.container = this.createContainer('action-form__container validation-block', [
        this.fieldsContainer,
        this.validFeedback
    ]);

    // Delete button
    this.delBtn = ce(
        'button',
        { className: 'btn icon-btn delete-btn right-align', type: 'button' },
        this.createIcon('del'),
        { click: this.onDelete.bind(this) }
    );

    this.controls = this.createContainer('action-form__controls', [
        this.delBtn
    ]);

    this.elem = this.createContainer('action-form', [
        this.container,
        this.controls
    ]);
};

/** Set data for component */
ImportActionForm.prototype.setData = function (data) {
    var value;

    if (!data) {
        throw new Error('Invalid data');
    }

    this.state = {
        actionId: data.id,
        actionType: data.action_id,
        value: data.value,
        isValid: data.isValid,
        message: data.message
    };

    this.render(this.state);
    // Check value changed
    value = this.getActionValue(this.state);
    if (data.value !== value) {
        this.state.value = value;
        this.sendUpdate();
    }
};

/** Action type select 'change' event handler */
ImportActionForm.prototype.onActionTypeChange = function () {
    var value;

    value = selectedValue(this.actionTypeSel);
    value = parseInt(value, 10);
    if (!value) {
        return;
    }

    this.state.actionType = value;
    this.state.value = this.getActionValue(this.state);
    this.state.isValid = true;
    this.render(this.state);
    this.sendUpdate();
};

/** Return action value */
ImportActionForm.prototype.getActionValue = function (state) {
    if (!state) {
        throw new Error('Invalid state');
    }

    if (state.actionType === IMPORT_ACTION_SET_TR_TYPE) {
        return selectedValue(this.transTypeSel);
    }
    if (state.actionType === IMPORT_ACTION_SET_ACCOUNT) {
        return selectedValue(this.accountSel);
    }
    if (state.actionType === IMPORT_ACTION_SET_PERSON) {
        return selectedValue(this.personSel);
    }
    if (ImportAction.isAmountValue(state.actionType)) {
        return this.decAmountInput.value;
    }

    return this.valueInput.value;
};

/** Value select 'change' event handler */
ImportActionForm.prototype.onValueChange = function () {
    var value = this.getActionValue(this.state);

    if (this.state.value === value) {
        return;
    }

    this.state.value = value;
    this.state.isValid = true;
    this.render(this.state);
    this.sendUpdate();
};

/** Send component 'update' event */
ImportActionForm.prototype.sendUpdate = function () {
    if (isFunction(this.updateHandler)) {
        this.updateHandler(this.getData(this.state));
    }
};

/** Delete button 'click' event handler */
ImportActionForm.prototype.onDelete = function () {
    if (isFunction(this.deleteHandler)) {
        this.deleteHandler();
    }
};

/** Return import action object */
ImportActionForm.prototype.getData = function (state) {
    var res;

    if (!state) {
        throw new Error('Invalid state');
    }

    res = {
        action_id: state.actionType,
        value: state.value
    };

    if (state.actionId) {
        res.id = state.actionId;
    }

    return res;
};

/** Render component state */
ImportActionForm.prototype.render = function (state) {
    var isSelectTarget;
    var isAmountTarget;

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

    isSelectTarget = ImportAction.isSelectValue(state.actionType);
    isAmountTarget = ImportAction.isAmountValue(state.actionType);
    selectByValue(this.actionTypeSel, state.actionType);

    show(this.transTypeField, (state.actionType === IMPORT_ACTION_SET_TR_TYPE));
    show(this.accountField, (state.actionType === IMPORT_ACTION_SET_ACCOUNT));
    show(this.personField, (state.actionType === IMPORT_ACTION_SET_PERSON));
    show(this.amountField, isAmountTarget);
    show(this.valueField, !isSelectTarget && !isAmountTarget);

    if (state.actionType === IMPORT_ACTION_SET_TR_TYPE) {
        selectByValue(this.transTypeSel, state.value);
    } else if (state.actionType === IMPORT_ACTION_SET_ACCOUNT) {
        selectByValue(this.accountSel, state.value);
    } else if (state.actionType === IMPORT_ACTION_SET_PERSON) {
        selectByValue(this.personSel, state.value);
    } else if (isAmountTarget) {
        this.decAmountInput.value = state.value;
    } else {
        this.valueInput.value = state.value;
    }
};
