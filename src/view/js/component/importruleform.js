'use strict';

/* global ce, enable, isFunction, checkDate, extend, AppComponent */
/* global fixFloat, copyObject, removeChilds */
/* global ImportRule, ImportAction, ImportActionList, ImportActionForm */
/* global ImportCondition, ImportConditionList, ImportConditionForm */
/* global IMPORT_COND_OP_EQUAL, IMPORT_COND_OP_NOT_EQUAL */
/* global IMPORT_COND_OP_LESS, IMPORT_COND_OP_GREATER */

/**
 * ImportRuleForm component constructor
 * @param {Object} props
 */
function ImportRuleForm() {
    ImportRuleForm.parent.constructor.apply(this, arguments);

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
        template: this.props.tplModel,
        currency: this.props.currencyModel,
        accounts: this.props.accountModel,
        persons: this.props.personModel
    };

    if (!(this.props.data instanceof ImportRule)) {
        throw new Error('Invalid rule item');
    }

    this.fieldTypes = ImportCondition.getFieldTypes();
    this.actionTypes = ImportAction.getTypes();

    this.init();
    this.setData(this.props.data);
}

extend(ImportRuleForm, AppComponent);

/** Shortcut for ImportRuleForm constructor */
ImportRuleForm.create = function (props) {
    return new ImportRuleForm(props);
};

/** Form controls initialization */
ImportRuleForm.prototype.init = function () {
    // Hidden id input
    this.idInput = ce('input', { type: 'hidden' });
    // Conditions
    this.createCondBtn = ce(
        'button',
        { className: 'btn link-btn create-btn', type: 'button', textContent: 'Create' },
        null,
        { click: this.onCreateConditionClick.bind(this) }
    );
    this.toggleCondBtn = ce(
        'button',
        { className: 'btn icon-btn toggle-btn right-align', type: 'button' },
        this.createIcon('toggle-ext')
    );
    this.conditionsHeader = this.createContainer('rule-form__collapse-header', [
        ce('label', { textContent: 'Conditions' }),
        this.createCondBtn,
        this.toggleCondBtn
    ], { click: this.onToggleConditions.bind(this) });
    this.conditionsContainer = this.createContainer('rule-form__collapse-content', []);
    this.formConditions = this.createContainer('rule-form__collapse', [
        this.conditionsHeader,
        this.conditionsContainer
    ]);

    // Actions
    this.createActionBtn = ce(
        'button',
        { className: 'btn link-btn create-btn', type: 'button', textContent: 'Create' },
        null,
        { click: this.onCreateActionClick.bind(this) }
    );
    this.toggleActionsBtn = ce(
        'button',
        { className: 'btn icon-btn toggle-btn right-align', type: 'button' },
        this.createIcon('toggle-ext')
    );
    this.actionsHeader = this.createContainer('rule-form__collapse-header', [
        ce('label', { textContent: 'Actions' }),
        this.createActionBtn,
        this.toggleActionsBtn
    ], { click: this.onToggleActions.bind(this) });
    this.formActionsContainer = this.createContainer('rule-form__collapse-content', []);
    this.formActions = this.createContainer('rule-form__collapse', [
        this.actionsHeader,
        this.formActionsContainer
    ]);

    // Controls
    this.saveBtn = ce(
        'button',
        { className: 'btn submit-btn', type: 'button', textContent: 'Ok' },
        null,
        { click: this.onSubmit.bind(this) }
    );
    this.cancelBtn = ce(
        'button',
        { className: 'btn link-btn cancel-btn', type: 'button', textContent: 'Cancel' },
        null,
        { click: this.onCancel.bind(this) }
    );
    this.controls = this.createContainer('rule-form__controls', [
        this.saveBtn,
        this.cancelBtn
    ]);

    this.elem = this.createContainer('rule-form', [
        this.idInput,
        this.formConditions,
        this.formActions,
        this.controls
    ]);
};

/** Set main state of component */
ImportRuleForm.prototype.setData = function (data) {
    if (!data) {
        throw new Error('Invalid data');
    }

    this.state = {
        ruleId: data.id,
        parent: data.parent_id,
        conditions: data.conditions,
        conditionsCollapsed: false,
        actions: data.actions,
        actionsCollapsed: true
    };

    this.render(this.state);
};

/** Search for first action type not used in rule */
ImportRuleForm.prototype.getNextAvailAction = function (state) {
    var ruleActionTypes;

    if (!state) {
        throw new Error('Invalid state');
    }

    // Obtain action types currently used by rule
    ruleActionTypes = state.actions.data.map(function (action) {
        return action.action_id;
    });
    // Search for first action type not in list
    return this.actionTypes.find(function (actionType) {
        return !ruleActionTypes.includes(actionType.id);
    });
};

/** Create action button 'click' event handler */
ImportRuleForm.prototype.onCreateActionClick = function (e) {
    var action;
    var actionType;
    var actionData;

    e.stopPropagation();

    actionType = this.getNextAvailAction(this.state);
    if (!actionType) {
        return;
    }

    actionData = {
        action_id: actionType.id,
        value: ''
    };

    action = new ImportAction(actionData);
    this.state.actions.data.push(action);

    this.state.conditionsCollapsed = true;
    this.state.actionsCollapsed = false;

    this.render(this.state);
};

/** Search for first condition field type not used in rule */
ImportRuleForm.prototype.getNextAvailProperty = function (state) {
    var ruleFieldTypes;
    var availFields;

    if (!state) {
        throw new Error('Invalid state');
    }

    // Obtain condition field types currently used by rule
    ruleFieldTypes = state.conditions.data.map(function (condition) {
        return condition.field_id;
    });
    // Filter available field types
    availFields = this.fieldTypes.filter(function (fieldType) {
        if (ImportCondition.isTemplateField(fieldType.id)) {
            return this.model.template.data.length > 0;
        }

        return true;
    }, this);

    // Search for first field type not in list
    return availFields.find(function (fieldType) {
        return !ruleFieldTypes.includes(fieldType.id);
    });
};

/** Search for first condition field type not used in rule */
ImportRuleForm.prototype.getDefaultValue = function (fieldId) {
    var item;
    var fieldType = parseInt(fieldId, 10);
    if (!fieldType) {
        throw new Error('Invalid field type');
    }

    if (ImportCondition.isAccountField(fieldType)) {
        item = this.model.accounts.getItemByIndex(0);
        if (!item) {
            throw new Error('No accounts available');
        }

        return item.id;
    }

    if (ImportCondition.isTemplateField(fieldType)) {
        item = this.model.template.getItemByIndex(0);
        if (!item) {
            throw new Error('No template available');
        }

        return item.id;
    }

    if (ImportCondition.isCurrencyField(fieldType)) {
        item = this.model.currency.getItemByIndex(0);
        if (!item) {
            throw new Error('No currency available');
        }

        return item.id;
    }

    return '';
};

/** Create condition button 'click' event handler */
ImportRuleForm.prototype.onCreateConditionClick = function (e) {
    var fieldType;
    var condition;
    var conditionData;

    e.stopPropagation();

    fieldType = this.getNextAvailProperty(this.state);
    if (!fieldType) {
        return;
    }

    conditionData = {
        field_id: fieldType.id,
        operator: fieldType.operators[0],
        value: this.getDefaultValue(fieldType.id),
        flags: 0
    };

    condition = new ImportCondition(conditionData);
    this.state.conditions.data.push(condition);

    this.state.conditionsCollapsed = false;
    this.state.actionsCollapsed = true;

    this.render(this.state);
};

/** Conditions toggle button 'click' event handler */
ImportRuleForm.prototype.onToggleConditions = function () {
    this.state.conditionsCollapsed = !this.state.conditionsCollapsed;
    if (!this.state.conditionsCollapsed) {
        this.state.actionsCollapsed = true;
    }

    this.render(this.state);
};

/** Actions toggle button 'click' event handler */
ImportRuleForm.prototype.onToggleActions = function () {
    this.state.actionsCollapsed = !this.state.actionsCollapsed;
    if (!this.state.actionsCollapsed) {
        this.state.conditionsCollapsed = true;
    }

    this.render(this.state);
};

/** Return import rule object */
ImportRuleForm.prototype.getData = function (state) {
    var res = {
        flags: 0
    };

    if (!state) {
        throw new Error('Invalid state');
    }

    if (state.ruleId) {
        res.id = state.ruleId;
    }

    res.conditions = copyObject(state.conditions.data);
    res.actions = copyObject(state.actions.data);

    return res;
};

/** Validate amount value */
ImportRuleForm.prototype.isValidAmount = function (value) {
    var amount = parseFloat(fixFloat(value));
    return (!Number.isNaN(amount) && amount !== 0);
};

/** Validate import rule from state object */
ImportRuleForm.prototype.isValidRule = function (state) {
    var valid;
    var notEqConds;
    var lessConds;
    var greaterConds;
    var ruleActionTypes = [];

    if (!state
        || !(state.conditions instanceof ImportConditionList)
        || !(state.actions instanceof ImportActionList)) {
        throw new Error('Invalid state');
    }

    // Check conditions
    if (!state.conditions.data.length) {
        console.log('No conditions');
        return false;
    }

    notEqConds = new ImportConditionList();
    lessConds = new ImportConditionList();
    greaterConds = new ImportConditionList();

    valid = state.conditions.data.every(function (condition) {
        // Check empty condition value is used only for string field
        // with 'equal' and 'not equal' operators
        if (condition.value === ''
            && !(
                ImportCondition.isStringField(condition.field_id)
                && ImportCondition.itemOperators.includes(condition.operator)
            )
        ) {
            console.log('Invalid empty value condition');
            return false;
        }

        // Check amount value
        if (ImportCondition.isAmountField(condition.field_id)
            && !this.isValidAmount(condition.value)
        ) {
            console.log('Invalid amount value');
            return false;
        }

        // Check date condition
        if (ImportCondition.isDateField(condition.field_id)
            && !checkDate(condition.value)
        ) {
            console.log('Invalid date value');
            return false;
        }

        // Skip field value condition because final value may take any value
        // and fit to any region, so assume it correct
        if (condition.isFieldValueOperator()) {
            return true;
        }

        // Check 'equal' conditions for each field type present only once
        // 'Equal' operator is exclusive: conjunction with any other operator gives the same result,
        // so it is meaningless
        if (condition.operator === IMPORT_COND_OP_EQUAL) {
            if (state.conditions.hasSameFieldCondition(condition)) {
                console.log('equal: has same field condition');
                return false;
            }
        }

        if (condition.operator === IMPORT_COND_OP_LESS) {
            // Check 'less' condition for each field type present only once
            if (lessConds.hasSameFieldCondition(condition)) {
                console.log('less: already has less operator condition');
                return false;
            }
            // Check value regions of 'greater' and 'not equal' conditions is intersected
            // with value region of current condition
            if (greaterConds.hasNotLessCondition(condition)
                || notEqConds.hasNotLessCondition(condition)) {
                console.log('less: not intersected value regions');
                return false;
            }

            lessConds.addItem(condition);
        }

        if (condition.operator === IMPORT_COND_OP_GREATER) {
            // Check 'greater' condition for each field type present only once
            if (greaterConds.hasSameFieldCondition(condition)) {
                console.log('greater: already has greater operator condition');
                return false;
            }
            // Check value regions of 'less' and 'not equal' conditions is intersected
            // with value region of current condition
            if (lessConds.hasNotGreaterCondition(condition)
                || notEqConds.hasNotGreaterCondition(condition)) {
                console.log('greater: not intersected value regions');
                return false;
            }

            greaterConds.addItem(condition);
        }

        if (condition.operator === IMPORT_COND_OP_NOT_EQUAL) {
            // Check value regions of 'less' and 'greater' conditions es intersected
            // with current value
            if (lessConds.hasNotGreaterCondition(condition)
                || greaterConds.hasNotLessCondition(condition)) {
                console.log('not equal: not intersected value regions');
                return false;
            }

            notEqConds.addItem(condition);
        }

        return true;
    }, this);
    if (!valid) {
        return false;
    }

    // Check actions
    if (!state.actions.data.length) {
        console.log('No actions');
        return false;
    }
    valid = state.actions.data.every(function (action) {
        // Check each type of action is used only once
        if (ruleActionTypes.includes(action.action_id)) {
            return false;
        }

        ruleActionTypes.push(action.action_id);
        // Amount value
        if (action.isAmountValue()) {
            if (!this.isValidAmount(action.value)) {
                console.log('Invalid amount value');
                return false;
            }
        }

        return true;
    }, this);
    if (!valid) {
        return false;
    }

    return true;
};

/** Save button 'click' event handler */
ImportRuleForm.prototype.onSubmit = function () {
    if (isFunction(this.submitHandler)) {
        this.submitHandler(this.getData(this.state));
    }
};

/** Cancel button 'click' event handler */
ImportRuleForm.prototype.onCancel = function () {
    if (isFunction(this.cancelHandler)) {
        this.cancelHandler();
    }
};

/** Condition 'update' event handler */
ImportRuleForm.prototype.onConditionUpdate = function (index, data) {
    if (!data
        || index < 0
        || index >= this.state.conditions.data.length) {
        return;
    }

    this.state.conditions.data[index] = new ImportCondition(data);

    this.validateSubmit(this.state);
};

/** Condition 'delete' event handler */
ImportRuleForm.prototype.onConditionDelete = function (index) {
    if (index < 0 || index >= this.state.conditions.data.length) {
        return;
    }

    this.state.conditions.data.splice(index, 1);

    this.render(this.state);
};

/** Action 'update' event handler */
ImportRuleForm.prototype.onActionUpdate = function (index, data) {
    if (!data
        || index < 0
        || index >= this.state.actions.data.length) {
        return;
    }

    this.state.actions.data[index] = new ImportAction(data);

    this.validateSubmit(this.state);
};

/** Action 'delete' event handler */
ImportRuleForm.prototype.onActionDelete = function (index) {
    if (index < 0 || index >= this.state.actions.data.length) {
        return;
    }

    this.state.actions.data.splice(index, 1);

    this.render(this.state);
};

/** Set data for list container */
ImportRuleForm.prototype.setListContainerData = function (container, data, noDataMessage) {
    var noDataMsgElem;
    var message;

    if (!container) {
        throw new Error('Invalid list container');
    }

    message = (typeof noDataMessage === 'string')
        ? noDataMessage
        : 'No data';

    removeChilds(container);
    if (Array.isArray(data) && data.length > 0) {
        data.forEach(function (item) {
            container.appendChild(item.elem);
        }, this);
    } else {
        noDataMsgElem = ce('span', { className: 'nodata-message', textContent: message });
        container.appendChild(noDataMsgElem);
    }
};

/** Validate rule data and enable/disable submit button */
ImportRuleForm.prototype.validateActionsAvail = function (state) {
    var isAvail = this.getNextAvailAction(state);

    enable(this.createActionBtn, !!isAvail);
};

/** Validate rule data and enable/disable submit button */
ImportRuleForm.prototype.validateSubmit = function (state) {
    var isValid = this.isValidRule(state);
    enable(this.saveBtn, isValid);
};

/** Render component state */
ImportRuleForm.prototype.render = function (state) {
    var actionItems;
    var conditionItems;

    if (!state) {
        throw new Error('Invalid state');
    }

    this.idInput.value = (state.ruleId) ? (state.ruleId) : '';

    this.validateActionsAvail(state);
    this.validateSubmit(state);

    // Actions
    if (state.actionsCollapsed) {
        this.formActions.classList.add('collapsed');
    } else {
        this.formActions.classList.remove('collapsed');
    }
    actionItems = state.actions.data.map(function (action, index) {
        var res = new ImportActionForm({
            parent: this,
            data: action,
            currencyModel: this.model.currency,
            accountModel: this.model.accounts,
            personModel: this.model.persons,
            update: this.onActionUpdate.bind(this, index),
            remove: this.onActionDelete.bind(this, index)
        });
        return res;
    }, this);
    this.setListContainerData(this.formActionsContainer, actionItems, 'No actions');
    // Conditions
    if (state.conditionsCollapsed) {
        this.formConditions.classList.add('collapsed');
    } else {
        this.formConditions.classList.remove('collapsed');
    }
    conditionItems = state.conditions.data.map(function (condition, index) {
        var res = new ImportConditionForm({
            parent: this,
            data: condition,
            tplModel: this.model.template,
            currencyModel: this.model.currency,
            accountModel: this.model.accounts,
            personModel: this.model.persons,
            update: this.onConditionUpdate.bind(this, index),
            remove: this.onConditionDelete.bind(this, index)
        });
        return res;
    }, this);
    this.setListContainerData(this.conditionsContainer, conditionItems, 'No conditions');
};
