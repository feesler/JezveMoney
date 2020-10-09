/** Account flags */
var ACCOUNT_HIDDEN = 1;


/**
 * @constructor Account class
 * @param {*} props 
 */
function Account(props)
{
    if (!isObject(props))
        throw new Error('Invalid Account props');

    for(var prop in props)
    {
        if (this.isAvailField(prop))
            this[prop] = props[prop];
    }
}


/** Static alias for Account constructor */
Account.create = function(props)
{
    return new Account(props)
};


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
function AccountList(props)
{
    if (!Array.isArray(props))
        throw new Error('Invalid account list props');
    
    this.data = props.map(Account.create);
}


/** Static alias for AccountList constructor */
AccountList.create = function(props)
{
    return new AccountList(props);
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
 * Return item with specified id
 * @param {number} item_id - identifier of item to find
 */
AccountList.prototype.getItem = function(item_id)
{
    if (!item_id)
        return null;

    var res = this.data.find(function(item) {
        return item && item.id == item_id
    });

    return (res) ? res : null;
};


/**
 * Return index of item with specified id
 * Return -1 in case item can't be found
 * @param {number} item_id - identifier of item to find
 */
AccountList.prototype.getItemIndex = function(item_id)
{
	return this.data.findIndex(function(item) {
        return item && item.id == item_id
    });
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
