import { createElement, ge } from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import { __ } from '../../../../utils/utils.js';
import { API } from '../../../../API/index.js';
import { ProfileDialog } from '../ProfileDialog/ProfileDialog.js';

/* CSS classes */
const DIALOG_CLASS = 'reset-dialog';
const COLUMN_CONTAINER_CLASS = 'column-container';

const resetOptions = {
    accountsCheck: {
        name: 'accounts',
        titleToken: 'profile.reset.accounts',
    },
    personsCheck: {
        name: 'persons',
        titleToken: 'profile.reset.persons',
    },
    categoriesCheck: {
        name: 'categories',
        titleToken: 'profile.reset.categories',
    },
    transactionsCheck: {
        name: 'transactions',
        titleToken: 'profile.reset.transactions',
    },
    keepBalanceCheck: {
        name: 'keepbalance',
        titleToken: 'profile.reset.keepBalance',
        isSuboption: true,
    },
    scheduleCheck: {
        name: 'schedule',
        titleToken: 'profile.reset.schedule',
    },
    importTplCheck: {
        name: 'importtpl',
        titleToken: 'profile.reset.importTemplates',
    },
    importRulesCheck: {
        name: 'importrules',
        titleToken: 'profile.reset.importRules',
    },
};

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

        this.resetAllCheck = Checkbox.create({
            id: 'resetAllCheck',
            label: __('profile.reset.all'),
            onChange: () => this.onToggleAll(),
        });
        const children = [this.resetAllCheck.elem];

        Object.entries(resetOptions).forEach(([id, props]) => {
            this[id] = Checkbox.create({
                id,
                className: (props.isSuboption) ? 'suboption' : null,
                name: props.name,
                label: __(props.titleToken),
                onChange: () => this.onChange(),
            });
            children.push(this[id].elem);
        });

        this.initDialog({
            id: 'reset_popup',
            title: __('profile.resetData'),
            className: DIALOG_CLASS,
        });

        const columnContainer = createElement('div', {
            props: { className: COLUMN_CONTAINER_CLASS },
            children,
        });
        this.form.prepend(columnContainer);

        this.reset();
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
            schedule: false,
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
            schedule: this.scheduleCheck.checked,
            importTpl: this.importTplCheck.checked,
            importRules: this.importRulesCheck.checked,
        };

        state.resetAll = (
            state.accounts
            && state.persons
            && state.categories
            && state.transactions
            && state.schedule
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
        if (state.schedule) {
            request.schedule = true;
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

        this.scheduleCheck.check(state.schedule);

        this.importTplCheck.check(state.importTpl);
        this.importRulesCheck.check(state.importRules);
    }
}
