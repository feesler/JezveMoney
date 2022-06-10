import 'jezvejs/style';
import {
    ge,
    copyObject,
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

/**
 * Create/update account view
 */
class AccountView extends View {
    constructor(...args) {
        super(...args);

        this.model = {
            nameChanged: false,
        };

        if (this.props.account) {
            this.model.original = this.props.account;
            this.model.data = copyObject(this.model.original);
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
            extraClass: 'dd__fullwidth',
        });
        if (!this.iconSelect) {
            throw new Error('Failed to initialize Account view');
        }

        this.currencySelect = DropDown.create({
            input_id: 'currency',
            onitemselect: (o) => this.onCurrencySelect(o),
            editable: false,
            extraClass: 'dd__fullwidth',
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
            oninput: (e) => this.onInitBalanceInput(e),
        });
        if (!this.initBalanceDecimalInput) {
            throw new Error('Failed to initialize Account view');
        }

        // Update mode
        if (this.model.original.id) {
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
    }

    /**
     * Icon select event handler
     */
    onIconSelect(obj) {
        if (!obj) {
            return;
        }

        this.model.data.icon_id = obj.id;
        this.updateAccountTile();
    }

    /**
     * Currency select event handler
     */
    onCurrencySelect(obj) {
        if (!obj) {
            return;
        }

        this.model.data.curr_id = obj.id;
        this.setCurrencySign(this.model.data.curr_id);
        this.updateAccountTile();
    }

    /**
     * Initial balance input event handler
     */
    onInitBalanceInput(e) {
        if (!e || !e.target) {
            return;
        }

        this.clearBlockValidation('initbal-inp-block');
        this.model.data.initbalance = normalize(e.target.value);
        this.updateAccountTile();
    }

    /**
     * Account name input event handler
     */
    onNameInput() {
        this.clearBlockValidation('name-inp-block');

        this.model.nameChanged = true;
        this.model.data.name = this.nameInp.value;
        this.updateAccountTile();
    }

    /**
     * Form submit event handler
     */
    onSubmit(e) {
        let valid = true;

        if (!this.nameInp.value || this.nameInp.value.length < 1) {
            this.invalidateBlock('name-inp-block');
            this.nameInp.focus();
            valid = false;
        }

        if (!this.balanceInp.value
            || this.balanceInp.value.length < 1
            || !isNum(this.balanceInp.value)) {
            this.invalidateBlock('initbal-inp-block');
            this.balanceInp.focus();
            valid = false;
        }

        if (!valid) {
            e.preventDefault();
        }
    }

    /**
     * Show account delete confirmation popup
     */
    confirmDelete() {
        if (!this.model.data.id) {
            return;
        }

        ConfirmDialog.create({
            id: 'delete_warning',
            title: TITLE_ACCOUNT_DELETE,
            content: MSG_ACCOUNT_DELETE,
            onconfirm: () => this.delForm.submit(),
        });
    }

    /**
     * Set currency sign
     */
    setCurrencySign(currencyId) {
        const currencyObj = window.app.model.currency.getItem(currencyId);
        if (!currencyObj) {
            return;
        }

        this.currencySign.textContent = currencyObj.sign;
    }

    /**
     * Render account tile with the current model data
     */
    updateAccountTile() {
        let tileTitle = this.model.data.name;
        const bal = this.model.original.balance
            + this.model.data.initbalance - this.model.original.initbalance;

        if (!this.model.original.id && !this.model.nameChanged) {
            tileTitle = TITLE_NEW_ACCOUNT;
        }

        this.tile.render({
            name: tileTitle,
            balance: bal,
            curr_id: this.model.data.curr_id,
            icon_id: this.model.data.icon_id,
        });
    }
}

window.app = new Application(window.appProps);
window.app.createView(AccountView);
