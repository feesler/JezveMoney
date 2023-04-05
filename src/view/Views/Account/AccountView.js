import 'jezvejs/style';
import 'jezvejs/style/Input';
import 'jezvejs/style/InputGroup';
import {
    setEvents,
    insertAfter,
    enable,
    show,
} from 'jezvejs';
import { DropDown } from 'jezvejs/DropDown';
import { DecimalInput } from 'jezvejs/DecimalInput';
import { Button } from 'jezvejs/Button';
import { Spinner } from 'jezvejs/Spinner';
import { createStore } from 'jezvejs/Store';

import { getCurrencyPrecision, normalize, __ } from '../../js/utils.js';
import { Application } from '../../js/Application.js';
import { View } from '../../js/View.js';
import { API } from '../../js/api/index.js';

import { IconList } from '../../js/model/IconList.js';
import { accountTypes, ACCOUNT_TYPE_CREDIT_CARD } from '../../js/model/Account.js';
import { AccountList } from '../../js/model/AccountList.js';
import { UserCurrencyList } from '../../js/model/UserCurrencyList.js';
import { CurrencyList } from '../../js/model/CurrencyList.js';

import { Heading } from '../../Components/Heading/Heading.js';
import { AccountTile } from '../../Components/AccountTile/AccountTile.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { IconSelect } from '../../Components/IconSelect/IconSelect.js';

import { actions, reducer } from './reducer.js';
import '../../Components/Field/Field.scss';
import '../../css/app.scss';
import './AccountView.scss';

/**
 * Create/update account view
 */
class AccountView extends View {
    constructor(...args) {
        super(...args);

        window.app.loadModel(CurrencyList, 'currency', window.app.props.currency);
        window.app.loadModel(UserCurrencyList, 'userCurrencies', window.app.props.userCurrencies);
        window.app.loadModel(AccountList, 'accounts', window.app.props.accounts);
        window.app.loadModel(IconList, 'icons', window.app.props.icons);

        const initialState = {
            nameChanged: false,
            validation: {
                initbalance: true,
                name: true,
                limit: true,
                valid: true,
            },
            submitStarted: false,
        };

        if (this.props.account) {
            const original = this.props.account;
            const precision = getCurrencyPrecision(original.curr_id);

            initialState.original = original;
            initialState.data = {
                ...original,
                fInitBalance: normalize(original.initbalance, precision),
                fLimit: normalize(original.limit, precision),
            };
        }

        this.store = createStore(reducer, { initialState });
    }

    /**
     * View initialization
     */
    onStart() {
        const isUpdate = this.props.account.id;

        this.loadElementsByIds([
            'heading',
            'accountForm',
            'tileField',
            'iconField',
            'currencySign',
            'balanceInp',
            'limitField',
            'limitInp',
            'limitCurrencySign',
            'nameInp',
            'nameFeedback',
            'submitBtn',
            'cancelBtn',
        ]);

        this.heading = Heading.fromElement(this.heading, {
            title: (isUpdate) ? __('ACCOUNT_UPDATE') : __('ACCOUNT_CREATE'),
            showInHeaderOnScroll: false,
        });

        this.tile = AccountTile.create({
            id: 'accountTile',
            account: this.props.account,
        });
        this.tileField.append(this.tile.elem);

        this.typeSelect = DropDown.create({
            elem: 'type',
            onItemSelect: (o) => this.onTypeSelect(o),
            className: 'dd_fullwidth',
            data: Object.keys(accountTypes).map((type) => ({
                id: type,
                title: accountTypes[type],
            })),
        });

        this.iconSelect = IconSelect.create({
            className: 'dd_fullwidth',
            onItemSelect: (o) => this.onIconSelect(o),
        });
        this.iconField.append(this.iconSelect.elem);

        this.currencySelect = DropDown.create({
            elem: 'currency',
            enableFilter: true,
            onItemSelect: (o) => this.onCurrencySelect(o),
            className: 'dd_fullwidth',
        });
        window.app.initUserCurrencyList(this.currencySelect);

        this.initBalanceDecimalInput = DecimalInput.create({
            elem: this.balanceInp,
            onInput: (e) => this.onInitBalanceInput(e),
        });

        this.limitDecimalInput = DecimalInput.create({
            elem: this.limitInp,
            onInput: (e) => this.onLimitInput(e),
        });

        setEvents(this.accountForm, { submit: (e) => this.onSubmit(e) });
        setEvents(this.nameInp, { input: (e) => this.onNameInput(e) });

        this.spinner = Spinner.create({ className: 'request-spinner' });
        this.spinner.hide();
        insertAfter(this.spinner.elem, this.cancelBtn);

        // Update mode
        if (isUpdate) {
            this.deleteBtn = Button.create({
                id: 'deleteBtn',
                className: 'warning-btn',
                title: __('DELETE'),
                icon: 'del',
                onClick: () => this.confirmDelete(),
            });
            this.heading.actionsContainer.append(this.deleteBtn.elem);
        }

        this.subscribeToStore(this.store);
    }

    /** Type select event handler */
    onTypeSelect(obj) {
        if (!obj) {
            return;
        }

        this.store.dispatch(actions.changeType(obj.id));
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

    /** Limit input event handler */
    onLimitInput(e) {
        const { value } = e.target;
        this.store.dispatch(actions.changeLimit(value));
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

        const { name, initbalance, limit } = state.data;
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

        if (limit.length === 0) {
            this.store.dispatch(actions.invalidateLimitField());
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
            type: data.type,
            name: data.name,
            initbalance: data.fInitBalance,
            limit: data.fLimit,
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
            window.app.createErrorNotification(e.message);
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
            window.app.createErrorNotification(e.message);
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

        const currencyObj = window.app.model.currency.getItem(state.data.curr_id);
        if (!currencyObj) {
            throw new Error(__('ERR_CURR_NOT_FOUND'));
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

        // Type select
        this.typeSelect.setSelection(state.data.type);
        this.typeSelect.enable(!state.submitStarted);

        // Name input
        window.app.setValidation('name-inp-block', (state.validation.name === true));
        this.nameFeedback.textContent = (state.validation.name === true)
            ? ''
            : state.validation.name;
        enable(this.nameInp, !state.submitStarted);

        // Initial balance field
        this.initBalanceDecimalInput.setState((inpState) => ({
            ...inpState,
            digits: currencyObj.precision,
        }));
        window.app.setValidation('initbal-inp-block', state.validation.initbalance);
        enable(this.balanceInp, !state.submitStarted);
        this.currencySign.textContent = currencyObj.sign;

        // Credit limit field
        const isCreditCard = parseInt(state.data.type, 10) === ACCOUNT_TYPE_CREDIT_CARD;
        show(this.limitField, isCreditCard);
        this.limitDecimalInput.setState((inpState) => ({
            ...inpState,
            digits: currencyObj.precision,
        }));
        window.app.setValidation(this.limitField, state.validation.limit);
        enable(this.limitInp, !state.submitStarted);
        this.limitCurrencySign.textContent = currencyObj.sign;

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
