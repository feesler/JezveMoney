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


var runAccounts = (function()
{


function onAppUpdate(props)
{
	props = props || {};

	if ('App' in props)
		App = props.App;
}


async function createAccount1(view)
{
	var state = { visibility : { heading : true, iconDropDown : true, name : true, currDropDown : true },
					values : { tile : { name : 'New account', balance : '0 ₽' },
							name : '', balance : '0' } };

	await test('Initial state of new account view', async () => {}, view, state);

	setParam(state.values, { tile : { name : 'acc_1' }, name : 'acc_1' });
	await test('Account name input', () => view.inputName('acc_1'), view, state);

// Change currency to USD
	setParam(state.values, { currDropDown : { textValue : 'USD' }, tile : { balance : '$ 0' } });
	await test('Change currency', () => view.changeCurrency(2), view, state);

	setParam(state.values, { tile : { balance : '$ 100 000.01' }, balance : '100000.01' });
	await test('Input balance (100 000.01)', () => view.inputBalance('100000.01'), view, state);

// Change currency back to RUB
	setParam(state.values, { currDropDown : { textValue : 'RUB' }, tile : { balance : '100 000.01 ₽' } });
	await test('Change currency back', () => view.changeCurrency(1), view, state);

// Input empty value for initial balance
	setParam(state.values, { tile : { balance : '0 ₽' }, balance : '' });
	await test('Input empty balance', () => view.inputBalance(''), view, state);

	state.values.balance = '.';
	await test('Input dot (.) balance', () => view.inputBalance('.'), view, state);

	setParam(state.values, { tile : { balance : '0.01 ₽' }, balance : '.01' });
	await test('Input (.01) balance', () => view.inputBalance('.01'), view, state);

	setParam(state.values, { tile : { balance : '10 000 000.01 ₽' }, balance : '10000000.01' });
	await test('Input (10000000.01) balance', () => view.inputBalance('10000000.01'), view, state);

// Change icon to safe
	setParam(state.values, { iconDropDown : { textValue : 'Safe' },
							tile : { icon : view.tileIcons[2] } });
	await test('Change icon', () => view.changeIcon(2), view, state);

	setParam(state.values, { tile : { balance : '1 000.01 ₽' }, balance : '1000.01' });
	await test('Input (1000.01) balance', () => view.inputBalance('1000.01'), view, state);


	return view.navigation(() => view.click(view.content.submitBtn))
			.then(view => checkCreateAccount(view, { name : 'acc_1', balance : 1000.01, curr_id : 1 }));
}


async function checkCreateAccount(view, params)
{
	var state = { value : { tiles : { items : { length : App.accounts.length + 1 } } } };
	var fmtBal = formatCurrency(normalize(params.balance), params.curr_id);

	state.value.tiles.items[App.accounts.length] = { balance : fmtBal, name : params.name, icon : params.icon };

	await test('Account create', async () => {}, view, state);

	App.accounts = view.content.tiles.items;
	App.notify();

	return view;
}


async function createAccount2(view)
{
	var state = { values : { tile : { name : 'acc_2', balance : '0 ₽' }, currDropDown : { textValue : 'RUB' } } };

// Input account name
	await test('Account tile name update', () => view.inputName('acc_2'), view, state);

// Change currency to EUR
	setParam(state.values, { tile : { balance : '€ 0' }, currDropDown : { textValue : 'EUR' } });
	await test('EUR currency select', () => view.changeCurrency(3), view, state);

	state.values.tile.balance = '€ 1 000.01';
	await test('Account tile balance on EUR 1 000.01 balance input field', () => view.inputBalance('1000.01'), view, state);

	return view.navigation(() => view.click(view.content.submitBtn))
			.then(view => checkCreateAccount(view, { name : 'acc_2', balance : 1000.01, curr_id : 3 }));
}


async function editAccount1(view)
{
	var state = { values : { tile : { name : 'acc_1', balance : '1 000.01 ₽', icon : view.tileIcons[2] }, currDropDown : { textValue : 'RUB' } } };

	await test('Initial state of edit account view', async () => {}, view, state);

// Change currency to USD
	var fmtBal = formatCurrency(1000.01, 2);
	setParam(state.values, { tile : { balance : fmtBal }, currDropDown : { textValue : 'USD' } });
	await test('USD currency select', () => view.changeCurrency(2), view, state);

// Change icon to purse
	state.values.tile.icon = view.tileIcons[1];
	await test('Icon change', () => view.changeIcon(1), view, state);

// Submit
	return view.navigation(() => view.click(view.content.submitBtn))
			.then(checkUpdateAccount.bind(null, { updatePos : 0, name : 'acc_1', balance : 1000.01, curr_id : 2, icon : view.tileIcons[1] }));
}


async function checkUpdateAccount(params, view)
{
	var state = { value : { tiles : { items : { length : App.accounts.length } } } };
	var fmtBal = formatCurrency(normalize(params.balance), params.curr_id);

	state.value.tiles.items[params.updatePos] = { balance : fmtBal, name : params.name, icon : params.icon };

	await test('Account update', async () => {}, view, state);

	App.accounts = view.content.tiles.items;
	App.notify();

	return view;
}


async function createAccountWithParam(view, params)
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
	await test('Account tile name update', () => view.inputName(params.name), view, state);

// Change currency
	var fmtBal = formatCurrency(0, currObj.id);
	setParam(state.values, { currDropDown : { textValue : currObj.name }, tile : { balance : fmtBal } });
	await test(currObj.name + ' currency select', () => view.changeCurrency(currObj.id), view, state);

// Input balance
	fmtBal = formatCurrency(normBalance, currObj.id);
	setParam(state.values, { tile : { balance : fmtBal } });
	await test('Tile balance format update', () => view.inputBalance(params.balance), view, state);

// Change icon
	if (params.icon)
	{
		if (params.icon < 0 || params.icon > view.tileIcons.length)
			throw new Error('Icon not found');

		setParam(state.values, { iconDropDown : { textValue : view.tileIcons[params.icon].title }, tile : { icon : view.tileIcons[params.icon] } });
		await test('Tile icon update', () => view.changeIcon(params.icon), view, state);
	}

	return view.navigation(() => view.click(view.content.submitBtn))
			.then(view => checkCreateAccount(view, params));
}


function deleteAccounts(view, accounts)
{
	return view.deleteAccounts(accounts)
			.then(async view =>
			{
				var state = { value : { tiles : { items : { length : App.accounts.length - accounts.length } } } };

				await test('Delete accounts [' + accounts.join() + ']', async () => {}, view, state);

				App.accounts = view.content.tiles.items;
				App.notify();

				return view;
			});
}


	return { onAppUpdate : onAppUpdate,
					createAccount1 : createAccount1,
					checkCreateAccount : checkCreateAccount,
					createAccount2 : createAccount2,
					editAccount1 : editAccount1,
					checkUpdateAccount : checkUpdateAccount,
					create : createAccountWithParam,
					del : deleteAccounts };
})();


if (typeof module !== 'undefined' && module.exports)
{
	module.exports = runAccounts;
}
