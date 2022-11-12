import 'jezvejs/style';
import 'jezvejs/style/InputGroup';
import {
    ge,
    isNum,
    setEvents,
    insertAfter,
    enable,
    show,
} from 'jezvejs';
import { DropDown } from 'jezvejs/DropDown';
import { DecimalInput } from 'jezvejs/DecimalInput';
import { Spinner } from 'jezvejs/Spinner';
import { normalize } from '../../js/utils.js';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';
import { API } from '../../js/api/index.js';
import { IconList } from '../../js/model/IconList.js';
import { AccountList } from '../../js/model/AccountList.js';
import { CurrencyList } from '../../js/model/CurrencyList.js';
import { AccountTile } from '../../Components/AccountTile/AccountTile.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { IconButton } from '../../Components/IconButton/IconButton.js';
import { createStore } from '../../js/store.js';
import { actions, reducer } from './reducer.js';

const TITLE_ACCOUNT_DELETE = 'Delete account';
const MSG_ACCOUNT_DELETE = 'Are you sure want to delete selected account?<br>All income and expense transactions history will be lost. Transfer to this account will be changed to expense. Transfer from this account will be changed to income.';
const TITLE_NEW_ACCOUNT = 'New account';
const MSG_EMPTY_NAME = 'Input name.';
const MSG_EXISTING_NAME = 'Account with this name already exist.';

/**
 * Create/update account view
 */
class AccountView extends View {
    constructor(...args) {
        super(...args);

        const initialState = {
            nameChanged: false,
            validation: {
                initbalance: true,
                name: true,
                valid: true,
            },
            submitStarted: false,
        };

        if (this.props.account) {
            initialState.original = this.props.account;
            initialState.data = { ...initialState.original };
            initialState.data.fInitBalance = normalize(initialState.data.initbalance);
        }

        window.app.loadModel(CurrencyList, 'currency', window.app.props.currency);
        window.app.loadModel(AccountList, 'accounts', window.app.props.accounts);
        window.app.loadModel(IconList, 'icons', window.app.props.icons);

        this.store = createStore(reducer, initialState);
        this.store.subscribe((state, prevState) => {
            if (state !== prevState) {
                this.render(state, prevState);
            }
        });
    }

    /**
     * View initialization
     */
    onStart() {
        const state = this.store.getState();

        this.form = ge('accForm');
        this.currencySign = ge('currsign');
        this.balanceInp = ge('balance');
        this.nameInp = ge('accname');
        this.nameFeedback = ge('namefeedback');
        this.submitBtn = ge('submitBtn');
        this.cancelBtn = ge('cancelBtn');
        if (
            !this.form
            || !this.currencySign
            || !this.balanceInp
            || !this.nameInp
            || !this.nameFeedback
            || !this.submitBtn
            || !this.cancelBtn
        ) {
            throw new Error('Failed to initialize Account view');
        }

        this.tile = AccountTile.fromElement('acc_tile', {
            account: state.data,
        });
        this.iconSelect = DropDown.create({
            elem: 'icon',
            onitemselect: (o) => this.onIconSelect(o),
            className: 'dd_fullwidth',
        });
        this.currencySelect = DropDown.create({
            elem: 'currency',
            onitemselect: (o) => this.onCurrencySelect(o),
            className: 'dd_fullwidth',
        });
        window.app.initCurrencyList(this.currencySelect);
        if (state.original.curr_id) {
            this.currencySelect.selectItem(state.original.curr_id);
        }

        this.initBalanceDecimalInput = DecimalInput.create({
            elem: this.balanceInp,
            digits: 2,
            oninput: (e) => this.onInitBalanceInput(e),
        });
        if (!this.initBalanceDecimalInput) {
            throw new Error('Failed to initialize Account view');
        }

        setEvents(this.form, { submit: (e) => this.onSubmit(e) });
        setEvents(this.nameInp, { input: (e) => this.onNameInput(e) });

        this.spinner = Spinner.create();
        this.spinner.hide();
        insertAfter(this.spinner.elem, this.cancelBtn);

        // Update mode
        if (state.original.id) {
            this.deleteBtn = IconButton.fromElement('del_btn', {
                onClick: () => this.confirmDelete(),
            });
        }

        this.render(state);
    }

    /** Icon select event handler */
    onIconSelect(obj) {
        if (!obj) {
            return;
        }

        this.store.dispatch(actions.changeIcon(obj.id));
    }

    /** Currency select event handler */
    onCurrencySelect(obj) {
        if (!obj) {
            return;
        }

        this.store.dispatch(actions.changeCurrency(obj.id));
    }

    /** Initial balance input event handler */
    onInitBalanceInput(e) {
        const { value } = e.target;
        this.store.dispatch(actions.changeInitialBalance(value));
    }

    /** Account name input event handler */
    onNameInput() {
        const { value } = this.nameInp;
        this.store.dispatch(actions.changeName(value));
    }

    /** Form submit event handler */
    onSubmit(e) {
        e.preventDefault();

        const state = this.store.getState();
        if (state.submitStarted) {
            return;
        }

        const { name, initbalance } = state.data;
        if (name.length === 0) {
            this.store.dispatch(actions.invalidateNameField(MSG_EMPTY_NAME));
            this.nameInp.focus();
        } else {
            const account = window.app.model.accounts.findByName(name);
            if (account && state.original.id !== account.id) {
                this.store.dispatch(actions.invalidateNameField(MSG_EXISTING_NAME));
                this.nameInp.focus();
            }
        }

        if (initbalance.length === 0 || !isNum(initbalance)) {
            this.store.dispatch(actions.invalidateInitialBalanceField());
            this.balanceInp.focus();
        }

        const { validation } = this.store.getState();
        if (validation.valid) {
            this.submitAccount();
        }
    }

    async submitAccount() {
        const state = this.store.getState();
        if (state.submitStarted) {
            return;
        }

        this.startSubmit();

        const { data, original } = state;
        const account = {
            name: data.name,
            initbalance: data.initbalance,
            curr_id: data.curr_id,
            icon_id: data.icon_id,
            flags: original.flags,
        };
        const isUpdate = original.id;
        if (isUpdate) {
            account.id = original.id;
        }

        try {
            if (isUpdate) {
                await API.account.update(data);
            } else {
                await API.account.create(data);
            }

            const { baseURL } = window.app;
            window.location = `${baseURL}accounts/`;
        } catch (e) {
            this.cancelSubmit();
            window.app.createMessage(e.message, 'msg_error');
        }
    }

    startSubmit() {
        this.store.dispatch(actions.startSubmit());
    }

    cancelSubmit() {
        this.store.dispatch(actions.cancelSubmit());
    }

    async deleteAccount() {
        const { submitStarted, original } = this.store.getState();
        if (submitStarted || !original.id) {
            return;
        }

        this.startSubmit();

        try {
            await API.account.del({ id: original.id });

            const { baseURL } = window.app;
            window.location = `${baseURL}accounts/`;
        } catch (e) {
            this.cancelSubmit();
            window.app.createMessage(e.message, 'msg_error');
        }
    }

    /** Show account delete confirmation popup */
    confirmDelete() {
        const { data } = this.store.getState();
        if (!data.id) {
            return;
        }

        ConfirmDialog.create({
            id: 'delete_warning',
            title: TITLE_ACCOUNT_DELETE,
            content: MSG_ACCOUNT_DELETE,
            onconfirm: () => this.deleteAccount(),
        });
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        // Render account tile
        const balance = state.original.balance
            + state.data.fInitBalance - state.original.initbalance;

        const name = (!state.original.id && !state.nameChanged)
            ? TITLE_NEW_ACCOUNT
            : state.data.name;

        this.tile.setState((tileState) => ({
            ...tileState,
            account: {
                name,
                balance,
                curr_id: state.data.curr_id,
                icon_id: state.data.icon_id,
            },
        }));

        // Currency sign
        const currencyObj = window.app.model.currency.getItem(state.data.curr_id);
        if (!currencyObj) {
            throw new Error('Currency not found');
        }

        this.currencySign.textContent = currencyObj.sign;

        // Name input
        if (state.validation.name === true) {
            window.app.clearBlockValidation('name-inp-block');
        } else {
            this.nameFeedback.textContent = state.validation.name;
            window.app.invalidateBlock('name-inp-block');
        }

        // Initial balance input
        if (state.validation.initbalance) {
            window.app.clearBlockValidation('initbal-inp-block');
        } else {
            window.app.invalidateBlock('initbal-inp-block');
        }

        this.iconSelect.enable(!state.submitStarted);
        this.currencySelect.enable(!state.submitStarted);
        enable(this.balanceInp, !state.submitStarted);
        enable(this.nameInp, !state.submitStarted);
        enable(this.submitBtn, !state.submitStarted);
        show(this.cancelBtn, !state.submitStarted);

        if (this.deleteBtn) {
            this.deleteBtn.enable(!state.submitStarted);
        }

        this.spinner.show(state.submitStarted);
    }
}

window.app = new Application(window.appProps);
window.app.createView(AccountView);
