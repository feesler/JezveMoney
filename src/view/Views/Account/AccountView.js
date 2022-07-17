import 'jezvejs/style';
import {
    ge,
    isNum,
} from 'jezvejs';
import { DropDown } from 'jezvejs/DropDown';
import { DecimalInput } from 'jezvejs/DecimalInput';
import { normalize } from '../../js/app.js';
import { Application } from '../../js/Application.js';
import { View } from '../../js/View.js';
import { AccountTile } from '../../Components/AccountTile/AccountTile.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { IconLink } from '../../Components/IconLink/IconLink.js';
import '../../css/app.css';
import '../../Components/Tile/style.css';

const TITLE_ACCOUNT_DELETE = 'Delete account';
const MSG_ACCOUNT_DELETE = 'Are you sure want to delete selected account?<br>All income and expense transactions history will be lost. Transfer to this account will be changed to expense. Transfer from this account will be changed to income.';
const TITLE_NEW_ACCOUNT = 'New account';
const MSG_EMPTY_NAME = 'Please input name of account.';
const MSG_EXISTING_NAME = 'Account with this name already exist.';

/**
 * Create/update account view
 */
class AccountView extends View {
    constructor(...args) {
        super(...args);

        this.state = {
            nameChanged: false,
            validation: {
                initbalance: true,
                name: true,
            },
        };

        if (this.props.account) {
            this.state.original = this.props.account;
            this.state.data = { ...this.state.original };
            this.state.data.fInitBalance = normalize(this.state.data.initbalance);
        }
    }

    /**
     * View initialization
     */
    onStart() {
        this.tile = AccountTile.fromElement({
            elem: 'acc_tile',
            parent: this,
        });
        if (!this.tile) {
            throw new Error('Failed to initialize Account view');
        }

        this.iconSelect = DropDown.create({
            input_id: 'icon',
            onitemselect: (o) => this.onIconSelect(o),
            editable: false,
            className: 'dd__fullwidth',
        });
        if (!this.iconSelect) {
            throw new Error('Failed to initialize Account view');
        }

        this.currencySelect = DropDown.create({
            input_id: 'currency',
            onitemselect: (o) => this.onCurrencySelect(o),
            editable: false,
            className: 'dd__fullwidth',
        });
        if (!this.currencySelect) {
            throw new Error('Failed to initialize Account view');
        }

        this.currencySign = ge('currsign');
        if (!this.currencySign) {
            throw new Error('Failed to initialize Account view');
        }

        this.balanceInp = ge('balance');
        this.initBalanceDecimalInput = DecimalInput.create({
            elem: this.balanceInp,
            digits: 2,
            oninput: (e) => this.onInitBalanceInput(e),
        });
        if (!this.initBalanceDecimalInput) {
            throw new Error('Failed to initialize Account view');
        }

        // Update mode
        if (this.state.original.id) {
            this.deleteBtn = IconLink.fromElement({
                elem: 'del_btn',
                onclick: () => this.confirmDelete(),
            });
            this.delForm = ge('delform');
            if (!this.delForm) {
                throw new Error('Failed to initialize Account view');
            }
        }

        this.form = ge('accForm');
        if (!this.form) {
            throw new Error('Invalid Account view');
        }
        this.form.addEventListener('submit', (e) => this.onSubmit(e));

        this.nameInp = ge('accname');
        if (!this.nameInp) {
            throw new Error('Invalid Account view');
        }
        this.nameInp.addEventListener('input', () => this.onNameInput());

        this.nameFeedback = ge('namefeedback');
        if (!this.nameFeedback) {
            throw new Error('Invalid Account view');
        }
    }

    /**
     * Icon select event handler
     */
    onIconSelect(obj) {
        if (!obj) {
            return;
        }

        this.state.data.icon_id = obj.id;
        this.render(this.state);
    }

    /**
     * Currency select event handler
     */
    onCurrencySelect(obj) {
        if (!obj) {
            return;
        }

        this.state.data.curr_id = obj.id;
        this.render(this.state);
    }

    /**
     * Initial balance input event handler
     */
    onInitBalanceInput(e) {
        if (!e || !e.target) {
            return;
        }

        this.state.validation.initbalance = true;
        this.state.data.initbalance = e.target.value;
        this.state.data.fInitBalance = normalize(e.target.value);
        this.render(this.state);
    }

    /**
     * Account name input event handler
     */
    onNameInput() {
        this.state.nameChanged = true;
        this.state.validation.name = true;
        this.state.data.name = this.nameInp.value;
        this.render(this.state);
    }

    /**
     * Form submit event handler
     */
    onSubmit(e) {
        const { name, initbalance } = this.state.data;
        let valid = true;

        if (name.length === 0) {
            this.state.validation.name = MSG_EMPTY_NAME;
            this.nameInp.focus();
            valid = false;
        } else {
            const account = window.app.model.accounts.findByName(name);
            if (account && this.state.original.id !== account.id) {
                this.state.validation.name = MSG_EXISTING_NAME;
                this.nameInp.focus();
                valid = false;
            }
        }

        if (initbalance.length === 0 || !isNum(initbalance)) {
            this.state.validation.initbalance = false;
            this.balanceInp.focus();
            valid = false;
        }

        if (!valid) {
            e.preventDefault();
            this.render(this.state);
        }
    }

    /**
     * Show account delete confirmation popup
     */
    confirmDelete() {
        if (!this.state.data.id) {
            return;
        }

        ConfirmDialog.create({
            id: 'delete_warning',
            title: TITLE_ACCOUNT_DELETE,
            content: MSG_ACCOUNT_DELETE,
            onconfirm: () => this.delForm.submit(),
        });
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        // Render account tile
        let tileTitle = state.data.name;
        const bal = state.original.balance
            + state.data.fInitBalance - state.original.initbalance;

        if (!state.original.id && !state.nameChanged) {
            tileTitle = TITLE_NEW_ACCOUNT;
        }

        this.tile.render({
            name: tileTitle,
            balance: bal,
            curr_id: state.data.curr_id,
            icon_id: state.data.icon_id,
        });

        // Currency sign
        const currencyObj = window.app.model.currency.getItem(state.data.curr_id);
        if (!currencyObj) {
            throw new Error('Currency not found');
        }

        this.currencySign.textContent = currencyObj.sign;

        // Name input
        if (state.validation.name === true) {
            this.clearBlockValidation('name-inp-block');
        } else {
            this.nameFeedback.textContent = state.validation.name;
            this.invalidateBlock('name-inp-block');
        }

        // Initial balance input
        if (state.validation.initbalance) {
            this.clearBlockValidation('initbal-inp-block');
        } else {
            this.invalidateBlock('initbal-inp-block');
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(AccountView);
