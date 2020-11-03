'use strict';

/* global ge, extend, copyObject, isNum, normalize */
/* global CurrencyList, IconList */
/* global View, AccountTile, ConfirmDialog, DropDown, DecimalInput, IconLink */

var singleAccDeleteTitle = 'Delete account';
var singleAccDeleteMsg = 'Are you sure want to delete selected account?<br>All income and expense transactions history will be lost. Transfer to this account will be changed to expense. Transfer from this account will be changed to income.';

/**
 * Create/update account view
 */
function AccountView() {
    AccountView.parent.constructor.apply(this, arguments);

    this.model = {
        nameChanged: false
    };

    if (this.props.account) {
        this.model.original = this.props.account;
        this.model.data = copyObject(this.model.original);
    }

    this.model.currency = CurrencyList.create(this.props.currency);
    this.model.icons = IconList.create(this.props.icons);
}

extend(AccountView, View);

/**
 * View initialization
 */
AccountView.prototype.onStart = function () {
    this.tile = AccountTile.fromElement({
        elem: 'acc_tile',
        parent: this
    });
    if (!this.tile) {
        throw new Error('Failed to initialize Account view');
    }

    this.iconSelect = DropDown.create({
        input_id: 'icon',
        onitemselect: this.onIconSelect.bind(this),
        editable: false,
        extraClass: 'dd__fullwidth'
    });
    if (!this.iconSelect) {
        throw new Error('Failed to initialize Account view');
    }

    this.currencySelect = DropDown.create({
        input_id: 'currency',
        onitemselect: this.onCurrencySelect.bind(this),
        editable: false,
        extraClass: 'dd__fullwidth'
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
        oninput: this.onInitBalanceInput.bind(this)
    });
    if (!this.initBalanceDecimalInput) {
        throw new Error('Failed to initialize Account view');
    }

    // Update mode
    if (this.model.original.id) {
        this.deleteBtn = IconLink.fromElement({
            elem: 'del_btn',
            onclick: this.confirmDelete.bind(this)
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
    this.form.addEventListener('submit', this.onSubmit.bind(this));

    this.nameInp = ge('accname');
    if (!this.nameInp) {
        throw new Error('Invalid Account view');
    }

    this.nameInp.addEventListener('input', this.onNameInput.bind(this));
};

/**
 * Icon select event handler
 */
AccountView.prototype.onIconSelect = function (obj) {
    if (!obj) {
        return;
    }

    this.model.data.icon_id = obj.id;
    this.updateAccountTile();
};

/**
 * Currency select event handler
 */
AccountView.prototype.onCurrencySelect = function (obj) {
    if (!obj) {
        return;
    }

    this.model.data.curr_id = obj.id;
    this.setCurrencySign(this.model.data.curr_id);
    this.updateAccountTile();
};

/**
 * Initial balance input event handler
 */
AccountView.prototype.onInitBalanceInput = function (e) {
    if (!e || !e.target) {
        return;
    }

    this.clearBlockValidation('initbal-inp-block');
    this.model.data.initbalance = normalize(e.target.value);
    this.updateAccountTile();
};

/**
 * Account name input event handler
 */
AccountView.prototype.onNameInput = function () {
    this.clearBlockValidation('name-inp-block');

    this.model.nameChanged = true;
    this.model.data.name = this.nameInp.value;
    this.updateAccountTile();
};

/**
 * Form submit event handler
 */
AccountView.prototype.onSubmit = function (e) {
    var valid = true;

    if (!this.nameInp.value || this.nameInp.value.length < 1) {
        this.invalidateBlock('name-inp-block');
        this.nameInp.focus();
        valid = false;
    }

    if (
        !this.balanceInp.value
        || this.balanceInp.value.length < 1
        || !isNum(this.balanceInp.value)
    ) {
        this.invalidateBlock('initbal-inp-block');
        this.balanceInp.focus();
        valid = false;
    }

    if (!valid) {
        e.preventDefault();
    }
};

/**
 * Show account delete confirmation popup
 */
AccountView.prototype.confirmDelete = function () {
    if (!this.model.data.id) {
        return;
    }

    ConfirmDialog.create({
        id: 'delete_warning',
        title: singleAccDeleteTitle,
        content: singleAccDeleteMsg,
        onconfirm: this.delForm.submit.bind(this.delForm)
    });
};

/**
 * Set currency sign
 */
AccountView.prototype.setCurrencySign = function (currencyId) {
    var currencyObj = this.model.currency.getItem(currencyId);
    if (!currencyObj) {
        return;
    }

    this.currencySign.textContent = currencyObj.sign;
};

/**
 * Render account tile with the current model data
 */
AccountView.prototype.updateAccountTile = function () {
    var tileTitle = this.model.data.name;
    var bal = this.model.original.balance
        + this.model.data.initbalance - this.model.original.initbalance;

    if (!this.model.original.id && !this.model.nameChanged) {
        tileTitle = 'New account';
    }

    this.tile.render({
        name: tileTitle,
        balance: bal,
        curr_id: this.model.data.curr_id,
        icon_id: this.model.data.icon_id
    });
};