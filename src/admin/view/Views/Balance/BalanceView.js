import 'jezvejs/style';
import { asArray } from 'jezvejs';
import { DropDown } from 'jezvejs/DropDown';
import { Application } from '../../../../view/Application/Application.js';
import '../../../../view/Application/Application.scss';
import { AdminView } from '../../utils/AdminView/AdminView.js';
import '../../utils/AdminView/AdminView.scss';
import './BalanceView.scss';

/**
 * Admin balance view
 */
class AdminBalanceView extends AdminView {
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
            elem: 'acc_id',
            placeholder: 'Select account',
            enableFilter: true,
            onChange: (o) => this.onAccountChange(o),
            className: 'dd_fullwidth',
        });
    }

    /**
     * Account change event handler
     * @param {object} obj - selection object
     */
    onAccountChange(obj) {
        // Check all accounts from the new selection present in current selection
        const data = asArray(obj);
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
        const res = new URL('admin/balance/', window.app.baseURL);
        const { filter } = state;

        Object.keys(filter).forEach((prop) => {
            const value = filter[prop];
            if (Array.isArray(value)) {
                const arrProp = `${prop}[]`;
                value.forEach((item) => res.searchParams.append(arrProp, item));
            } else {
                res.searchParams.set(prop, value);
            }
        });

        return res.toString();
    }

    requestTransactions(state) {
        window.location = this.buildAddress(state);
    }
}

window.app = new Application(window.appProps);
window.app.createView(AdminBalanceView);
