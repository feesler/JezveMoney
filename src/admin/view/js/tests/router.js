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
		return MainPage;

	if (part === 'login')
	{
		return LoginPage;
	}
	else if (part === 'profile')
	{
		return ProfilePage;
	}
	else if (part === 'accounts')
	{
		actPart = parts.shift();
		if (!actPart)
			return AccountsPage;
		else if (actPart === 'new' || actPart === 'edit')
			return AccountPage;
		else
			throw new Error('Unknown route: ' + reqUrl.pathname);
	}
	else if (part === 'persons')
	{
		actPart = parts.shift();
		if (!actPart)
			return PersonsPage;
		else if (actPart === 'new' || actPart === 'edit')
			return PersonPage;
		else
			throw new Error('Unknown route: ' + reqUrl.pathname);
	}
	else if (part === 'transactions')
	{
		actPart = parts.shift();
		if (!actPart)
			return TransactionsPage;
		else if (actPart === 'new')
		{
			const trType = reqUrl.searchParams.get('type');
			if (!trType || trType === 'expense')
				return ExpenseTransactionPage;
			else if (trType === 'income')
				return IncomeTransactionPage;
			else if (trType === 'transfer')
				return TransferTransactionPage;
			else if (trType === 'debt')
				return DebtTransactionPage;
			else
				throw new Error('Unknown transaction type: ' + trType);
		}
		else if (actPart === 'edit')
		{
			const trType = await env.global('edit_transaction.type');

			if (trType === 1)
				return ExpenseTransactionPage;
			else if (trType === 2)
				return IncomeTransactionPage;
			else if (trType === 3)
				return TransferTransactionPage;
			else if (trType === 4)
				return DebtTransactionPage;
			else
				throw new Error('Unknown transaction type: ' + trType);
		}
		else
			throw new Error('Unknown route: ' + reqUrl.pathname);
	}
	else if (part === 'statistics')
		return StatisticsPage;
	else
		throw new Error('Unknown route: ' + reqUrl.pathname);
}

