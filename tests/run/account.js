var runAccounts = (function()
{
	let test = null;


	async function createAccount1(app)
	{
		test = app.test;

		var state = { visibility : { heading : true, iconDropDown : true, name : true, currDropDown : true },
						values : { tile : { name : 'New account', balance : '0 ₽' },
								name : '', balance : '0' } };

		await test('Initial state of new account view', async () => {}, app.view, state);

		app.setParam(state.values, { tile : { name : 'acc_1' }, name : 'acc_1' });
		await test('Account name input', () => app.view.inputName('acc_1'), app.view, state);

	// Change currency to USD
		app.setParam(state.values, { currDropDown : { textValue : 'USD' }, tile : { balance : '$ 0' } });
		await test('Change currency', () => app.view.changeCurrency(2), app.view, state);

		app.setParam(state.values, { tile : { balance : '$ 100 000.01' }, balance : '100000.01' });
		await test('Input balance (100 000.01)', () => app.view.inputBalance('100000.01'), app.view, state);

	// Change currency back to RUB
		app.setParam(state.values, { currDropDown : { textValue : 'RUB' }, tile : { balance : '100 000.01 ₽' } });
		await test('Change currency back', () => app.view.changeCurrency(1), app.view, state);

	// Input empty value for initial balance
		app.setParam(state.values, { tile : { balance : '0 ₽' }, balance : '' });
		await test('Input empty balance', () => app.view.inputBalance(''), app.view, state);

		state.values.balance = '.';
		await test('Input dot (.) balance', () => app.view.inputBalance('.'), app.view, state);

		app.setParam(state.values, { tile : { balance : '0.01 ₽' }, balance : '.01' });
		await test('Input (.01) balance', () => app.view.inputBalance('.01'), app.view, state);

		app.setParam(state.values, { tile : { balance : '10 000 000.01 ₽' }, balance : '10000000.01' });
		await test('Input (10000000.01) balance', () => app.view.inputBalance('10000000.01'), app.view, state);

	// Change icon to safe
		app.setParam(state.values, { iconDropDown : { textValue : 'Safe' },
								tile : { icon : app.view.tileIcons[2] } });
		await test('Change icon', () => app.view.changeIcon(2), app.view, state);

		app.setParam(state.values, { tile : { balance : '1 000.01 ₽' }, balance : '1000.01' });
		await test('Input (1000.01) balance', () => app.view.inputBalance('1000.01'), app.view, state);

		app.accountsCache = null;

		await app.view.navigation(() => app.view.click(app.view.content.submitBtn));
		await checkCreateAccount(app, { name : 'acc_1', balance : 1000.01, curr_id : 1 });
	}


	async function checkCreateAccount(app, params)
	{
		test = app.test;

		var state = { value : { tiles : { items : { length : app.accounts.length + 1 } } } };
		var fmtBal = app.formatCurrency(app.normalize(params.balance), params.curr_id, app.currencies);

		state.value.tiles.items[app.accounts.length] = { balance : fmtBal, name : params.name, icon : params.icon };

		await test('Account create', async () => {}, app.view, state);

		app.accounts = app.view.content.tiles.items;
	}


	async function createAccount2(app)
	{
		test = app.test;

		var state = { values : { tile : { name : 'acc_2', balance : '0 ₽' }, currDropDown : { textValue : 'RUB' } } };

	// Input account name
		await test('Account tile name update', () => app.view.inputName('acc_2'), app.view, state);

	// Change currency to EUR
		app.setParam(state.values, { tile : { balance : '€ 0' }, currDropDown : { textValue : 'EUR' } });
		await test('EUR currency select', () => app.view.changeCurrency(3), app.view, state);

		state.values.tile.balance = '€ 1 000.01';
		await test('Account tile balance on EUR 1 000.01 balance input field', () => app.view.inputBalance('1000.01'), app.view, state);

		app.accountsCache = null;

		await app.view.navigation(() => app.view.click(app.view.content.submitBtn));
		await checkCreateAccount(app, { name : 'acc_2', balance : 1000.01, curr_id : 3 });
	}


	async function editAccount1(app)
	{
		test = app.test;

		var state = { values : { tile : { name : 'acc_1', balance : '1 000.01 ₽', icon : app.view.tileIcons[2] }, currDropDown : { textValue : 'RUB' } } };

		await test('Initial state of edit account view', async () => {}, app.view, state);

	// Change currency to USD
		var fmtBal = app.formatCurrency(1000.01, 2, app.currencies);
		app.setParam(state.values, { tile : { balance : fmtBal }, currDropDown : { textValue : 'USD' } });
		await test('USD currency select', () => app.view.changeCurrency(2), app.view, state);

	// Change icon to purse
		state.values.tile.icon = app.view.tileIcons[1];
		await test('Icon change', () => app.view.changeIcon(1), app.view, state);

		app.accountsCache = null;

	// Submit
		await app.view.navigation(() => app.view.click(app.view.content.submitBtn));
		await checkUpdateAccount(app, { updatePos : 0,
										name : 'acc_1',
										balance : 1000.01,
										curr_id : 2,
										icon : app.view.tileIcons[1] });
	}


	async function checkUpdateAccount(app, params)
	{
		test = app.test;

		var state = { value : { tiles : { items : { length : app.accounts.length } } } };
		var fmtBal = app.formatCurrency(app.normalize(params.balance), params.curr_id, app.currencies);

		state.value.tiles.items[params.updatePos] = { balance : fmtBal, name : params.name, icon : params.icon };

		await test('Account update', async () => {}, app.view, state);

		app.accounts = app.view.content.tiles.items;
	}


	async function createAccountWithParam(app, params)
	{
		test = app.test;

		if (!params)
			throw new Error('No params specified');
		if (!params.name || !params.name.length)
			throw new Error('Name not specified');
		var currObj = app.getCurrency(params.curr_id, app.currencies);
		if (!currObj)
			throw new Error('Wrong currency specified');
		var normBalance = app.normalize(params.balance);
		if (isNaN(normBalance))
			throw new Error('Balance not specified');

		var state = { values : { tile : { name : params.name }, name : params.name } };

	// Input account name
		await test('Account tile name update', () => app.view.inputName(params.name), app.view, state);

	// Change currency
		var fmtBal = app.formatCurrency(0, currObj.id, app.currencies);
		app.setParam(state.values, { currDropDown : { textValue : currObj.name }, tile : { balance : fmtBal } });
		await test(currObj.name + ' currency select', () => app.view.changeCurrency(currObj.id), app.view, state);

	// Input balance
		fmtBal = app.formatCurrency(normBalance, currObj.id, app.currencies);
		app.setParam(state.values, { tile : { balance : fmtBal } });
		await test('Tile balance format update', () => app.view.inputBalance(params.balance), app.view, state);

	// Change icon
		if (params.icon)
		{
			if (params.icon < 0 || params.icon > app.view.tileIcons.length)
				throw new Error('Icon not found');

			app.setParam(state.values, { iconDropDown : { textValue : app.view.tileIcons[params.icon].title }, tile : { icon : app.view.tileIcons[params.icon] } });
			await test('Tile icon update', () => app.view.changeIcon(params.icon), app.view, state);
		}

		app.accountsCache = null;

		await app.view.navigation(() => app.view.click(app.view.content.submitBtn));
		await checkCreateAccount(app, params);
	}


	async function deleteAccounts(app, accounts)
	{
		test = app.test;

		app.accountsCache = null;

		await app.view.deleteAccounts(accounts);

		var state = { value : { tiles : { items : { length : app.accounts.length - accounts.length } } } };

		await test('Delete accounts [' + accounts.join() + ']', async () => {}, app.view, state);

		app.accounts = app.view.content.tiles.items;
	}


	return { createAccount1,
				checkCreateAccount,
				createAccount2,
				editAccount1,
				checkUpdateAccount,
				create : createAccountWithParam,
				del : deleteAccounts };
})();


export { runAccounts };
