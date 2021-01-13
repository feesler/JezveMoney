'use strict';

/* global ce, extend, AppComponent */
/* global ImportCondition */
/* global IMPORT_COND_OP_FIELD_FLAG, IMPORT_COND_FIELD_TR_CURRENCY */
/* global IMPORT_COND_FIELD_ACC_CURRENCY */
/* global IMPORT_COND_FIELD_MAIN_ACCOUNT, IMPORT_COND_FIELD_TPL */

/**
 * ImportConditionItem component constructor
 * @param {Object} props
 */
function ImportConditionItem() {
    ImportConditionItem.parent.constructor.apply(this, arguments);

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

    this.submitHandler = this.props.submit;
    this.cancelHandler = this.props.cancel;
    this.updateHandler = this.props.update;
    this.deleteHandler = this.props.remove;

    this.model = {
        templates: this.props.tplModel,
        currency: this.props.currencyModel,
        accounts: this.props.accountModel,
        persons: this.props.personModel
    };

    if (!(this.props.data instanceof ImportCondition)) {
        throw new Error('Invalid rule item');
    }

    this.init();
    this.setData(this.props.data);
}

extend(ImportConditionItem, AppComponent);

/** Shortcut for ImportConditionItem constructor */
ImportConditionItem.create = function (props) {
    return new ImportConditionItem(props);
};

/** Main structure initialization */
ImportConditionItem.prototype.init = function () {
    this.propertyLabel = ce('span', { className: 'cond-item__property' });
    this.operatorLabel = ce('span', { className: 'cond-item__operator' });
    this.valueLabel = ce('span', { className: 'cond-item__value' });

    this.elem = this.createContainer('cond-item', [
        this.propertyLabel,
        this.operatorLabel,
        this.valueLabel
    ]);
};

/** Set main state of component */
ImportConditionItem.prototype.setData = function (data) {
    if (!data) {
        throw new Error('Invalid data');
    }

    this.state = {
        conditionId: data.id,
        parentRuleId: data.rule_id,
        fieldType: data.field_id,
        operator: data.operator,
        isFieldValue: data.isFieldValueOperator(),
        value: data.value
    };

    this.render(this.state);
};

/** Return import rule object */
ImportConditionItem.prototype.getData = function () {
    var res = {
        parent_id: this.state.parentRuleId,
        field_id: this.state.fieldType,
        operator: this.state.operator,
        value: this.state.value,
        flags: (this.state.isFieldValue) ? IMPORT_COND_OP_FIELD_FLAG : 0
    };

    if (this.state.conditionId) {
        res.id = this.state.conditionId;
    }

    return res;
};

/** Return formatted rule value */
ImportConditionItem.prototype.formatValue = function (state) {
    var propertyType;
    var valueItem;

    if (!state) {
        throw new Error('Invalid state');
    }

    if (state.isFieldValue) {
        propertyType = ImportCondition.getFieldTypeById(state.value);
        if (!propertyType) {
            throw new Error('Field type not found');
        }

        return propertyType.title;
    }

    if (state.fieldType === IMPORT_COND_FIELD_TR_CURRENCY
        || state.fieldType === IMPORT_COND_FIELD_ACC_CURRENCY) {
        valueItem = this.model.currency.getItem(state.value);
        if (!valueItem) {
            throw new Error('Invalid currency');
        }

        return valueItem.name;
    }

    if (state.fieldType === IMPORT_COND_FIELD_MAIN_ACCOUNT) {
        valueItem = this.model.accounts.getItem(state.value);
        if (!valueItem) {
            throw new Error('Invalid account');
        }

        return valueItem.name;
    }

    if (state.fieldType === IMPORT_COND_FIELD_TPL) {
        valueItem = this.model.templates.getItem(state.value);
        if (!valueItem) {
            throw new Error('Invalid template');
        }

        return valueItem.name;
    }

    return state.value;
};

/** Render component state */
ImportConditionItem.prototype.render = function (state) {
    var propertyType;
    var operatorType;

    if (!state) {
        throw new Error('Invalid state');
    }

    // Left value property
    propertyType = ImportCondition.getFieldTypeById(state.fieldType);
    if (!propertyType) {
        throw new Error('Field type not found');
    }
    this.propertyLabel.textContent = propertyType.title;
    // Operator
    operatorType = ImportCondition.getOperatorById(state.operator);
    if (!operatorType) {
        throw new Error('Operator not found');
    }
    this.operatorLabel.textContent = operatorType.title;
    // Right value
    if (state.isFieldValue) {
        this.valueLabel.classList.add('cond-item__value-property');
        this.valueLabel.classList.remove('cond-item__value');
    } else {
        this.valueLabel.classList.remove('cond-item__value-property');
        this.valueLabel.classList.add('cond-item__value');
    }
    this.valueLabel.textContent = this.formatValue(state);
};
