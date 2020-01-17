import { api } from './api.js';


class AppState
{
	constructor(app)
	{
		this.app = app;

		this.accounts = null;
		this.persons = null;
		this.currencies = [];
		this.transactions = [];

		api.setEnv(app);
	}


	async getAccountsList()
	{
		if (!Array.isArray(this.accounts))
			this.accounts = await api.account.list(true);

		return this.accounts;
	}


	async getUserAccountsList()
	{
		let accList = await this.getAccountsList();

		return accList.filter(item => item.owner_id == this.app.owner_id);
	}


	async getAccount(acc_id)
	{
		let id = parseInt(acc_id);
		if (!id || isNaN(id))
			return null;

		if (!Array.isArray(this.accounts))
			this.accounts = await api.account.list(true);

		let accObj = this.accounts.find(item => item.id == id);

		return accObj;
	}


	async getAccountByPos(accPos)
	{
		let pos = parseInt(accPos);
		if (isNaN(pos))
			return null;

		let userAccounts = await this.getUserAccountsList();
		if (pos < 0 || pos >= userAccounts.length)
			return null;

		let accObj = userAccounts[pos];

		return accObj;
	}


	// Return current position of account in accounts array
	// Return -1 in case account can't be found
	async getAccountPos(acc_id)
	{
		let userAccounts = await this.getUserAccountsList();

		return userAccounts.findIndex(item => item.id == acc_id);
	}


	// Return another user account id if possible
	// Return zero if no account found
	async getNextAccount(acc_id)
	{
		if (!acc_id)
			return 0;

		let userAccounts = await this.getUserAccountsList();

		if (!Array.isArray(userAccounts) || userAccounts.length < 2)
			return 0;

		let pos = await this.getAccountPos(acc_id);
		if (pos === -1)
			return 0;

		pos = ((pos == userAccounts.length - 1) ? 0 : pos + 1);

		return userAccounts[pos].id;
	}


	async getPersonsList()
	{
		if (!Array.isArray(this.persons))
			this.persons = await api.person.list();

		return this.persons;
	}


	async getPerson(person_id)
	{
		let id = parseInt(person_id);
		if (!id || isNaN(id))
			return null;

		if (!Array.isArray(this.persons))
			this.persons = await api.person.list();

		let personObj = this.persons.find(item => item.id == id);

		return personObj;
	}


	async getPersonByPos(personPos)
	{
		let pos = parseInt(personPos);
		if (isNaN(pos))
			return null;

		if (!Array.isArray(this.persons))
			this.persons = await api.person.list();

		if (pos < 0 || pos >= this.persons.length)
			return null;

		let personObj = this.persons[pos];

		return personObj;
	}


	async getPersonAccount(person_id, currency_id)
	{
		let p_id = parseInt(person_id);
		let curr_id = parseInt(currency_id);
		if (!p_id || !curr_id)
			return null;

		if (!Array.isArray(this.accounts))
			this.accounts = await api.account.list(true);

		let accObj = this.accounts.find(item => item.owner_id == p_id &&
												item.curr_id == curr_id);

		return accObj;
	}


	// Apply transaction to accounts
	applyTransaction(accList, transObj)
	{
		let res = this.app.copyObject(accList);

		let srcAcc = res.find(item => item.id == transObj.src_id);
		if (srcAcc)
			srcAcc.balance -= transObj.src_amount;

		let destAcc = res.find(item => item.id == transObj.dest_id);
		if (destAcc)
			destAcc.balance += transObj.dest_amount;

		return res;
	}


	// Cancel transaction to accounts
	cancelTransaction(accList, transObj)
	{
		let res = this.app.copyObject(accList);

		let srcAcc = res.find(item => item.id == transObj.src_id);
		if (srcAcc)
			srcAcc.balance += transObj.src_amount;

		let destAcc = res.find(item => item.id == transObj.dest_id);
		if (destAcc)
			destAcc.balance -= transObj.dest_amount;

		return res;
	}


	createTransaction(accList, transObj)
	{
		return this.applyTransaction(accList, transObj);
	}


	updateTransaction(accList, origTransaction, newTransaction)
	{
		let afterCancel = this.cancelTransaction(accList, origTransaction);
		return this.applyTransaction(afterCancel, newTransaction);
	}


	deleteTransaction(accList, transObj)
	{
		return this.cancelTransaction(accList, transObj);
	}


	accountToTile(account)
	{
		let res = {};

		res.balance = this.app.formatCurrency(account.balance, account.curr_id, this.app.currencies);
		res.name = account.name;

		return res;
	}


	personToTile(person)
	{
		let res = {};

		res.title = person.name;

		let debtAccounts = this.app.filterPersonDebts(this.app, person.accounts);
		res.subtitle = debtAccounts.length ? debtAccounts.join('\n') : 'No debts';

		return res;
	}


	async transactionToListItem(transObj)
	{
		let app = this.app;
		let res = {};

		let srcAcc = await this.getAccount(transObj.src_id);
		let destAcc = await this.getAccount(transObj.dest_id);

		if (transObj.type == app.EXPENSE)
		{
			res.amountText = '- ' + app.formatCurrency(transObj.src_amount, transObj.src_curr, app.currencies);
			if (transObj.src_curr != transObj.dest_curr)
			{
				res.amountText += ' (- ' + app.formatCurrency(transObj.dest_amount, transObj.dest_curr, app.currencies) + ')';
			}

			res.accountTitle = srcAcc.name;
		}
		else if (transObj.type == app.INCOME)
		{
			res.amountText = '+ ' + app.formatCurrency(transObj.src_amount, transObj.src_curr, app.currencies);
			if (transObj.src_curr != transObj.dest_curr)
			{
				res.amountText += ' (+ ' + app.formatCurrency(transObj.dest_amount, transObj.dest_curr, app.currencies) + ')';
			}

			res.accountTitle = destAcc.name;
		}
		else if (transObj.type == app.TRANSFER)
		{
			res.amountText = app.formatCurrency(transObj.src_amount, transObj.src_curr, app.currencies);
			if (transObj.src_curr != transObj.dest_curr)
			{
				res.amountText += ' (' + app.formatCurrency(transObj.dest_amount, transObj.dest_curr, app.currencies) + ')';
			}

			res.accountTitle = srcAcc.name + ' → ' + destAcc.name;
		}
		else if (transObj.type == app.DEBT)
		{
			res.accountTitle = '';
			let debtType = (!!srcAcc && srcAcc.owner_id != app.owner_id);
			let personAcc = debtType ? srcAcc : destAcc;
			let person = await this.getPerson(personAcc.owner_id);
			let acc = debtType ? destAcc : srcAcc;

			if (debtType)
			{
				res.accountTitle = person.name;
				if (acc)
					res.accountTitle += ' → ' + acc.name;
				res.amountText = (acc) ? '+ ' : '- ';
			}
			else
			{
				if (acc)
					res.accountTitle = acc.name + ' → ';
				res.accountTitle += person.name;
				res.amountText = (srcAcc) ? '- ' : '+ ';
			}

			res.amountText += app.formatCurrency(transObj.src_amount, personAcc.curr_id, app.currencies);
		}

		res.dateFmt = transObj.date;
		res.comment = transObj.comment;

		return res;
	}


	renderAccountsWidget(accList)
	{
		let res = { tiles : {} };

		res.tiles.items = accList.map(item => this.accountToTile(item));

		return res;
	}


	renderPersonsWidget(personsList)
	{
		let res = { infoTiles : {} };

		res.infoTiles.items = personsList.map(item => this.personToTile(item));

		return res;
	}


	async renderTransactionsList(transactionsList)
	{
		let res = [];

		for(let item of transactionsList)
		{
			let listItem = await this.transactionToListItem(item);
			res.push(listItem);
		}

		return res;
	}


	async renderTransactionsWidget(transactionsList)
	{
		let res = { title : 'Transactions', transList : {} };

		let latestTransactionsList = this.app.copyObject(transactionsList)
										.splice(0, this.app.config.latestTransactions);

		res.transList.items = await this.renderTransactionsList(latestTransactionsList);

		return res;
	}


	async render(accountList, personList, transactionList)
	{
		let res = { values : { widgets : { length : this.app.config.widgetsCount } } };

		// Accounts widget
		let accWidget = this.renderAccountsWidget(accountList);
		res.values.widgets[this.app.config.AccountsWidgetPos] = accWidget;
		// Persons widget
		let personsWidget = this.renderPersonsWidget(personList);
		res.values.widgets[this.app.config.PersonsWidgetPos] = personsWidget;
		// Transactions widget
		let transWidget = await this.renderTransactionsWidget(transactionList);
		res.values.widgets[this.app.config.LatestWidgetPos] = transWidget;

		return res;
	}
}


export { AppState };
