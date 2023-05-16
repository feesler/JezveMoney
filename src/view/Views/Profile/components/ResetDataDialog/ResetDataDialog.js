import { ge } from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import { __ } from '../../../../utils/utils.js';
import { API } from '../../../../API/index.js';
import { ProfileDialog } from '../ProfileDialog/ProfileDialog.js';

/* CSS classes */
const DIALOG_CLASS = 'reset-dialog';

export class ResetDataDialog extends ProfileDialog {
    constructor(...args) {
        super(...args);

        this.init();
    }

    init() {
        this.elem = ge('reset');
        if (!this.elem) {
            throw new Error('Failed to initialize Reset data form');
        }

        this.resetAllCheck = Checkbox.fromElement(ge('resetAllCheck'), {
            onChange: () => this.onToggleAll(),
        });

        const checkboxProps = { onChange: () => this.onChange() };
        this.accountsCheck = Checkbox.fromElement(ge('accountsCheck'), checkboxProps);
        this.personsCheck = Checkbox.fromElement(ge('personsCheck'), checkboxProps);
        this.categoriesCheck = Checkbox.fromElement(ge('categoriesCheck'), checkboxProps);
        this.transactionsCheck = Checkbox.fromElement(ge('transactionsCheck'), checkboxProps);
        this.keepBalanceCheck = Checkbox.fromElement(ge('keepBalanceCheck'), checkboxProps);
        this.scheduleCheck = Checkbox.fromElement(ge('scheduleCheck'), checkboxProps);
        this.importTplCheck = Checkbox.fromElement(ge('importTplCheck'), checkboxProps);
        this.importRulesCheck = Checkbox.fromElement(ge('importRulesCheck'), checkboxProps);

        this.initDialog({
            id: 'reset_popup',
            title: __('PROFILE_RESET_DATA'),
            className: DIALOG_CLASS,
        });
    }

    /** Reset dialog state */
    reset() {
        super.reset();

        this.setState({
            resetAll: false,
            accounts: false,
            persons: false,
            categories: false,
            transactions: false,
            keepBalance: false,
            enableKeepBalance: false,
            scheduledTransactions: false,
            importTpl: false,
            importRules: false,
            loading: false,
        });
    }

    /** 'Reset all' checkbox 'change' event handler */
    onToggleAll() {
        const resetAll = this.resetAllCheck.checked;
        const state = {
            ...this.state,
            resetAll,
            accounts: resetAll,
            persons: resetAll,
            categories: resetAll,
            transactions: resetAll,
            importTpl: resetAll,
            importRules: resetAll,
        };
        if (resetAll) {
            state.enableKeepBalance = false;
        }

        this.setState(state);
    }

    /** Reset data form change handler */
    onChange() {
        const state = {
            ...this.state,
            accounts: this.accountsCheck.checked,
            persons: this.personsCheck.checked,
            categories: this.categoriesCheck.checked,
            transactions: this.transactionsCheck.checked,
            keepBalance: this.keepBalanceCheck.checked,
            scheduledTransactions: this.scheduleCheck.checked,
            importTpl: this.importTplCheck.checked,
            importRules: this.importRulesCheck.checked,
        };

        state.resetAll = (
            state.accounts
            && state.persons
            && state.categories
            && state.transactions
            && state.scheduledTransactions
            && state.importTpl
            && state.importRules
        );

        state.enableKeepBalance = (
            !(state.accounts && state.persons)
            && state.transactions
        );

        this.setState(state);
    }

    async sendFormRequest() {
        const { state } = this;
        const request = {};

        if (state.accounts) {
            request.accounts = true;
        }
        if (state.persons) {
            request.persons = true;
        }
        if (state.categories) {
            request.categories = true;
        }
        if (state.transactions) {
            request.transactions = true;
        }
        if (state.enableKeepBalance && state.keepBalance) {
            request.keepbalance = true;
        }
        if (state.scheduledTransactions) {
            request.scheduledTransactions = true;
        }
        if (state.importTpl) {
            request.importtpl = true;
        }
        if (state.importRules) {
            request.importrules = true;
        }

        return API.profile.reset(request);
    }

    /** Render component state */
    renderDialog(state) {
        this.accountsCheck.check(state.accounts);
        this.personsCheck.check(state.persons);
        this.categoriesCheck.check(state.categories);
        this.transactionsCheck.check(state.transactions);

        this.keepBalanceCheck.check(state.keepBalance);
        this.keepBalanceCheck.enable(state.enableKeepBalance);

        this.scheduleCheck.check(state.scheduledTransactions);

        this.importTplCheck.check(state.importTpl);
        this.importRulesCheck.check(state.importRules);
    }
}
