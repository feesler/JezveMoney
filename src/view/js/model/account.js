// Return account object by id
function getAccount(account_id)
{
	return idSearch(accounts, account_id);
}


function isVisibleAccount(account)
{
	if (!account || !('flags' in account))
		throw new Error('Invalid account');

	return (account.flags & ACCOUNT_HIDDEN) == 0;
}


function isHiddenAccount(account)
{
	if (!account || !('flags' in account))
		throw new Error('Invalid account');

	return (account.flags & ACCOUNT_HIDDEN) == ACCOUNT_HIDDEN;
}


// Format balance of account value with currency
function formatAccoutBalance(acc_id)
{
	var acc = getAccount(acc_id);

	if (!acc)
		return null;

	return formatCurrency(acc.balance, acc.curr_id);
}


// Return current position of account in accounts array
// Return -1 in case account can't be found
function getAccountPos(acc_id)
{
	var pos = -1;

	if (!Array.isArray(accounts) || !acc_id)
		return -1;

	accounts.some(function(acc, ind)
	{
		var cond = (acc_id == acc.id);
		if (cond)
			pos = ind;

		return cond;
	});

	return pos;
}


// Return another account id if possible
// Return zero if no account can't be found
function getPrevAccount(acc_id)
{
	var pos;

	if (!Array.isArray(accounts) || accounts.length < 2 || !acc_id)
		return -1;

	pos = getAccountPos(acc_id);
	if (pos == -1)
		return 0;

	pos = ((pos == 0) ? accounts.length - 1 : pos - 1);

	return accounts[pos].id;
}


// Return another account id if possible
// Return zero if no account can't be found
function getNextAccount(acc_id)
{
	var pos;

	if (!Array.isArray(accounts) || accounts.length < 2 || !acc_id)
		return -1;

	pos = getAccountPos(acc_id);
	if (pos == -1)
		return 0;

	pos = ((pos == accounts.length - 1) ? 0 : pos + 1);

	return accounts[pos].id;
}

