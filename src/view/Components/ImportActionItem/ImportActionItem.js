import { ce } from 'jezvejs';
import { AppComponent } from '../AppComponent/AppComponent.js';
import {
    ImportAction,
    IMPORT_ACTION_SET_TR_TYPE,
    IMPORT_ACTION_SET_ACCOUNT,
    IMPORT_ACTION_SET_PERSON,
} from '../../js/model/ImportAction.js';
import './style.css';

/**
 * ImportActionItem component
 * @param {Object} props
 */
export class ImportActionItem extends AppComponent {
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

    /** Shortcut for ImportActionItem constructor */
    static create(props) {
        var res;

        try {
            res = new ImportActionItem(props);
        } catch (e) {
            res = null;
        }

        return res;
    }

    /** Component initialization */
    init() {
        this.actionTypeLabel = ce('span', { className: 'action-item__type' });
        this.valueLabel = ce('span', { className: 'action-item__value' });

        this.elem = this.createContainer('action-item', [
            this.actionTypeLabel,
            this.valueLabel
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
            value: data.value
        };

        this.render(this.state);
    }

    /** Return import action object */
    getData() {
        const res = {
            action_id: this.state.actionType,
            value: this.state.value
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
            const item = this.model.accounts.getItem(state.value);
            if (!item) {
                throw new Error('Account not found');
            }

            value = item.name;
        } else if (state.actionType === IMPORT_ACTION_SET_PERSON) {
            const item = this.model.persons.getItem(state.value);
            if (!item) {
                throw new Error('Person not found');
            }

            value = item.name;
        } else {
            value = state.value;
        }

        this.valueLabel.textContent = value;
    }
}
