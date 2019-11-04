if (typeof module !== 'undefined' && module.exports)
{
	const common = require('../common.js');
	var test = common.test;
	var setParam = common.setParam;
	var isArray = common.isArray;
	var idSearch = common.idSearch;
	var normalize = common.normalize;
	var formatCurrency = common.formatCurrency;
	var getCurrency = common.getCurrency;

	var App = null;
}


function onAppUpdateAccounts(props)
{
	props = props || {};

	if ('App' in props)
		App = props.App;
}


async function createAccount1(page)
{
	var state = { visibility : { heading : true, iconDropDown : true, name : true, currDropDown : true },
					values : { tile : { name : 'New account', balance : '0 ₽' },
							name : '', balance : '0' } };

	await test('Initial state of new account page', async () => {}, page, state);

	setParam(state.values, { tile : { name : 'acc_1' }, name : 'acc_1' });
	await test('Account name input', () => page.inputName('acc_1'), page, state);

// Change currency to USD
	setParam(state.values, { currDropDown : { textValue : 'USD' }, tile : { balance : '$ 0' } });
	await test('Change currency', () => page.changeCurrency(2), page, state);

	setParam(state.values, { tile : { balance : '$ 100 000.01' }, balance : '100000.01' });
	await test('Input balance (100 000.01)', () => page.inputBalance('100000.01'), page, state);

// Change currency back to RUB
	setParam(state.values, { currDropDown : { textValue : 'RUB' }, tile : { balance : '100 000.01 ₽' } });
	await test('Change currency back', () => page.changeCurrency(1), page, state);

// Input empty value for initial balance
	setParam(state.values, { tile : { balance : '0 ₽' }, balance : '' });
	await test('Input empty balance', () => page.inputBalance(''), page, state);

	state.values.balance = '.';
	await test('Input dot (.) balance', () => page.inputBalance('.'), page, state);

	setParam(state.values, { tile : { balance : '0.01 ₽' }, balance : '.01' });
	await test('Input (.01) balance', () => page.inputBalance('.01'), page, state);

	setParam(state.values, { tile : { balance : '10 000 000.01 ₽' }, balance : '10000000.01' });
	await test('Input (10000000.01) balance', () => page.inputBalance('10000000.01'), page, state);

// Change icon to safe
	setParam(state.values, { iconDropDown : { textValue : 'Safe' },
							tile : { icon : page.tileIcons[2] } });
	await test('Change icon', () => page.changeIcon(2), page, state);

	setParam(state.values, { tile : { balance : '1 000.01 ₽' }, balance : '1000.01' });
	await test('Input (1000.01) balance', () => page.inputBalance('1000.01'), page, state);


	return page.navigation(() => page.click(page.content.submitBtn))
			.then(page => checkCreateAccount(page, { name : 'acc_1', balance : 1000.01, curr_id : 1 }));
}


async function checkCreateAccount(page, params)
{
	var state = { value : { tiles : { length : App.accounts.length + 1 } } };
	var fmtBal = formatCurrency(normalize(params.balance), params.curr_id);

	state.value.tiles[App.accounts.length] = { balance : fmtBal, name : params.name, icon : params.icon };

	await test('Account create', async () => {}, page, state);

	App.accounts = page.content.tiles;
	App.notify();

	return page;
}


async function createAccount2(page)
{
	var state = { values : { tile : { name : 'acc_2', balance : '0 ₽' }, currDropDown : { textValue : 'RUB' } } };

// Input account name
	await test('Account tile name update', () => page.inputName('acc_2'), page, state);

// Change currency to EUR
	setParam(state.values, { tile : { balance : '€ 0' }, currDropDown : { textValue : 'EUR' } });
	await test('EUR currency select', () => page.changeCurrency(3), page, state);

	state.values.tile.balance = '€ 1 000.01';
	await test('Account tile balance on EUR 1 000.01 balance input field', () => page.inputBalance('1000.01'), page, state);

	return page.navigation(() => page.click(page.content.submitBtn))
			.then(page => checkCreateAccount(page, { name : 'acc_2', balance : 1000.01, curr_id : 3 }));
}


async function editAccount1(page)
{
	var state = { values : { tile : { name : 'acc_1', balance : '1 000.01 ₽', icon : page.tileIcons[2] }, currDropDown : { textValue : 'RUB' } } };

	await test('Initial state of edit account page', async () => {}, page, state);

// Change currency to USD
	var fmtBal = formatCurrency(1000.01, 2);
	setParam(state.values, { tile : { balance : fmtBal }, currDropDown : { textValue : 'USD' } });
	await test('USD currency select', () => page.changeCurrency(2), page, state);

// Change icon to purse
	state.values.tile.icon = page.tileIcons[1];
	await test('Icon change', () => page.changeIcon(1), page, state);

// Submit
	return page.navigation(() => page.click(page.content.submitBtn))
			.then(checkUpdateAccount.bind(null, { updatePos : 0, name : 'acc_1', balance : 1000.01, curr_id : 2, icon : page.tileIcons[1] }));
}


async function checkUpdateAccount(params, page)
{
	var state = { value : { tiles : { length : App.accounts.length } } };
	var fmtBal = formatCurrency(normalize(params.balance), params.curr_id);

	state.value.tiles[params.updatePos] = { balance : fmtBal, name : params.name, icon : params.icon };

	await test('Account update', async () => {}, page, state);

	App.accounts = page.content.tiles;
	App.notify();

	return page;
}


async function createAccountWithParam(page, params)
{
	if (!params)
		throw new Error('No params specified');
	if (!params.name || !params.name.length)
		throw new Error('Name not specified');
	var currObj = getCurrency(params.curr_id);
	if (!currObj)
		throw new Error('Wrong currency specified');
	var normBalance = normalize(params.balance);
	if (isNaN(normBalance))
		throw new Error('Balance not specified');

	var state = { values : { tile : { name : params.name }, name : params.name } };

// Input account name
	await test('Account tile name update', () => page.inputName(params.name), page, state);

// Change currency
	var fmtBal = formatCurrency(0, currObj.id);
	setParam(state.values, { currDropDown : { textValue : currObj.name }, tile : { balance : fmtBal } });
	await test(currObj.name + ' currency select', () => page.changeCurrency(currObj.id), page, state);

// Input balance
	fmtBal = formatCurrency(normBalance, currObj.id);
	setParam(state.values, { tile : { balance : fmtBal } });
	await test('Tile balance format update', () => page.inputBalance(params.balance), page, state);

// Change icon
	if (params.icon)
	{
		if (params.icon < 0 || params.icon > page.tileIcons.length)
			throw new Error('Icon not found');

		setParam(state.values, { iconDropDown : { textValue : page.tileIcons[params.icon].title }, tile : { icon : page.tileIcons[params.icon] } });
		await test('Tile icon update', () => page.changeIcon(params.icon), page, state);
	}

	return page.navigation(() => page.click(page.content.submitBtn))
			.then(page => checkCreateAccount(page, params));
}


function deleteAccounts(page, accounts)
{
	return page.deleteAccounts(accounts)
			.then(async page =>
			{
				var state = { value : { tiles : { length : App.accounts.length - accounts.length } } };

				await test('Delete accounts [' + accounts.join() + ']', async () => {}, page, state);

				App.accounts = page.content.tiles;
				App.notify();

				return page;
			});
}


var runAccounts = { onAppUpdate : onAppUpdateAccounts,
					createAccount1 : createAccount1,
					checkCreateAccount : checkCreateAccount,
					createAccount2 : createAccount2,
					editAccount1 : editAccount1,
					checkUpdateAccount : checkUpdateAccount,
					createAccountWithParam : createAccountWithParam,
					deleteAccounts : deleteAccounts };


if (typeof module !== 'undefined' && module.exports)
{
	module.exports = runAccounts;
}
