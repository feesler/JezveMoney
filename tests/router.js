import { MainView } from './view/main.js';
import { LoginView } from './view/login.js';
import { RegisterView } from './view/register.js';
import { ProfileView } from './view/profile.js';
import { AccountView } from './view/account.js';
import { AccountsView } from './view/accounts.js';
import { PersonView } from './view/person.js';
import { PersonsView } from './view/persons.js';
import { TransactionsView } from './view/transactions.js';
import { ExpenseTransactionView } from './view/transaction/expense.js';
import { IncomeTransactionView } from './view/transaction/income.js';
import { TransferTransactionView } from './view/transaction/transfer.js';
import { DebtTransactionView } from './view/transaction/debt.js';
import { StatisticsView } from './view/statistics.js';


// Process request url and return view class if match
async function route(env, url)
{
	if (typeof url !== 'string')
		throw new Error('URL not specified');

	let testUrl = new URL(env.baseUrl());

	let reqUrl = new URL(url);
	if (reqUrl.host !== testUrl.host)
		throw new Error('Wrong URL specified: ' + url);

	// Remove leading directory if needed
	let reqPath = reqUrl.pathname;
	if (reqPath.indexOf(testUrl.pathname) === 0)
	{
		reqPath = reqPath.substr(testUrl.pathname.length);
	}

	let path = reqPath.replace(/^\/+|\/+$/g, '');		// cut leading and trailing slashes
	let parts = path.split('/');

	let part, actPart;

	part = parts.shift();

	if (!part)
		return MainView;

	if (part === 'login')
	{
		return LoginView;
	}
	else if (part === 'register')
	{
		return RegisterView;
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


export { route };
