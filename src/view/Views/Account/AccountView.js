import 'jezvejs/style';
import 'jezvejs/style/InputGroup';
import {
    ge,
    setEvents,
    insertAfter,
    enable,
    show,
} from 'jezvejs';
import { DropDown } from 'jezvejs/DropDown';
import { DecimalInput } from 'jezvejs/DecimalInput';
import { IconButton } from 'jezvejs/IconButton';
import { Spinner } from 'jezvejs/Spinner';
import { normalize, __ } from '../../js/utils.js';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';
import { API } from '../../js/api/index.js';
import { IconList } from '../../js/model/IconList.js';
import { AccountList } from '../../js/model/AccountList.js';
import { CurrencyList } from '../../js/model/CurrencyList.js';
import { AccountTile } from '../../Components/AccountTile/AccountTile.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import '../../Components/Heading/style.scss';
import './style.scss';
import { createStore } from '../../js/store.js';
import { actions, reducer } from './reducer.js';
import { IconSelect } from '../../Components/IconSelect/IconSelect.js';

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

        this.store = createStore(reducer, { initialState });
    }

    /**
     * View initialization
     */
    onStart() {
        this.loadElementsByIds([
            'accountForm',
            'iconField',
            'currencySign',
            'balanceInp',
            'nameInp',
            'nameFeedback',
            'submitBtn',
            'cancelBtn',
        ]);

        this.tile = AccountTile.fromElement('accountTile');

        this.iconSelect = IconSelect.create({
            className: 'dd_fullwidth',
            onItemSelect: (o) => this.onIconSelect(o),
        });
        this.iconField.append(this.iconSelect.elem);

        this.currencySelect = DropDown.create({
            elem: 'currency',
            onItemSelect: (o) => this.onCurrencySelect(o),
            className: 'dd_fullwidth',
        });
        window.app.initCurrencyList(this.currencySelect);

        this.initBalanceDecimalInput = DecimalInput.create({
            elem: this.balanceInp,
            digits: 2,
            onInput: (e) => this.onInitBalanceInput(e),
        });

        setEvents(this.accountForm, { submit: (e) => this.onSubmit(e) });
        setEvents(this.nameInp, { input: (e) => this.onNameInput(e) });

        this.spinner = Spinner.create();
        this.spinner.hide();
        insertAfter(this.spinner.elem, this.cancelBtn);

        // Update mode
        const deleteBtn = ge('deleteBtn');
        if (deleteBtn) {
            this.deleteBtn = IconButton.fromElement(deleteBtn, {
                onClick: () => this.confirmDelete(),
            });
        }

        this.subscribeToStore(this.store);
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
            this.store.dispatch(actions.invalidateNameField(__('ACCOUNT_INVALID_NAME')));
            this.nameInp.focus();
        } else {
            const account = window.app.model.accounts.findByName(name);
            if (account && state.original.id !== account.id) {
                this.store.dispatch(actions.invalidateNameField(__('ACCOUNT_EXISTING_NAME')));
                this.nameInp.focus();
            }
        }

        if (initbalance.length === 0) {
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
            initbalance: data.fInitBalance,
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
                await API.account.update(account);
            } else {
                await API.account.create(account);
            }

            window.app.navigateNext();
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

            window.app.navigateNext();
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
            title: __('ACCOUNT_DELETE'),
            content: __('MSG_ACCOUNT_DELETE'),
            onConfirm: () => this.deleteAccount(),
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
            ? __('ACCOUNT_NAME_NEW')
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
            throw new Error(__('ERR_CURR_NOT_FOUND'));
        }

        this.currencySign.textContent = currencyObj.sign;

        // Name input
        window.app.setValidation('name-inp-block', (state.validation.name === true));
        this.nameFeedback.textContent = (state.validation.name === true)
            ? ''
            : state.validation.name;
        enable(this.nameInp, !state.submitStarted);

        // Initial balance input
        window.app.setValidation('initbal-inp-block', state.validation.initbalance);
        enable(this.balanceInp, !state.submitStarted);

        // Icon select
        this.iconSelect.setSelection(state.data.icon_id);
        this.iconSelect.enable(!state.submitStarted);

        // Currency select
        this.currencySelect.setSelection(state.data.curr_id);
        this.currencySelect.enable(!state.submitStarted);

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
