import { Component } from 'jezvejs';
import { createElement } from '@jezvejs/dom';

import { App } from '../../../../../Application/App.js';
import {
    ImportAction,
    IMPORT_ACTION_SET_TR_TYPE,
    IMPORT_ACTION_SET_ACCOUNT,
    IMPORT_ACTION_SET_PERSON,
    IMPORT_ACTION_SET_CATEGORY,
} from '../../../../../Models/ImportAction.js';
import './ImportActionItem.scss';

/**
 * ImportActionItem component
 * @param {Object} props
 */
export class ImportActionItem extends Component {
    constructor(...args) {
        super(...args);

        if (!this.props?.data) {
            throw new Error('Invalid props');
        }

        this.actionTypes = ImportAction.getTypes();
        this.transactionTypes = ImportAction.getTransactionTypes();

        this.init();
        this.setData(this.props.data);
    }

    /** Component initialization */
    init() {
        this.actionTypeLabel = createElement('span', { props: { className: 'action-item__type' } });
        this.valueLabel = createElement('span', { props: { className: 'action-item__value' } });

        this.elem = App.createContainer('action-item', [
            this.actionTypeLabel,
            this.valueLabel,
        ]);
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
        };

        this.render(this.state);
    }

    /** Return import action object */
    getData() {
        const res = {
            action_id: this.state.actionType,
            value: this.state.value,
        };

        if (this.state.actionId) {
            res.id = this.state.actionId;
        }

        return res;
    }

    /** Render component state */
    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        const actionType = ImportAction.getActionById(state.actionType);
        if (!actionType) {
            throw new Error('Action not found');
        }

        this.actionTypeLabel.textContent = actionType.title;

        let value;
        if (state.actionType === IMPORT_ACTION_SET_TR_TYPE) {
            const item = ImportAction.getTransactionTypeById(state.value);
            if (!item) {
                throw new Error('Invalid transaction type');
            }

            value = item.title;
        } else if (state.actionType === IMPORT_ACTION_SET_ACCOUNT) {
            const item = App.model.accounts.getItem(state.value);
            if (!item) {
                throw new Error('Account not found');
            }

            value = item.name;
        } else if (state.actionType === IMPORT_ACTION_SET_PERSON) {
            const item = App.model.persons.getItem(state.value);
            if (!item) {
                throw new Error('Person not found');
            }

            value = item.name;
        } else if (state.actionType === IMPORT_ACTION_SET_CATEGORY) {
            const categoryId = parseInt(state.value, 10);
            const item = App.model.categories.getItem(state.value);
            if (categoryId !== 0 && !item) {
                throw new Error('Category not found');
            }

            value = (categoryId !== 0) ? item.name : '';
        } else {
            value = state.value;
        }

        this.valueLabel.textContent = value;
    }
}
