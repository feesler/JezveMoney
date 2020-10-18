'use strict';

/* global extend, isObject, Tile */

/**
 * Account Tile component constructor
 * @param {object} props
 */
function AccountTile() {
    AccountTile.parent.constructor.apply(this, arguments);

    this.parent = this.props.parent;
}

extend(AccountTile, Tile);

/**
 * Create new Account Tile from specified element
 */
AccountTile.fromElement = function (props) {
    var res;

    try {
        res = new AccountTile(props);
        res.parse();
    } catch (e) {
        res = null;
    }

    return res;
};

/**
 * Render specified account
 * @param {object} account - account object
 */
AccountTile.prototype.render = function (account) {
    var fmtBalance;
    var icon;

    if (!isObject(account)) {
        throw new Error('Invalid account specified');
    }

    fmtBalance = this.parent.model.currency.formatCurrency(account.balance, account.curr_id);
    icon = this.parent.model.icons.getItem(account.icon_id);

    this.setTitle(account.name);
    this.setSubTitle(fmtBalance);
    this.setIcon((icon) ? icon.file : null);
};
