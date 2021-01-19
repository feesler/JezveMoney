'use strict';

/* global ce, isFunction, show, selectedValue, selectByValue, extend, AppComponent */
/* global addChilds, removeChilds, DecimalInput */
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
    // Create property select element
    this.propertySel = ce(
        'select',
        {},
        this.fieldTypes.map(function (fieldType) {
            var isDisabled = false;

            if (ImportCondition.isTemplateField(fieldType.id)) {
                isDisabled = !this.model.template.data.length;
            }

            return ce('option', {
                value: fieldType.id,
                textContent: fieldType.title,
                disabled: isDisabled
            });
        }, this),
        { change: this.onPropertyChange.bind(this) }
    );
    this.propertyField = this.createField('Property', this.propertySel);
    // Create operator select element
    this.operatorSel = ce(
        'select',
        {},
        this.operatorTypes.map(function (operatorType) {
            return ce('option', { value: operatorType.id, textContent: operatorType.title });
        }),
        { change: this.onOperatorChange.bind(this) }
    );
    this.operatorField = this.createField('Operator', this.operatorSel);
    // Create account value select element
    this.accountSel = ce(
        'select',
        {},
        this.model.accounts.data.map(function (account) {
            return ce('option', { value: account.id, textContent: account.name });
        }),
        { change: this.onValueChange.bind(this) }
    );
    this.accountField = this.createField('Account', this.accountSel);
    // Create account value select element
    this.templateSel = ce(
        'select',
        {},
        this.model.template.data.map(function (template) {
            return ce('option', { value: template.id, textContent: template.name });
        }),
        { change: this.onValueChange.bind(this) }
    );
    this.templateField = this.createField('Template', this.templateSel);
    // Create currency value select element
    this.currencySel = ce(
        'select',
        {},
        this.model.currency.data.map(function (currency) {
            return ce('option', { value: currency.id, textContent: currency.name });
        }),
        { change: this.onValueChange.bind(this) }
    );
    this.currencyField = this.createField('Currency', this.currencySel);
    // Create value property select element
    this.valuePropSel = ce(
        'select',
        {},
        this.fieldTypes.map(function (fieldType) {
            return ce('option', { value: fieldType.id, textContent: fieldType.title });
        }),
        { change: this.onValueChange.bind(this) }
    );
    this.valuePropField = this.createField('Value property', this.valuePropSel);
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

    // Delete button
    this.delBtn = ce(
        'button',
        { className: 'btn icon-btn delete-btn', type: 'button' },
        this.createIcon('del'),
        { click: this.onDelete.bind(this) }
    );
    this.controls = this.createContainer('cond-form__controls', this.delBtn);

    this.elem = this.createContainer('cond-form', [
        this.fields,
        this.controls
    ]);
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
        isFieldValue: data.isFieldValueOperator(),
        value: data.value
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
ImportConditionForm.prototype.onPropertyChange = function () {
    var value = selectedValue(this.propertySel);
    var fieldType = ImportCondition.getFieldTypeById(value);
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

    this.verifyOperator(this.state);
    this.render(this.state);
    this.sendUpdate();
};

/** Operator select 'change' event handler */
ImportConditionForm.prototype.onOperatorChange = function () {
    var value = selectedValue(this.operatorSel);
    var operatorId = parseInt(value, 10);
    if (!operatorId) {
        throw new Error('Invalid operator');
    }

    if (this.state.operator === operatorId) {
        return;
    }

    this.state.operator = operatorId;
    this.render(this.state);
    this.sendUpdate();
};

/** Return condition value */
ImportConditionForm.prototype.getConditionValue = function (state) {
    if (!state) {
        throw new Error('Invalid state');
    }

    if (state.isFieldValue) {
        return selectedValue(this.valuePropSel);
    }
    if (ImportCondition.isAccountField(state.fieldType)) {
        return selectedValue(this.accountSel);
    }
    if (ImportCondition.isTemplateField(state.fieldType)) {
        return selectedValue(this.templateSel);
    }
    if (ImportCondition.isCurrencyField(state.fieldType)) {
        return selectedValue(this.currencySel);
    }
    if (ImportCondition.isAmountField(state.fieldType)) {
        return this.decAmountInput.value;
    }

    return this.valueInput.value;
};

/** Set condition value */
ImportConditionForm.prototype.setConditionValue = function (state) {
    if (!state) {
        throw new Error('Invalid state');
    }

    if (state.isFieldValue) {
        selectByValue(this.valuePropSel, state.value);
    } else if (ImportCondition.isAccountField(state.fieldType)) {
        selectByValue(this.accountSel, state.value);
    } else if (ImportCondition.isTemplateField(state.fieldType)) {
        selectByValue(this.templateSel, state.value);
    } else if (ImportCondition.isCurrencyField(state.fieldType)) {
        selectByValue(this.currencySel, state.value);
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
    this.render(this.state);
    this.sendUpdate();
};

/** Field value checkbox 'change' event handler */
ImportConditionForm.prototype.onFieldValueChecked = function () {
    this.state.isFieldValue = this.fieldValueCheck.checked;
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
    var options;

    if (!state) {
        throw new Error('Invalid state');
    }

    options = this.operatorTypes.map(function (operatorType) {
        return ce('option', {
            value: operatorType.id,
            selected: (operatorType.id === state.operator),
            textContent: operatorType.title,
            disabled: !state.availOperators.includes(operatorType.id)
        });
    });

    removeChilds(this.operatorSel);
    addChilds(this.operatorSel, options);
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

    selectByValue(this.propertySel, state.fieldType);
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
