import 'jezvejs/style';
import {
    urlJoin,
    isEmpty,
} from 'jezvejs';
import { DropDown } from 'jezvejs/DropDown';
import { View } from '../../../../view/js/View.js';
import '../../../../view/css/app.css';
import '../../css/admin.css';
import './style.css';

/**
 * Admin balance view
 */
class AdminBalanceView extends View {
    constructor(...args) {
        super(...args);

        this.state = {
            accounts: [...this.props.accounts],
            filter: { ...this.props.filter },
        };
    }

    /**
     * View initialization
     */
    onStart() {
        this.accountSelect = DropDown.create({
            input_id: 'acc_id',
            placeholder: 'Select account',
            onchange: (o) => this.onAccountChange(o),
            editable: false,
            extraClass: 'dd__fullwidth',
        });
    }

    /**
     * Account change event handler
     * @param {object} obj - selection object
     */
    onAccountChange(obj) {
        // Check all accounts from the new selection present in current selection
        const data = Array.isArray(obj) ? obj : [obj];
        let reloadNeeded = data.some((item) => {
            const id = parseInt(item.id, 10);

            return (
                !this.state.filter.accounts
                || !this.state.filter.accounts.includes(id)
            );
        });

        // Check all currenlty selected accounts present in the new selection
        if (!reloadNeeded) {
            reloadNeeded = this.state.filter.accounts.some(
                (accountId) => !data.find((item) => item.id === accountId),
            );
        }

        if (!reloadNeeded) {
            return;
        }

        // Prepare parameters
        this.state.filter.accounts = data.map((item) => parseInt(item.id, 10));
        this.requestTransactions(this.state);
    }

    /**
     * Build new location address from current filter
     */
    buildAddress(state) {
        const { baseURL } = window.app;
        let newLocation = `${baseURL}admin/balance/`;
        const locFilter = { ...state.filter };

        if ('accounts' in locFilter) {
            if (!Array.isArray(locFilter.accounts)) {
                locFilter.accounts = [locFilter.accounts];
            }

            if (!locFilter.accounts.length) {
                delete locFilter.accounts;
            }
        }

        if (!isEmpty(locFilter)) {
            newLocation += `?${urlJoin(locFilter)}`;
        }

        return newLocation;
    }

    requestTransactions(state) {
        window.location = this.buildAddress(state);
    }
}

window.view = new AdminBalanceView(window.app);
