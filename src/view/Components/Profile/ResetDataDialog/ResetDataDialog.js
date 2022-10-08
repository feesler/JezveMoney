import {
    ge,
    show,
    setEvents,
    Component,
} from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import { Popup } from 'jezvejs/Popup';
import { API } from '../../../js/api/index.js';
import { LoadingIndicator } from '../../LoadingIndicator/LoadingIndicator.js';
import './style.scss';

/* CSS classes */
const DIALOG_CLASS = 'reset-dialog';
/* Strings */
const DIALOG_TITLE = 'Reset data';

export class ResetDataDialog extends Component {
    static create(props) {
        return new ResetDataDialog(props);
    }

    constructor(...args) {
        super(...args);

        this.init();
    }

    init() {
        this.elem = ge('reset');
        this.form = this.elem?.querySelector('form');
        if (!this.elem || !this.form) {
            throw new Error('Failed to initialize Reset data form');
        }

        setEvents(this.form, { submit: (e) => this.onSubmit(e) });

        this.popup = Popup.create({
            id: 'reset_popup',
            title: DIALOG_TITLE,
            content: this.elem,
            className: DIALOG_CLASS,
            btn: {
                okBtn: { value: 'Submit', onclick: (e) => this.onSubmit(e) },
                closeBtn: true,
            },
            onclose: () => this.reset(),
        });
        show(this.elem, true);

        this.resetAllCheck = Checkbox.fromElement(ge('resetAllCheck'), {
            onChange: () => this.onToggleAll(),
        });

        const checkboxProps = { onChange: () => this.onChange() };

        this.accountsCheck = Checkbox.fromElement(ge('accountsCheck'), checkboxProps);
        this.personsCheck = Checkbox.fromElement(ge('personsCheck'), checkboxProps);
        this.transactionsCheck = Checkbox.fromElement(ge('transactionsCheck'), checkboxProps);
        this.keepBalanceCheck = Checkbox.fromElement(ge('keepBalanceCheck'), checkboxProps);
        this.importTplCheck = Checkbox.fromElement(ge('importTplCheck'), checkboxProps);
        this.importRulesCheck = Checkbox.fromElement(ge('importRulesCheck'), checkboxProps);

        this.loadingIndicator = LoadingIndicator.create({ fixed: false });
        this.elem.append(this.loadingIndicator.elem);

        this.reset();
    }

    /** Show/hide dialog */
    show(val) {
        this.render(this.state);
        this.popup.show(val);
    }

    /** Hide dialog */
    hide() {
        this.popup.hide();
    }

    /** Reset dialog state */
    reset() {
        this.form.reset();
        this.setState({
            resetAll: false,
            accounts: false,
            persons: false,
            transactions: false,
            keepBalance: false,
            enableKeepBalance: false,
            importTpl: false,
            importRules: false,
            loading: false,
        });
    }

    startLoading() {
        this.setState({ ...this.state, loading: true });
    }

    stopLoading() {
        this.setState({ ...this.state, loading: false });
    }

    /** 'Reset all' checkbox 'change' event handler */
    onToggleAll() {
        const resetAll = this.resetAllCheck.checked;
        const state = {
            ...this.state,
            resetAll,
            accounts: resetAll,
            persons: resetAll,
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
            transactions: this.transactionsCheck.checked,
            keepBalance: this.keepBalanceCheck.checked,
            importTpl: this.importTplCheck.checked,
            importRules: this.importRulesCheck.checked,
        };

        state.resetAll = (
            state.accounts
            && state.persons
            && state.transactions
            && state.importTpl
            && state.importRules
        );

        state.enableKeepBalance = (
            !(state.accounts && state.persons)
            && state.transactions
        );

        this.setState(state);
    }

    /** Form 'submit' event handler */
    onSubmit(e) {
        e.preventDefault();

        this.requestResetData();
    }

    /** Send reset data API request */
    async requestResetData() {
        this.startLoading();

        const { state } = this;
        const request = {};

        if (state.accounts) {
            request.accounts = true;
        }
        if (state.persons) {
            request.persons = true;
        }
        if (state.transactions) {
            request.transactions = true;
        }
        if (state.enableKeepBalance && state.keepBalance) {
            request.keepbalance = true;
        }
        if (state.importTpl) {
            request.importtpl = true;
        }
        if (state.importRules) {
            request.importrules = true;
        }

        try {
            const result = await API.profile.reset(request);

            this.popup.close();

            if (result.msg) {
                window.app.createMessage(result.msg, 'msg_success');
            }
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
        }

        this.stopLoading();
    }

    /** Render component state */
    render(state) {
        if (state.loading) {
            this.loadingIndicator.show();
        }

        this.accountsCheck.check(state.accounts);
        this.personsCheck.check(state.persons);
        this.transactionsCheck.check(state.transactions);

        this.keepBalanceCheck.check(state.keepBalance);
        this.keepBalanceCheck.enable(state.enableKeepBalance);

        this.importTplCheck.check(state.importTpl);
        this.importRulesCheck.check(state.importRules);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}
