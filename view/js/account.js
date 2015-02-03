// Decompress array of accounts
function decompressAccounts()
{
	var decAccounts = [];

	accounts.forEach(function(acc)
	{
		decAccounts.push({
			id : acc[0],
			curr_id : acc[1],
			sign : acc[2],
			balance : acc[3],
			name : acc[4],
			icon : acc[5],
			initbalance : acc[6]
		});
	});

	accounts = decAccounts;
}


// Return account object by id
function getAccount(account_id)
{
	var res = null;

	account_id = parseInt(account_id);
	if (!account_id)
		return res;

	accounts.some(function(acc)
	{
		var cond = (acc.id == account_id);

		if (cond)
			res = acc;

		return cond;
	});

	return res;
}


// Return person account object by id
function getPersonAccount(account_id)
{
	var res = null;

	account_id = parseInt(account_id);
	if (!account_id)
		return res;

	persons.some(function(p)
	{
		if (!p || p.length < 3)
			return false;

		return p[2].some(function(acc)
		{
			if (acc[0] == account_id)
				res = acc;

			return (acc[0] == account_id);
		});
	});

	return res;
}


// Format balance of account value with currency
function formatAccoutBalance(acc_id)
{
	var acc = getAccount(acc_id);

	if (!acc)
		return null;

	return formatCurrency(acc.balance, acc.curr_id);
}


// Update tile information
function setTileInfo(tile_id, title, subTitle, iconType)
{
	var tileObj, titleObj, subTitleObj;
	var tileIcons = [null, 'purse_icon', 'safe_icon', 'card_icon', 'percent_icon', 'bank_icon', 'cash_icon'];

	tileObj = ge(tile_id);
	if (!tileObj)
		return;

	subTitleObj = firstElementChild(firstElementChild(firstElementChild(tileObj)));
	if (subTitleObj)
		subTitleObj.innerHTML = subTitle;

	titleObj = nextElementSibling(subTitleObj);
	if (titleObj)
		titleObj.innerHTML = title;

	iconType = iconType | 0;
	tileObj.className = 'tile';
	if (iconType <= tileIcons.length && tileIcons[iconType])
	{
		addClass(tileObj, ['tile_icon', tileIcons[iconType]]);
	}
}


// Set source tile to the specified account
function setTileAccount(tile_id, acc_id)
{
	var acc = getAccount(acc_id);
	if (!acc)
		return;

	setTileInfo(tile_id, acc.name, formatCurrency(acc.balance, acc.curr_id), acc.icon);
}


// Return current position of account in accounts array
// Return -1 in case account can't be found
function getAccountPos(acc_id)
{
	var pos = -1;

	if (!isArray(accounts) || !acc_id)
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

	if (!isArray(accounts) || accounts.length < 2 || !acc_id)
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

	if (!isArray(accounts) || accounts.length < 2 || !acc_id)
		return -1;

	pos = getAccountPos(acc_id);
	if (pos == -1)
		return 0;

	pos = ((pos == accounts.length - 1) ? 0 : pos + 1);

	return accounts[pos].id;
}

