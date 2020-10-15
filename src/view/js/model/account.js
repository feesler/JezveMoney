/** Account flags */
var ACCOUNT_HIDDEN = 1;


/**
 * @constructor Account class
 * @param {*} props 
 */
function Account()
{
	Account.parent.constructor.apply(this, arguments);
}

extend(Account, ListItem);

/**
 * Check specified field name is available
 * @param {string} field - field name to check
 */
Account.prototype.isAvailField = function(field)
{
    var availFields = ['id', 'owner_id', 'name', 'balance', 'initbalance', 'curr_id', 'icon_id', 'flags'];

    return typeof field === 'string' && availFields.includes(field);
};


/**
 * Check account is not hidden
 */
Account.prototype.isVisible = function()
{
	if (!('flags' in this))
		throw new Error('Invalid account');

	return (this.flags & ACCOUNT_HIDDEN) == 0;
};


/**
 * @constructor AccountList class
 * @param {object[]} props - array of accounts
 */
function AccountList()
{
	AccountList.parent.constructor.apply(this, arguments);
}

extend(AccountList, List);

/** Static alias for AccountList constructor */
AccountList.create = function(props)
{
    return new AccountList(props);
};


/**
 * Create list item from specified object
 * @param {Object} obj 
 */
AccountList.prototype.createItem = function(obj)
{
    return new Account(obj);
};


/**
 * Return list of Accounts of user
 */
AccountList.prototype.getUserAccounts = function(owner_id)
{
    var res = this.data.filter(function(item) {
        return item && item.owner_id == owner_id;
    });

    return (res) ? res : null;
};


/**
 * Return list of visible Accounts
 */
AccountList.prototype.getVisible = function()
{
    var res = this.data.filter(function(item) {
        return item && item.isVisible();
    });

    return (res) ? res : null;
};


/**
 * Return identifier of another account if possible
 * Return zero account can't be found
 * @param {number} account_id - identifier of account to start looking from
 */
AccountList.prototype.getNextAccount = function(account_id)
{
	if (!Array.isArray(this.data) || this.data.length < 2 || !account_id)
		return 0;

	var pos = this.getItemIndex(account_id);
	if (pos === -1)
		return 0;

	pos = ((pos === this.data.length - 1) ? 0 : pos + 1);

	return this.data[pos].id;
};


/**
 * Cancel affection of specified transaction from accounts
 * @param {Transaction} transaction - transaction object to cancel affects of
 */
AccountList.prototype.cancelTransaction = function(transaction)
{
    if (!transaction)
        return;

    var srcAccount = this.getItem(transaction.src_id);
    if (srcAccount)
        srcAccount.balance += transaction.src_amount;

    var destAccount = this.getItem(transaction.dest_id);
    if (destAccount)
        destAccount.balance -= transaction.dest_amount;
};


/**
 * Search account of person in specified currency
 * @param {number} person_id - person identifier
 * @param {number} curr_id - currency identifier
 */
AccountList.prototype.getPersonAccount = function(person_id, curr_id)
{
	if (!person_id || !curr_id)
		return null;

	// check person have account in specified currency
	var res = this.data.find(function(item) {
		return item && item.owner_id == person_id && item.curr_id == curr_id;
	});

	return (res) ? res : null;
};
