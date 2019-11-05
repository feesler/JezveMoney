if (typeof module !== 'undefined' && module.exports)
{
	var URL = require('url').URL;

	var MainView = require('./view/main.js');
	var LoginView = require('./view/login.js');
	var ProfileView = require('./view/profile.js');
	var AccountView = require('./view/account.js');
	var AccountsView = require('./view/accounts.js');
	var PersonView = require('./view/person.js');
	var PersonsView = require('./view/persons.js');
	var TransactionsView = require('./view/transactions.js');
	var ExpenseTransactionView = require('./view/transaction/expense.js');
	var IncomeTransactionView = require('./view/transaction/income.js');
	var TransferTransactionView = require('./view/transaction/transfer.js');
	var DebtTransactionView = require('./view/transaction/debt.js');
	var StatisticsView = require('./view/statistics.js');
}


const testHost = 'jezve.net';


// Process request url and return view class if match
async function route(env, url)
{
	if (typeof url !== 'string')
		throw new Error('URL not specified');

	let reqUrl = new URL(url);
	if (reqUrl.host !== testHost)
		throw new Error('Wrong URL specified: ' + url);

	let path =  reqUrl.pathname.replace(/^\/+|\/+$/g, '');		// cut leading and trailing slashes
	let parts = path.split('/');

	let part, actPart;

	part = parts.shift();
	if (part !== 'money')
		throw new Error('Wrong request path: ' + reqUrl.pathname);

	part = parts.shift();

	if (!part)
		return MainView;

	if (part === 'login')
	{
		return LoginView;
	}
	else if (part === 'profile')
	{
		return ProfileView;
	}
	else if (part === 'accounts')
	{
		actPart = parts.shift();
		if (!actPart)
			return AccountsView;
		else if (actPart === 'new' || actPart === 'edit')
			return AccountView;
		else
			throw new Error('Unknown route: ' + reqUrl.pathname);
	}
	else if (part === 'persons')
	{
		actPart = parts.shift();
		if (!actPart)
			return PersonsView;
		else if (actPart === 'new' || actPart === 'edit')
			return PersonView;
		else
			throw new Error('Unknown route: ' + reqUrl.pathname);
	}
	else if (part === 'transactions')
	{
		actPart = parts.shift();
		if (!actPart)
			return TransactionsView;
		else if (actPart === 'new')
		{
			const trType = reqUrl.searchParams.get('type');
			if (!trType || trType === 'expense')
				return ExpenseTransactionView;
			else if (trType === 'income')
				return IncomeTransactionView;
			else if (trType === 'transfer')
				return TransferTransactionView;
			else if (trType === 'debt')
				return DebtTransactionView;
			else
				throw new Error('Unknown transaction type: ' + trType);
		}
		else if (actPart === 'edit')
		{
			const trType = await env.global('edit_transaction.type');

			if (trType === 1)
				return ExpenseTransactionView;
			else if (trType === 2)
				return IncomeTransactionView;
			else if (trType === 3)
				return TransferTransactionView;
			else if (trType === 4)
				return DebtTransactionView;
			else
				throw new Error('Unknown transaction type: ' + trType);
		}
		else
			throw new Error('Unknown route: ' + reqUrl.pathname);
	}
	else if (part === 'statistics')
		return StatisticsView;
	else
		throw new Error('Unknown route: ' + reqUrl.pathname);
}


if (typeof module !== 'undefined' && module.exports)
{
	module.exports = route;
}
