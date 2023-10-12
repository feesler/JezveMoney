import 'jezvejs/style';
import { createElement } from 'jezvejs';
import { DropDown } from 'jezvejs/DropDown';
import { Button } from 'jezvejs/Button';
import { createStore } from 'jezvejs/Store';

// Application
import { getCurrencyPrecision, __, createHiddenInputs } from '../../utils/utils.js';
import { normalize } from '../../utils/decimal.js';
import { App } from '../../Application/App.js';
import { AppView } from '../../Components/Layout/AppView/AppView.js';
import { API } from '../../API/index.js';

// Models
import { IconList } from '../../Models/IconList.js';
import { accountTypes, Account } from '../../Models/Account.js';
import { AccountList } from '../../Models/AccountList.js';
import { UserCurrencyList } from '../../Models/UserCurrencyList.js';
import { CurrencyList } from '../../Models/CurrencyList.js';

// Common components
import { Heading } from '../../Components/Layout/Heading/Heading.js';
import { AccountTile } from '../../Components/Common/AccountTile/AccountTile.js';
import { Field } from '../../Components/Common/Field/Field.js';
import { InputField } from '../../Components/Form/Fields/InputField/InputField.js';
import { AmountInputField } from '../../Components/Form/Fields/AmountInputField/AmountInputField.js';
import { FormControls } from '../../Components/Form/FormControls/FormControls.js';
import { IconSelect } from '../../Components/Form/Inputs/IconSelect/IconSelect.js';
import { ConfirmDialog } from '../../Components/Common/ConfirmDialog/ConfirmDialog.js';

import { actions, reducer } from './reducer.js';
import '../../Application/Application.scss';
import './AccountView.scss';

/**
 * Create/update account view
 */
class AccountView extends AppView {
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
            'formContainer',
        ]);

        this.heading = Heading.fromElement(this.heading, {
            title: (isUpdate) ? __('accounts.update') : __('accounts.create'),
            showInHeaderOnScroll: false,
        });

        // Account tile field
        this.tile = AccountTile.create({
            id: 'accountTile',
            account: this.props.account,
        });

        this.tileField = Field.create({
            id: 'tileField',
            className: 'form-row',
            content: this.tile.elem,
        });

        // Account type field
        this.typeSelect = DropDown.create({
            id: 'type',
            onItemSelect: (o) => this.onTypeSelect(o),
            className: 'dd_fullwidth',
            data: Object.keys(accountTypes).map((type) => ({
                id: type,
                title: accountTypes[type],
            })),
        });

        this.typeField = Field.create({
            id: 'typeField',
            htmlFor: 'type',
            title: __('accounts.type'),
            className: 'form-row',
            content: this.typeSelect.elem,
        });

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

        // Icon field
        this.iconSelect = IconSelect.create({
            id: 'icon',
            className: 'dd_fullwidth',
            onItemSelect: (o) => this.onIconSelect(o),
        });

        this.iconField = Field.create({
            id: 'iconField',
            htmlFor: 'icon',
            title: __('accounts.icon'),
            className: 'form-row',
            content: this.iconSelect.elem,
        });

        // Currency field
        this.currencySelect = DropDown.create({
            id: 'currency',
            enableFilter: true,
            onItemSelect: (o) => this.onCurrencySelect(o),
            className: 'dd_fullwidth',
        });
        App.initUserCurrencyList(this.currencySelect);

        this.currencyField = Field.create({
            id: 'currencyField',
            htmlFor: 'currency',
            title: __('accounts.currency'),
            className: 'form-row',
            content: this.currencySelect.elem,
        });

        // Initial balance field
        this.initBalanceField = AmountInputField.create({
            id: 'initBalanceField',
            title: __('accounts.initialBalance'),
            feedbackMessage: __('accounts.invalidBalance'),
            validate: true,
            className: 'form-row',
            onInput: (e) => this.onInitBalanceInput(e),
        });

        // Initial credit limit field
        this.initLimitField = AmountInputField.create({
            id: 'initLimitField',
            title: __('accounts.initialCreditLimit'),
            feedbackMessage: __('accounts.invalidLimit'),
            validate: true,
            className: 'form-row',
            onInput: (e) => this.onLimitInput(e),
        });

        // Controls
        this.submitControls = FormControls.create({
            id: 'submitControls',
            submitBtn: {
                title: __('actions.submit'),
            },
            cancelBtn: {
                title: __('actions.cancel'),
                url: App.props.nextAddress,
            },
        });

        // Hidden inputs
        const hiddenInputIds = ['flags'];
        if (isUpdate) {
            hiddenInputIds.push('accid');
        }
        const hiddenInputs = createHiddenInputs(hiddenInputIds);
        Object.assign(this, hiddenInputs);

        this.accountForm = createElement('form', {
            props: {
                id: 'accountForm',
                method: 'post',
            },
            events: {
                submit: (e) => this.onSubmit(e),
            },
            children: [
                this.tileField.elem,
                this.typeField.elem,
                this.iconField.elem,
                this.nameField.elem,
                this.currencyField.elem,
                this.initBalanceField.elem,
                this.initLimitField.elem,
                this.submitControls.elem,
                ...Object.values(hiddenInputs),
            ],
        });
        this.formContainer.append(this.accountForm);

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

    render(state, prevState = {}) {
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

        // Controls
        if (state.submitStarted !== prevState?.submitStarted) {
            this.submitControls.setLoading(state.submitStarted);
        }

        // Hidden fields
        this.flags.value = state.original.flags;
        if (state.original.id) {
            this.accid.value = state.original.id;
        }

        if (this.deleteBtn) {
            this.deleteBtn.enable(!state.submitStarted);
        }
    }
}

App.createView(AccountView);
