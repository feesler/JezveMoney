'use strict';

/* global ce, enable, isFunction, extend, AppComponent, View */
/* global copyObject, removeChilds */
/* global ImportRule, ImportAction, ImportActionForm */
/* global ImportCondition, ImportConditionForm */

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

    this.parentView = (this.parent instanceof View)
        ? this.parent
        : this.parent.parentView;

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
    this.transactionTypes = ImportAction.getTransactionTypes();

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

    // Invalid feedback message
    this.validFeedback = ce('div', { className: 'invalid-feedback' });
    this.feedbackContainer = this.createContainer(
        'rule-form__feedback validation-block',
        this.validFeedback
    );

    this.controls = this.createContainer('rule-form__controls', [
        this.saveBtn,
        this.cancelBtn
    ]);

    this.elem = this.createContainer('rule-form', [
        this.idInput,
        this.formConditions,
        this.formActions,
        this.feedbackContainer,
        this.controls
    ]);
};

/** Set main state of component */
ImportRuleForm.prototype.setData = function (data) {
    if (!data) {
        throw new Error('Invalid data');
    }

    this.state = {
        rule: data,
        conditionsCollapsed: false,
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
    ruleActionTypes = state.rule.actions.map(function (action) {
        return action.action_id;
    });
    // Search for first action type not in list
    return this.actionTypes.find(function (actionType) {
        return !ruleActionTypes.includes(actionType.id);
    });
};

/** Return default value for specified action type */
ImportRuleForm.prototype.getActionDefaultValue = function (actionTypeId) {
    var item;
    var actionType = parseInt(actionTypeId, 10);
    if (!actionType) {
        throw new Error('Invalid action type');
    }

    if (ImportAction.isTransactionTypeValue(actionType)) {
        item = this.transactionTypes[0];
        return item.id;
    }

    if (ImportAction.isAccountValue(actionType)) {
        item = this.model.accounts.getItemByIndex(0);
        if (!item) {
            throw new Error('No accounts available');
        }

        return item.id;
    }

    if (ImportAction.isPersonValue(actionType)) {
        item = this.model.persons.getItemByIndex(0);
        if (!item) {
            throw new Error('No persons available');
        }

        return item.id;
    }

    return '';
};

/** Create action button 'click' event handler */
ImportRuleForm.prototype.onCreateActionClick = function (e) {
    var actionType;
    var actionData;

    e.stopPropagation();

    actionType = this.getNextAvailAction(this.state);
    if (!actionType) {
        return;
    }

    actionData = {
        action_id: actionType.id,
        value: this.getActionDefaultValue(actionType.id)
    };

    this.state.rule.actions.addItem(actionData);

    this.state.conditionsCollapsed = true;
    this.state.actionsCollapsed = false;
    this.state.validation = null;

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
    ruleFieldTypes = state.rule.conditions.map(function (condition) {
        return condition.field_id;
    });
    // Filter available field types
    availFields = this.fieldTypes.filter(function (fieldType) {
        if (ImportCondition.isTemplateField(fieldType.id)) {
            return false;
        }

        return true;
    }, this);

    // Search for first field type not in list
    return availFields.find(function (fieldType) {
        return !ruleFieldTypes.includes(fieldType.id);
    });
};

/** Return default condition value for specified field type */
ImportRuleForm.prototype.getConditionDefaultValue = function (fieldId) {
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
    var conditionData;

    e.stopPropagation();

    fieldType = this.getNextAvailProperty(this.state);
    if (!fieldType) {
        return;
    }

    conditionData = {
        field_id: fieldType.id,
        operator: fieldType.operators[0],
        value: this.getConditionDefaultValue(fieldType.id),
        flags: 0
    };

    this.state.rule.conditions.addItem(conditionData);

    this.state.conditionsCollapsed = false;
    this.state.actionsCollapsed = true;
    this.state.validation = null;

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

    if (state.rule.id) {
        res.id = state.rule.id;
    }

    res.conditions = copyObject(state.rule.conditions.data);
    res.actions = copyObject(state.rule.actions.data);

    return res;
};

/** Validate import rule from state object */
ImportRuleForm.prototype.validateRule = function () {
    var validation = this.state.rule.validate();

    this.state.validation = validation;

    if (validation && !validation.valid) {
        if ('conditionIndex' in validation) {
            this.state.conditionsCollapsed = false;
            this.state.actionsCollapsed = true;
        } else if ('actionIndex' in validation) {
            this.state.conditionsCollapsed = true;
            this.state.actionsCollapsed = false;
        }
    }

    this.render(this.state);
};

/** Save button 'click' event handler */
ImportRuleForm.prototype.onSubmit = function () {
    this.validateRule();
    if (!this.state.validation.valid) {
        return;
    }

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
    this.state.rule.conditions.updateItemByIndex(index, data);
};

/** Condition 'delete' event handler */
ImportRuleForm.prototype.onConditionDelete = function (index) {
    this.state.rule.conditions.deleteItemByIndex(index);
    this.state.validation = null;
    this.render(this.state);
};

/** Action 'update' event handler */
ImportRuleForm.prototype.onActionUpdate = function (index, data) {
    this.state.rule.actions.updateItemByIndex(index, data);
};

/** Action 'delete' event handler */
ImportRuleForm.prototype.onActionDelete = function (index) {
    this.state.rule.actions.deleteItemByIndex(index);
    this.state.validation = null;
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

/** Render component state */
ImportRuleForm.prototype.render = function (state) {
    var actionItems;
    var conditionItems;

    if (!state) {
        throw new Error('Invalid state');
    }

    this.idInput.value = (state.rule.id) ? state.rule.id : '';

    this.validateActionsAvail(state);

    if (state.validation
        && !state.validation.valid
        && !('conditionIndex' in state.validation)
        && !('actionIndex' in state.validation)
    ) {
        this.validFeedback.textContent = state.validation.message;
        this.parentView.invalidateBlock(this.feedbackContainer);
    } else {
        this.validFeedback.textContent = '';
        this.parentView.clearBlockValidation(this.feedbackContainer);
    }

    // Actions
    if (state.actionsCollapsed) {
        this.formActions.classList.add('collapsed');
    } else {
        this.formActions.classList.remove('collapsed');
    }
    actionItems = state.rule.actions.map(function (action, index) {
        var props = {
            parent: this,
            data: action,
            isValid: true,
            currencyModel: this.model.currency,
            accountModel: this.model.accounts,
            personModel: this.model.persons,
            update: this.onActionUpdate.bind(this, index),
            remove: this.onActionDelete.bind(this, index)
        };

        if (state.validation
            && !state.validation.valid
            && state.validation.actionIndex === index
        ) {
            props.isValid = false;
            props.message = state.validation.message;
        }

        return new ImportActionForm(props);
    }, this);
    this.setListContainerData(this.formActionsContainer, actionItems, 'No actions');
    // Conditions
    if (state.conditionsCollapsed) {
        this.formConditions.classList.add('collapsed');
    } else {
        this.formConditions.classList.remove('collapsed');
    }
    conditionItems = state.rule.conditions.map(function (condition, index) {
        var props = {
            parent: this,
            data: condition,
            isValid: true,
            tplModel: this.model.template,
            currencyModel: this.model.currency,
            accountModel: this.model.accounts,
            personModel: this.model.persons,
            update: this.onConditionUpdate.bind(this, index),
            remove: this.onConditionDelete.bind(this, index)
        };

        if (state.validation
            && !state.validation.valid
            && state.validation.conditionIndex === index) {
            props.isValid = false;
            props.message = state.validation.message;
        }

        return new ImportConditionForm(props);
    }, this);
    this.setListContainerData(this.conditionsContainer, conditionItems, 'No conditions');
};
