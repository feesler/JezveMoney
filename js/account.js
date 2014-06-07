// Return currency id of specified account
function getCurrencyOfAccount(account_id)
{
	var curr_id = 0;

	account_id = parseInt(account_id);
	if (!account_id)
		return curr_id;

	accounts.some(function(acc)
	{
		if (acc[0] == account_id)
			curr_id = acc[1];

		return (acc[0] == account_id);
	});

	return curr_id;
}


// Return balance of specified account
function getBalanceOfAccount(account_id)
{
	var balance = 0;

	account_id = parseInt(account_id);
	if (!account_id)
		return balance;

	accounts.some(function(acc)
	{
		if (acc[0] == account_id)
			balance = acc[3];

		return (acc[0] == account_id);
	});

	return balance;
}


// Return name of specified account
function getNameOfAccount(account_id)
{
	var name = '';

	account_id = parseInt(account_id);
	if (!account_id)
		return name;

	accounts.some(function(acc)
	{
		if (acc[0] == account_id)
			name = acc[4];

		return (acc[0] == account_id);
	});

	return name;
}


// Return icon type за specified account
function getIconOfAccount(account_id)
{
	var iconType = 0;

	account_id = parseInt(account_id);
	if (!account_id)
		return iconType;

	accounts.some(function(acc)
	{
		if (acc[0] == account_id)
			iconType = acc[5];

		return (acc[0] == account_id);
	});

	return iconType;
}


// Format balance of account value with currency
function formatAccoutBalance(acc_id)
{
	return formatCurrency(getBalanceOfAccount(acc_id), getCurrencyOfAccount(acc_id));
}


// Update tile information
function setTileInfo(tile_id, title, subTitle, iconType)
{
	var tileObj, titleObj, subTitleObj, tileClass;

	tileObj = ge(tile_id);
	if (!tileObj)
		return;

	subTitleObj = tileObj.firstElementChild.firstElementChild.firstElementChild;
	if (subTitleObj)
		subTitleObj.innerHTML = subTitle;

	titleObj = subTitleObj.nextElementSibling;
	if (titleObj)
		titleObj.innerHTML = title;

	iconType = iconType | 0;
	tileClass = "tile";
	if (iconType == 1)
		tileClass += " purse_icon";
	else if (iconType == 2)
		tileClass += " safe_icon";
	else if (iconType == 3)
		tileClass += " card_icon";
	else if (iconType == 4)
		tileClass += " percent_icon";
	else if (iconType == 5)
		tileClass += " bank_icon";
	else if (iconType == 6)
		tileClass += " cash_icon";
	tileObj.className = tileClass;
}


// Set source tile to the specified account
function setTileAccount(tile_id, acc_id)
{
	var name, formatBalance, balance, icon;

	if (!tile_id || !acc_id)
		return;

	name = getNameOfAccount(acc_id);
	balance = getBalanceOfAccount(acc_id);

	if (edit_mode && (acc_id == transaction.srcAcc || acc_id == transaction.destAcc))
		balance += ((acc_id == transaction.srcAcc) ? transaction.charge : -transaction.amount);
	formatBalance = formatCurrency(balance, getCurrencyOfAccount(acc_id));

	icon = getIconOfAccount(acc_id);

	setTileInfo(tile_id, name, formatBalance, icon);
}


// Return current position of account in accounts array
// Return -1 in case account can't be found
function getAccountPos(acc_id)
{
	var i, pos = -1;

	if (!isArray(accounts) || !acc_id)
		return -1;

	for(i = 0; i < accounts.length; i++)
	{
		if (acc_id == accounts[i][0])
		{
			pos = i;
			break;
		}
	}

	return pos;
}