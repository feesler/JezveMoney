'use strict';

/* global extend, List, Account */

/**
 * @constructor AccountList class
 * @param {object[]} props - array of accounts
 */
function AccountList() {
    AccountList.parent.constructor.apply(this, arguments);
}

extend(AccountList, List);

/** Static alias for AccountList constructor */
AccountList.create = function (props) {
    return new AccountList(props);
};

/**
 * Create list item from specified object
 * @param {Object} obj
 */
AccountList.prototype.createItem = function (obj) {
    return new Account(obj);
};

/**
 * Return list of Accounts of user
 */
AccountList.prototype.getUserAccounts = function (ownerId) {
    var owner = parseInt(ownerId, 10);
    if (!owner) {
        return null;
    }

    return this.filter(function (item) {
        return item && item.owner_id === ownerId;
    });
};

/**
 * Return list of visible Accounts
 */
AccountList.prototype.getVisible = function () {
    return this.filter(function (item) {
        return item && item.isVisible();
    });
};

/**
 * Return identifier of another account if possible
 * Return zero account can't be found
 * @param {number} accountId - identifier of account to start looking from
 */
AccountList.prototype.getNextAccount = function (accountId) {
    var pos;

    if (!Array.isArray(this.data) || this.length < 2 || !accountId) {
        return 0;
    }

    pos = this.getItemIndex(accountId);
    if (pos === -1) {
        return 0;
    }

    pos = ((pos === this.length - 1) ? 0 : pos + 1);

    return this.data[pos].id;
};

/**
 * Cancel affection of specified transaction from accounts
 * @param {Transaction} transaction - transaction object to cancel affects of
 */
AccountList.prototype.cancelTransaction = function (transaction) {
    var srcAccount;
    var destAccount;

    if (!transaction) {
        return;
    }

    srcAccount = this.getItem(transaction.src_id);
    if (srcAccount) {
        srcAccount.balance += transaction.src_amount;
    }

    destAccount = this.getItem(transaction.dest_id);
    if (destAccount) {
        destAccount.balance -= transaction.dest_amount;
    }
};

/**
 * Search account of person in specified currency
 * @param {number} personId - person identifier
 * @param {number} currencyId - currency identifier
 */
AccountList.prototype.getPersonAccount = function (personId, currencyId) {
    var pId = parseInt(personId, 10);
    var currId = parseInt(currencyId, 10);
    if (!pId || !currId) {
        return null;
    }

    // check person have account in specified currency
    return this.find(function (item) {
        return item && item.owner_id === pId && item.curr_id === currId;
    });
};
