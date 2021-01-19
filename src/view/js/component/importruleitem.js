'use strict';

/* global ce, isFunction, show, extend, AppComponent */
/* global copyObject, addChilds, removeChilds */
/* global ImportRule, ImportActionList, ImportActionItem */
/* global ImportConditionList, ImportConditionItem */

/**
 * ImportRuleItem component constructor
 * @param {Object} props
 */
function ImportRuleItem() {
    ImportRuleItem.parent.constructor.apply(this, arguments);

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

    if (!(this.props.data instanceof ImportRule)) {
        throw new Error('Invalid rule item');
    }

    this.init();
    this.setData(this.props.data);
}

extend(ImportRuleItem, AppComponent);

/** Shortcut for ImportRuleItem constructor */
ImportRuleItem.create = function (props) {
    var res;

    try {
        res = new ImportRuleItem(props);
    } catch (e) {
        res = null;
    }

    return res;
};

/** Main structure initialization */
ImportRuleItem.prototype.init = function () {
    this.propertyLabel = ce('span', { className: 'rule-item__property' });
    this.operatorLabel = ce('span', { className: 'rule-item__operator' });
    this.valueLabel = ce('span', { className: 'rule-item__value' });
    this.infoLabel = ce('span', { className: 'rule-item__info' });

    // Delete button
    this.updateBtn = ce(
        'button',
        { className: 'btn icon-btn update-btn', type: 'button' },
        this.createIcon('update'),
        { click: this.onUpdate.bind(this) }
    );
    // Delete button
    this.delBtn = ce(
        'button',
        { className: 'btn icon-btn delete-btn', type: 'button' },
        this.createIcon('del'),
        { click: this.onDelete.bind(this) }
    );
    // Toggle expand/collapse
    this.toggleExtBtn = ce(
        'button',
        { className: 'btn icon-btn toggle-btn', type: 'button' },
        this.createIcon('toggle-ext')
    );

    this.topRow = this.createContainer('rule-item__main-top', [
        this.propertyLabel,
        this.operatorLabel,
        this.valueLabel
    ]);
    this.bottomRow = this.createContainer('rule-item__main-bottom', [
        this.infoLabel
    ]);

    this.infoContainer = this.createContainer('rule-item__main-info', [
        this.topRow,
        this.bottomRow
    ]);

    this.controls = this.createContainer('rule-item__main-controls', [
        this.updateBtn,
        this.delBtn,
        this.toggleExtBtn
    ]);

    this.conditionsHeader = ce('label', { className: 'rule-item__header', textContent: 'Conditions' });
    this.conditionsContainer = this.createContainer('rule-item__conditions', []);

    this.actionsHeader = ce('label', { className: 'rule-item__header', textContent: 'Actions' });
    this.actionsContainer = this.createContainer('rule-item__actions', []);

    this.dataContainer = this.createContainer('rule-item__ext', [
        this.conditionsHeader,
        this.conditionsContainer,
        this.actionsHeader,
        this.actionsContainer
    ]);

    this.headerContainer = this.createContainer(
        'rule-item__main',
        [this.infoContainer, this.controls],
        { click: this.toggleCollapse.bind(this) }
    );

    this.elem = this.createContainer('rule-item', [
        this.headerContainer,
        this.dataContainer
    ]);
};

/** Toggle expand/collapse button 'click' event handler */
ImportRuleItem.prototype.toggleCollapse = function () {
    this.state.expanded = !this.state.expanded;

    this.render(this.state);
};

/** Set main state of component */
ImportRuleItem.prototype.setData = function (data) {
    if (!data) {
        throw new Error('Invalid data');
    }

    this.state = {
        expanded: false,
        ruleId: data.id,
        conditions: data.conditions,
        actions: data.actions
    };

    this.render(this.state);
};

/** Return import rule object */
ImportRuleItem.prototype.getData = function () {
    var res = {
        flags: 0
    };

    if (this.state.ruleId) {
        res.id = this.state.ruleId;
    }

    res.actions = copyObject(this.state.actions);
    res.conditions = copyObject(this.state.conditions);

    return res;
};

/** Update button 'click' event handler */
ImportRuleItem.prototype.onUpdate = function (e) {
    e.stopPropagation();

    if (!this.state.ruleId
        || !isFunction(this.updateHandler)) {
        return;
    }

    this.updateHandler(this.state.ruleId);
};

/** Delete button 'click' event handler */
ImportRuleItem.prototype.onDelete = function (e) {
    e.stopPropagation();

    if (!this.state.ruleId
        || !isFunction(this.deleteHandler)) {
        return;
    }

    this.deleteHandler(this.state.ruleId);
};

/** Set data for list container */
ImportRuleItem.prototype.setListContainerData = function (container, data) {
    var isValid;

    if (!container) {
        throw new Error('Invalid list container');
    }

    removeChilds(container);
    isValid = (Array.isArray(data) && data.length > 0);
    if (isValid) {
        addChilds(container, data.map(function (item) {
            return item.elem;
        }));
    }

    show(container, isValid);
};

/** Render component state */
ImportRuleItem.prototype.render = function (state) {
    var firstCondition;
    var conditionsTitle;
    var actionsTitle;
    var conditionItems;
    var actionItems;

    if (!state
        || !(state.actions instanceof ImportActionList)
        || !(state.conditions instanceof ImportConditionList)
    ) {
        throw new Error('Invalid state');
    }

    if (state.ruleId) {
        this.elem.setAttribute('data-id', state.ruleId);
    }

    if (state.expanded) {
        this.elem.classList.add('rule-item_expanded');
    } else {
        this.elem.classList.remove('rule-item_expanded');
    }

    // Render conditions
    conditionItems = state.conditions.map(function (item) {
        var res = new ImportConditionItem({
            parent: this,
            data: item,
            tplModel: this.model.templates,
            currencyModel: this.model.currency,
            accountModel: this.model.accounts,
            personModel: this.model.persons
        });

        return res;
    }, this);
    show(this.conditionsHeader, (conditionItems.length > 0));
    this.setListContainerData(this.conditionsContainer, conditionItems);

    show(this.operatorLabel, (conditionItems.length > 0));
    show(this.valueLabel, (conditionItems.length > 0));

    if (!state.actions.data.length) {
        actionsTitle = 'No actions.';
    } else {
        actionsTitle = state.actions.length + ' action(s).';
    }

    if (conditionItems.length > 0) {
        firstCondition = conditionItems[0];

        this.propertyLabel.textContent = firstCondition.propertyLabel.textContent;
        this.operatorLabel.textContent = firstCondition.operatorLabel.textContent;

        if (firstCondition.state.isFieldValue) {
            this.valueLabel.classList.add('rule-item__value-property');
            this.valueLabel.classList.remove('rule-item__value');
        } else {
            this.valueLabel.classList.remove('rule-item__value-property');
            this.valueLabel.classList.add('rule-item__value');
        }

        this.valueLabel.textContent = firstCondition.valueLabel.textContent;
    } else {
        this.propertyLabel.textContent = 'No conditions';
    }

    if (conditionItems.length > 1) {
        conditionsTitle = (conditionItems.length - 1) + ' more condition(s).';

        this.infoLabel.textContent = conditionsTitle + ' ' + actionsTitle;
    } else {
        this.infoLabel.textContent = actionsTitle;
    }

    // Render actions
    actionItems = state.actions.map(function (item) {
        var res = new ImportActionItem({
            parent: this,
            data: item,
            currencyModel: this.model.currency,
            accountModel: this.model.accounts,
            personModel: this.model.persons
        });

        return res;
    }, this);
    show(this.actionsHeader, (actionItems.length > 0));
    this.setListContainerData(this.actionsContainer, actionItems);
};
