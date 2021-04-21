'use strict';

/* global ce, isFunction, show, extend, AppComponent */
/* global DropDown, DecimalInput, View */
/* global ImportCondition, IMPORT_COND_OP_FIELD_FLAG */

/**
 * ImportConditionForm component constructor
 * @param {Object} props
 */
function ImportConditionForm() {
    ImportConditionForm.parent.constructor.apply(this, arguments);

    if (
        !this.parent
        || !this.props
        || !this.props.data
        || !this.props.tplModel
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
        template: this.props.tplModel,
        currency: this.props.currencyModel,
        accounts: this.props.accountModel,
        persons: this.props.personModel
    };

    if (!(this.props.data instanceof ImportCondition)) {
        throw new Error('Invalid condition item');
    }
    this.props.data.isValid = this.props.isValid;
    this.props.data.message = this.props.message;

    this.fieldTypes = ImportCondition.getFieldTypes();
    this.operatorTypes = ImportCondition.getOperatorTypes();

    this.init();
    this.setData(this.props.data);
}

extend(ImportConditionForm, AppComponent);

/** Shortcut for ImportConditionForm constructor */
ImportConditionForm.create = function (props) {
    return new ImportConditionForm(props);
};

/** Form controls initialization */
ImportConditionForm.prototype.init = function () {
    this.createPropertyField();
    this.createOperatorField();
    this.createAccountField();
    this.createTemplateField();
    this.createCurrencyField();
    this.createValuePropField();

    // Create amount input element
    this.amountInput = ce('input', { type: 'text' });
    this.decAmountInput = DecimalInput.create({
        elem: this.amountInput,
        oninput: this.onValueChange.bind(this)
    });
    this.amountField = this.createField('Amount', this.amountInput);
    // Create text value input element
    this.valueInput = ce(
        'input',
        { type: 'text' },
        null,
        { input: this.onValueChange.bind(this) }
    );
    this.valueField = this.createField('Value', this.valueInput);

    // Field value checkbox
    this.fieldValueCheck = ce('input', { type: 'checkbox' });
    this.fieldValueCheck.addEventListener('change', this.onFieldValueChecked.bind(this));
    this.valueFieldBlock = this.createContainer('value-field', [
        this.accountField,
        this.templateField,
        this.currencyField,
        this.amountField,
        this.valueField,
        this.valuePropField,
        this.createCheck(this.fieldValueCheck, 'checkwrap', 'Compare with another property')
    ]);

    this.fields = this.createContainer('cond-form__fields', [
        this.propertyField,
        this.operatorField,
        this.valueFieldBlock
    ]);

    // Invalid feedback message
    this.validFeedback = ce('div', { className: 'invalid-feedback' });
    this.container = this.createContainer('cond-form__container validation-block', [
        this.fields,
        this.validFeedback
    ]);

    // Delete button
    this.delBtn = ce(
        'button',
        { className: 'btn icon-btn delete-btn', type: 'button' },
        this.createIcon('del'),
        { click: this.onDelete.bind(this) }
    );
    this.controls = this.createContainer('cond-form__controls', this.delBtn);

    this.elem = this.createContainer('cond-form', [
        this.container,
        this.controls
    ]);
};

/** Create property field */
ImportConditionForm.prototype.createPropertyField = function () {
    var filedTypeItems = this.fieldTypes.filter(function (fieldType) {
        return !ImportCondition.isTemplateField(fieldType.id);
    }).map(function (fieldType) {
        return { id: fieldType.id, title: fieldType.title };
    });
    var selectElem = ce('select');
    this.propertyField = this.createField('Property', selectElem);

    this.propertyDropDown = DropDown.create({
        input_id: selectElem,
        onchange: this.onPropertyChange.bind(this),
        editable: false
    });

    this.propertyDropDown.append(filedTypeItems);
    this.propertyDropDown.selectItem(filedTypeItems[0].id);
};

/** Create operator field */
ImportConditionForm.prototype.createOperatorField = function () {
    var operatorItems = this.operatorTypes.map(function (operatorType) {
        return { id: operatorType.id, title: operatorType.title };
    });
    var selectElem = ce('select');
    this.operatorField = this.createField('Operator', selectElem);

    this.operatorDropDown = DropDown.create({
        input_id: selectElem,
        onchange: this.onOperatorChange.bind(this),
        editable: false
    });
    this.operatorDropDown.append(operatorItems);
    this.operatorDropDown.selectItem(operatorItems[0].id);
};

/** Create account field */
ImportConditionForm.prototype.createAccountField = function () {
    var accountItems = this.model.accounts.map(function (account) {
        return { id: account.id, title: account.name };
    });
    var selectElem = ce('select');
    this.accountField = this.createField('Account', selectElem);

    this.accountDropDown = DropDown.create({
        input_id: selectElem,
        onchange: this.onValueChange.bind(this),
        editable: false
    });
    this.accountDropDown.append(accountItems);
    this.accountDropDown.selectItem(accountItems[0].id);
};

/** Create template field */
ImportConditionForm.prototype.createTemplateField = function () {
    var templateItems = this.model.template.map(function (template) {
        return { id: template.id, title: template.name };
    });
    var selectElem = ce('select');
    this.templateField = this.createField('Template', selectElem);

    this.templateDropDown = DropDown.create({
        input_id: selectElem,
        onchange: this.onValueChange.bind(this),
        editable: false
    });
    this.templateDropDown.append(templateItems);
    if (templateItems.length > 0) {
        this.templateDropDown.selectItem(templateItems[0].id);
    }
};

/** Create currency field */
ImportConditionForm.prototype.createCurrencyField = function () {
    var currencyItems = this.model.currency.map(function (currency) {
        return { id: currency.id, title: currency.name };
    });
    var selectElem = ce('select');
    this.currencyField = this.createField('Currency', selectElem);

    this.currencyDropDown = DropDown.create({
        input_id: selectElem,
        onchange: this.onValueChange.bind(this),
        editable: false
    });
    this.currencyDropDown.append(currencyItems);
    this.currencyDropDown.selectItem(currencyItems[0].id);
};

/** Create value property field */
ImportConditionForm.prototype.createValuePropField = function () {
    var items = this.fieldTypes.filter(function (fieldType) {
        return !ImportCondition.isTemplateField(fieldType.id);
    }).map(function (fieldType) {
        return { id: fieldType.id, title: fieldType.title };
    });
    var selectElem = ce('select');
    this.valuePropField = this.createField('Value property', selectElem);

    this.valuePropDropDown = DropDown.create({
        input_id: selectElem,
        onchange: this.onValueChange.bind(this),
        editable: false
    });
    this.valuePropDropDown.append(items);
    this.valuePropDropDown.selectItem(items[0].id);
};

/** Verify correctness of operator */
ImportConditionForm.prototype.verifyOperator = function (state) {
    if (
        !state
        || !Array.isArray(state.availOperators)
        || !state.availOperators.length
        || !state.availOperators.includes(state.operator)
    ) {
        throw new Error('Invalid state');
    }
};

/** Set main state of component */
ImportConditionForm.prototype.setData = function (data) {
    var value;

    if (!data) {
        throw new Error('Invalid data');
    }

    this.state = {
        conditionId: data.id,
        parent: data.parent_id,
        fieldType: data.field_id,
        availOperators: data.getAvailOperators(),
        operator: data.operator,
        isFieldValue: data.isPropertyValue(),
        value: data.value,
        isValid: data.isValid,
        message: data.message
    };

    this.verifyOperator(this.state);
    this.render(this.state);
    // Check value changed
    value = this.getConditionValue(this.state);
    if (data.value !== value) {
        this.state.value = value;
        this.sendUpdate();
    }
};

/** Property select 'change' event handler */
ImportConditionForm.prototype.onPropertyChange = function (property) {
    var fieldType;

    if (!property || !property.id) {
        throw new Error('Invalid property');
    }

    fieldType = ImportCondition.getFieldTypeById(property.id);
    if (!fieldType) {
        throw new Error('Invalid property type');
    }

    if (this.state.fieldType === fieldType.id) {
        return;
    }

    this.state.fieldType = fieldType.id;
    this.state.availOperators = fieldType.operators;
    // If not available operator is selected then select first available
    if (!this.state.availOperators.includes(this.state.operator)) {
        this.state.operator = this.state.availOperators[0];
    }

    this.state.value = this.getConditionValue(this.state);
    this.state.isValid = true;

    this.verifyOperator(this.state);
    this.render(this.state);
    this.sendUpdate();
};

/** Operator select 'change' event handler */
ImportConditionForm.prototype.onOperatorChange = function (operator) {
    if (!operator || !operator.id) {
        throw new Error('Invalid operator');
    }

    if (this.state.operator === operator.id) {
        return;
    }

    this.state.operator = operator.id;
    this.state.isValid = true;
    this.render(this.state);
    this.sendUpdate();
};

/** Return condition value */
ImportConditionForm.prototype.getConditionValue = function (state) {
    var selection;

    if (!state) {
        throw new Error('Invalid state');
    }

    if (state.isFieldValue) {
        selection = this.valuePropDropDown.getSelectionData();
        return selection.id;
    }
    if (ImportCondition.isAccountField(state.fieldType)) {
        selection = this.accountDropDown.getSelectionData();
        return selection.id;
    }
    if (ImportCondition.isTemplateField(state.fieldType)) {
        selection = this.templateDropDown.getSelectionData();
        return selection.id;
    }
    if (ImportCondition.isCurrencyField(state.fieldType)) {
        selection = this.currencyDropDown.getSelectionData();
        return selection.id;
    }
    if (ImportCondition.isAmountField(state.fieldType)) {
        return this.decAmountInput.value;
    }

    return this.valueInput.value;
};

/** Set condition value */
ImportConditionForm.prototype.setConditionValue = function (state) {
    var value;

    if (!state) {
        throw new Error('Invalid state');
    }

    if (ImportCondition.isItemField(state.fieldType) || state.isFieldValue) {
        value = parseInt(state.value, 10);
    }

    if (state.isFieldValue) {
        this.valuePropDropDown.selectItem(value);
    } else if (ImportCondition.isAccountField(state.fieldType)) {
        this.accountDropDown.selectItem(value);
    } else if (ImportCondition.isTemplateField(state.fieldType)) {
        this.templateDropDown.selectItem(value);
    } else if (ImportCondition.isCurrencyField(state.fieldType)) {
        this.currencyDropDown.selectItem(value);
    } else if (ImportCondition.isAmountField(state.fieldType)) {
        this.decAmountInput.value = state.value;
    } else {
        this.valueInput.value = state.value;
    }
};

/** Value property select 'change' event handler */
ImportConditionForm.prototype.onValueChange = function () {
    var value = this.getConditionValue(this.state);

    if (this.state.value === value) {
        return;
    }

    this.state.value = value;
    this.state.isValid = true;
    this.render(this.state);
    this.sendUpdate();
};

/** Field value checkbox 'change' event handler */
ImportConditionForm.prototype.onFieldValueChecked = function () {
    this.state.isFieldValue = this.fieldValueCheck.checked;
    this.state.value = this.getConditionValue(this.state);
    this.state.isValid = true;
    this.render(this.state);
    this.sendUpdate();
};

/** Return import rule object */
ImportConditionForm.prototype.getData = function (state) {
    var res;

    if (!state) {
        throw new Error('Invalid state');
    }

    res = {
        parent_id: state.parent,
        field_id: state.fieldType,
        operator: state.operator,
        value: state.value,
        flags: (state.isFieldValue) ? IMPORT_COND_OP_FIELD_FLAG : 0
    };

    if (state.conditionId) {
        res.id = state.conditionId;
    }

    return res;
};

/** Send component 'update' event */
ImportConditionForm.prototype.sendUpdate = function () {
    if (isFunction(this.updateHandler)) {
        this.updateHandler(this.getData(this.state));
    }
};

/** Delete button 'click' event handler */
ImportConditionForm.prototype.onDelete = function () {
    if (isFunction(this.deleteHandler)) {
        this.deleteHandler();
    }
};

/** Render operator select */
ImportConditionForm.prototype.renderOperator = function (state) {
    var items;

    if (!state) {
        throw new Error('Invalid state');
    }

    items = this.operatorTypes.filter(function (operatorType) {
        return state.availOperators.includes(operatorType.id);
    }).map(function (operatorType) {
        return {
            id: operatorType.id,
            title: operatorType.title
        };
    });

    this.operatorDropDown.removeAll();
    this.operatorDropDown.append(items);
    this.operatorDropDown.selectItem(state.operator);
};

/** Render component state */
ImportConditionForm.prototype.render = function (state) {
    var isAccountValue;
    var isTplValue;
    var isCurrencyValue;
    var isAmountValue;
    var isTextValue;

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

    this.propertyDropDown.selectItem(state.fieldType);
    this.renderOperator(state);
    this.fieldValueCheck.checked = state.isFieldValue;

    isAccountValue = !state.isFieldValue && ImportCondition.isAccountField(state.fieldType);
    isTplValue = !state.isFieldValue && ImportCondition.isTemplateField(state.fieldType);
    isCurrencyValue = !state.isFieldValue && ImportCondition.isCurrencyField(state.fieldType);
    isAmountValue = !state.isFieldValue && ImportCondition.isAmountField(state.fieldType);
    isTextValue = (!state.isFieldValue
        && (ImportCondition.isDateField(state.fieldType)
            || ImportCondition.isStringField(state.fieldType))
    );

    show(this.accountField, isAccountValue);
    show(this.templateField, isTplValue);
    show(this.currencyField, isCurrencyValue);
    show(this.amountField, isAmountValue);
    show(this.valuePropField, state.isFieldValue);
    show(this.valueField, isTextValue);

    this.setConditionValue(state);
};
