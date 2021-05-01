'use strict';

/* global extend, ListItem */
/* eslint no-bitwise: "off" */

/** Account flags */
var ACCOUNT_HIDDEN = 1;

/**
 * @constructor Account class
 * @param {*} props
 */
function Account() {
    Account.parent.constructor.apply(this, arguments);
}

extend(Account, ListItem);

/**
 * Check specified field name is available
 * @param {string} field - field name to check
 */
Account.prototype.isAvailField = function (field) {
    var availFields = [
        'id', 'owner_id', 'name', 'balance', 'initbalance', 'curr_id', 'icon_id', 'flags'
    ];

    return typeof field === 'string' && availFields.includes(field);
};

/**
 * Check account is not hidden
 */
Account.prototype.isVisible = function () {
    if (!('flags' in this)) {
        throw new Error('Invalid account');
    }

    return (this.flags & ACCOUNT_HIDDEN) === 0;
};
