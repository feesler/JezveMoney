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
import { Button } from 'jezvejs/Button';
import { Spinner } from 'jezvejs/Spinner';
import { createStore } from 'jezvejs/Store';

import { getCurrencyPrecision, __ } from '../../utils/utils.js';
import { normalize } from '../../utils/decimal.js';
import { App } from '../../Application/App.js';
import { View } from '../../utils/View.js';
import { API } from '../../API/index.js';

import { IconList } from '../../Models/IconList.js';
import { accountTypes, Account } from '../../Models/Account.js';
import { AccountList } from '../../Models/AccountList.js';
import { UserCurrencyList } from '../../Models/UserCurrencyList.js';
import { CurrencyList } from '../../Models/CurrencyList.js';

import { Heading } from '../../Components/Heading/Heading.js';
import { AccountTile } from '../../Components/AccountTile/AccountTile.js';
import { InputField } from '../../Components/Fields/InputField/InputField.js';
import { AmountInputField } from '../../Components/Fields/AmountInputField/AmountInputField.js';
import { IconSelect } from '../../Components/Inputs/IconSelect/IconSelect.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';

import { actions, reducer } from './reducer.js';
import '../../Application/Application.scss';
import './AccountView.scss';

/**
 * Create/update account view
 */
class AccountView extends View {
    constructor(...args) {
        super(...args);

        App.loadModel(CurrencyList, 'currency', App.props.currency);
        App.loadModel(UserCurrencyList, 'userCurrencies', App.props.userCurrencies);
        App.loadModel(AccountList, 'accounts', App.props.accounts);
        App.loadModel(IconList, 'icons', App.props.icons);

        const initialState = {
            nameChanged: false,
            validation: {
                initbalance: true,
                name: true,
                initlimit: true,
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
                fInitLimit: normalize(original.initlimit, precision),
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
            'currencyField',
            'submitBtn',
            'cancelBtn',
        ]);

        this.heading = Heading.fromElement(this.heading, {
            title: (isUpdate) ? __('accounts.update') : __('accounts.create'),
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

        // Name field
        this.nameField = InputField.create({
            id: 'nameField',
            inputId: 'nameInp',
            className: 'form-row',
            name: 'name',
            title: __('accounts.name'),
            validate: true,
            onInput: (e) => this.onNameInput(e),
        });
        insertAfter(this.nameField.elem, this.iconField);

        // Currency field
        this.currencySelect = DropDown.create({
            elem: 'currency',
            enableFilter: true,
            onItemSelect: (o) => this.onCurrencySelect(o),
            className: 'dd_fullwidth',
        });
        App.initUserCurrencyList(this.currencySelect);

        // Initial balance field
        this.initBalanceField = AmountInputField.create({
            id: 'initBalanceField',
            title: __('accounts.initialBalance'),
            feedbackMessage: __('accounts.invalidBalance'),
            validate: true,
            className: 'form-row',
            onInput: (e) => this.onInitBalanceInput(e),
        });
        insertAfter(this.initBalanceField.elem, this.currencyField);

        // Initial credit limit field
        this.initLimitField = AmountInputField.create({
            id: 'initLimitField',
            title: __('accounts.initialCreditLimit'),
            feedbackMessage: __('accounts.invalidLimit'),
            validate: true,
            className: 'form-row',
            onInput: (e) => this.onLimitInput(e),
        });
        insertAfter(this.initLimitField.elem, this.initBalanceField.elem);

        setEvents(this.accountForm, { submit: (e) => this.onSubmit(e) });

        this.spinner = Spinner.create({ className: 'request-spinner' });
        this.spinner.hide();
        insertAfter(this.spinner.elem, this.cancelBtn);

        // Update mode
        if (isUpdate) {
            this.deleteBtn = Button.create({
                id: 'deleteBtn',
                className: 'warning-btn',
                title: __('actions.delete'),
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
    onNameInput(e) {
        const { value } = e.target;
        this.store.dispatch(actions.changeName(value));
    }

    /** Form submit event handler */
    onSubmit(e) {
        e.preventDefault();

        const state = this.store.getState();
        if (state.submitStarted) {
            return;
        }

        const { name, initbalance, initlimit } = state.data;
        if (name.length === 0) {
            this.store.dispatch(actions.invalidateNameField(__('accounts.invalidName')));
            this.nameField.focus();
        } else {
            const account = App.model.accounts.findByName(name);
            if (account && state.original.id !== account.id) {
                this.store.dispatch(actions.invalidateNameField(__('accounts.existingName')));
                this.nameField.focus();
            }
        }

        if (initbalance.length === 0) {
            this.store.dispatch(actions.invalidateInitialBalanceField());
            this.initBalanceField.input.elem.focus();
        }

        const isCreditCard = Account.isCreditCard(state.data.type);
        if (isCreditCard && initlimit.length === 0) {
            this.store.dispatch(actions.invalidateLimitField());
            this.initLimitField.input.elem.focus();
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
            initlimit: data.fInitLimit,
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

            App.navigateNext();
        } catch (e) {
            this.cancelSubmit();
            App.createErrorNotification(e.message);
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

            App.navigateNext();
        } catch (e) {
            this.cancelSubmit();
            App.createErrorNotification(e.message);
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
            title: __('accounts.delete'),
            content: __('accounts.deleteMessage'),
            onConfirm: () => this.deleteAccount(),
        });
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        const currencyObj = App.model.currency.getItem(state.data.curr_id);
        if (!currencyObj) {
            throw new Error(__('currencies.errors.notFound'));
        }

        // Render account tile
        const balance = state.original.balance
            + state.data.fInitBalance - state.original.initbalance;

        const name = (!state.original.id && !state.nameChanged)
            ? __('accounts.nameNew')
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

        // Name field
        const isValidName = (state.validation.name === true);
        this.nameField.setState((nameState) => ({
            ...nameState,
            value: state.data.name,
            valid: isValidName,
            feedbackMessage: (isValidName) ? '' : state.validation.name,
            disabled: state.submitStarted,
        }));

        // Initial balance field
        this.initBalanceField.setState((balanceState) => ({
            ...balanceState,
            value: state.data.initbalance,
            disabled: state.submitStarted,
            currencyId: state.data.curr_id,
            valid: state.validation.initbalance,
        }));

        // Credit limit field
        const isCreditCard = Account.isCreditCard(state.data.type);
        this.initLimitField.show(isCreditCard);
        this.initLimitField.setState((limitState) => ({
            ...limitState,
            value: state.data.initlimit,
            disabled: state.submitStarted,
            currencyId: state.data.curr_id,
            valid: state.validation.initlimit,
        }));

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

App.createView(AccountView);
