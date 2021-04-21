'use strict';

/* global ce, extend, AppComponent */
/* global ImportAction */
/* global IMPORT_ACTION_SET_TR_TYPE, IMPORT_ACTION_SET_ACCOUNT, IMPORT_ACTION_SET_PERSON */

/**
 * ImportActionItem component constructor
 * @param {Object} props
 */
function ImportActionItem() {
    ImportActionItem.parent.constructor.apply(this, arguments);

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

    this.model = {
        currency: this.props.currencyModel,
        accounts: this.props.accountModel,
        persons: this.props.personModel
    };

    this.actionTypes = ImportAction.getTypes();
    this.transactionTypes = ImportAction.getTransactionTypes();

    this.init();
    this.setData(this.props.data);
}

extend(ImportActionItem, AppComponent);

/** Shortcut for ImportActionItem constructor */
ImportActionItem.create = function (props) {
    var res;

    try {
        res = new ImportActionItem(props);
    } catch (e) {
        res = null;
    }

    return res;
};

/** Component initialization */
ImportActionItem.prototype.init = function () {
    this.actionTypeLabel = ce('span', { className: 'action-item__type' });
    this.valueLabel = ce('span', { className: 'action-item__value' });

    this.elem = this.createContainer('action-item', [
        this.actionTypeLabel,
        this.valueLabel
    ]);
};

/** Set data for component */
ImportActionItem.prototype.setData = function (data) {
    if (!data) {
        throw new Error('Invalid data');
    }

    this.state = {
        actionId: data.id,
        actionType: data.action_id,
        value: data.value
    };

    this.render(this.state);
};

/** Return import action object */
ImportActionItem.prototype.getData = function () {
    var res = {
        action_id: this.state.actionType,
        value: this.state.value
    };

    if (this.state.actionId) {
        res.id = this.state.actionId;
    }

    return res;
};

/** Render component state */
ImportActionItem.prototype.render = function (state) {
    var actionType;
    var item;
    var value;

    if (!state) {
        throw new Error('Invalid state');
    }

    actionType = ImportAction.getActionById(state.actionType);
    if (!actionType) {
        throw new Error('Action not found');
    }

    this.actionTypeLabel.textContent = actionType.title;

    if (state.actionType === IMPORT_ACTION_SET_TR_TYPE) {
        item = ImportAction.getTransactionTypeById(state.value);
        if (!item) {
            throw new Error('Invalid transaction type');
        }

        value = item.title;
    } else if (state.actionType === IMPORT_ACTION_SET_ACCOUNT) {
        item = this.model.accounts.getItem(state.value);
        if (!item) {
            throw new Error('Account not found');
        }

        value = item.name;
    } else if (state.actionType === IMPORT_ACTION_SET_PERSON) {
        item = this.model.persons.getItem(state.value);
        if (!item) {
            throw new Error('Person not found');
        }

        value = item.name;
    } else {
        value = state.value;
    }

    this.valueLabel.textContent = value;
};
