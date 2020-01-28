import { api } from './api.js';
import { Currency } from './currency.js';


class AppState
{
	constructor(app)
	{
		this.app = app;

		this.accounts = null;
		this.persons = null;
		this.transactions = null;

		api.setEnv(app);
	}


	// Return id of item with specified index(absolute position) in list
	posToId(list, pos)
	{
		if (!Array.isArray(list))
			throw new Error('Invalid list specified');

		let ind = parseInt(pos);
		if (isNaN(ind) || ind < 0 || ind >= list.length)
			throw new Error(`Invalid position ${pos} specified`);

		let item = list[pos];

		return item.id;
	}


	positionsToIds(list, positions)
	{
		if (!Array.isArray(list))
			throw new Error('Invalid list specified');

		let posList = Array.isArray(positions) ? positions : [ positions ];

		return posList.map(item => this.posToId(list, item));
	}


	deleteByIds(list, ids)
	{
		if (!Array.isArray(list) || !ids)
			throw new Error('Unexpected input');

		if (!Array.isArray(ids))
			ids = [ ids ];

		let res = this.app.copyObject(list);
		for(let id of ids)
		{
			let ind = res.findIndex(item => item.id == id);
			if (ind !== -1)
				res.splice(ind, 1);
		}

		return res;
	}


/**
 * Accounts
 */

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
			this.accounts = await this.getAccountsList();

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

/**
 * Persons
 */

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
			this.persons = await this.getPersonsList();

		let personObj = this.persons.find(item => item.id == id);

		return personObj;
	}


	async getPersonByPos(personPos)
	{
		let pos = parseInt(personPos);
		if (isNaN(pos))
			return null;

		if (!Array.isArray(this.persons))
			this.persons = await this.getPersonsList();

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
			this.accounts = await this.getAccountsList();

		let accObj = this.accounts.find(item => item.owner_id == p_id &&
												item.curr_id == curr_id);

		return accObj;
	}


	// Format non-zero balances of person accounts
	// Return array of strings
	filterPersonDebts(accounts)
	{
		if (!Array.isArray(accounts))
			throw new Error('Unexpected input');

		let res = accounts.filter(item => item.balance != 0)
							.map(item => Currency.format(item.curr_id, item.balance));

		return res;
	}


/**
 * Transactions
 */
	async getTransactionsList()
	{
		if (!Array.isArray(this.transactions))
			this.transactions = await api.transaction.list();

		return this.transactions;
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


	deleteTransactions(accList, transactions)
	{
		let transList = Array.isArray(transactions) ? transactions : [ transactions ];
		let res = accList;

		for(let transObj of transList)
		{
			res = this.cancelTransaction(res, transObj);
		}

		return res;
	}


	// Return expected list of transactions after update specified account
	updateAccount(trList, accList, account)
	{
		let origAcc = accList.find(item => item.id == account.id);
		if (!origAcc)
			throw new Error('Specified account not found in the original list');

		if (origAcc.curr_id == account.curr_id)
		return trList;

		let res = [];
		for(let trans of trList)
		{
			let convTrans = this.app.copyObject(trans);

			if (convTrans.src_id == account.id)
			{
				convTrans.src_curr = account.curr_id;
				convTrans.src_amount = convTrans.dest_amount;
			}
			if (convTrans.dest_id == account.id)
			{
				convTrans.dest_curr = account.curr_id;
				convTrans.dest_amount = convTrans.src_amount;
			}

			res.push(convTrans);
		}

		return res;
	}


	// Return expected list of transactions after delete specified accounts
	deleteAccounts(trList, accList, ids)
	{
		let res = [];

		if (!Array.isArray(ids))
			ids = [ ids ];

		for(let trans of trList)
		{
			let srcRemoved = ids.includes(trans.src_id);
			let destRemoved = ids.includes(trans.dest_id);

			if (trans.type == this.app.EXPENSE && srcRemoved)
				continue;
			if (trans.type == this.app.INCOME && destRemoved)
				continue;
			if ((trans.type == this.app.TRANSFER || trans.type == this.app.DEBT) &&
				srcRemoved && destRemoved)
				continue;
			if (trans.type == this.app.DEBT && srcRemoved && trans.dest_id == 0)
				continue;
			if (trans.type == this.app.DEBT && destRemoved && trans.src_id == 0)
				continue;

			let convTrans = this.app.copyObject(trans);

			if (convTrans.type == this.app.TRANSFER)
			{
				if (ids.includes(convTrans.src_id))
				{
					convTrans.type = this.app.INCOME;
					convTrans.src_id = 0;
				}
				else if (ids.includes(convTrans.dest_id))
				{
					convTrans.type = this.app.EXPENSE;
					convTrans.dest_id = 0;
				}
			}
			else if (convTrans.type == this.app.DEBT)
			{
				for(let acc_id of ids)
				{
					let acc = accList.find(item => item.id == acc_id);

					if (convTrans.src_id == acc_id)
					{
						if (acc.owner_id != this.app.owner_id)
						{
							convTrans.type = this.app.INCOME;
						}

						convTrans.src_id = 0;
					}
					else if (convTrans.dest_id == acc_id)
					{
						if (acc.owner_id != this.app.owner_id)
						{
							convTrans.type = this.app.EXPENSE;
						}
						convTrans.dest_id = 0;
					}
				}
			}

			res.push(convTrans);
		}

		return res;
	}


	accountToTile(account)
	{
		let res = {};

		res.balance = Currency.format(account.curr_id, account.balance);
		res.name = account.name;
		res.icon = account.icon;

		return res;
	}


	personToTile(person)
	{
		let res = {};

		res.title = person.name;

		let debtAccounts = this.filterPersonDebts(person.accounts);
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
			res.amountText = '- ' + Currency.format(transObj.src_curr, transObj.src_amount);
			if (transObj.src_curr != transObj.dest_curr)
			{
				res.amountText += ' (- ' + Currency.format(transObj.dest_curr, transObj.dest_amount) + ')';
			}

			res.accountTitle = srcAcc.name;
		}
		else if (transObj.type == app.INCOME)
		{
			res.amountText = '+ ' + Currency.format(transObj.src_curr, transObj.src_amount);
			if (transObj.src_curr != transObj.dest_curr)
			{
				res.amountText += ' (+ ' + Currency.format(transObj.dest_curr, transObj.dest_amount) + ')';
			}

			res.accountTitle = destAcc.name;
		}
		else if (transObj.type == app.TRANSFER)
		{
			res.amountText = Currency.format(transObj.src_curr, transObj.src_amount);
			if (transObj.src_curr != transObj.dest_curr)
			{
				res.amountText += ' (' + Currency.format(transObj.dest_curr, transObj.dest_amount) + ')';
			}

			res.accountTitle = srcAcc.name + ' → ' + destAcc.name;
		}
		else if (transObj.type == app.DEBT)
		{
			res.accountTitle = '';
			let debtType = (!!srcAcc && srcAcc.owner_id != app.owner_id);
			let personAcc = debtType ? srcAcc : destAcc;
			let person = await this.getPerson(personAcc.owner_id);
			if (!person)
				throw new Error(`Person ${personAcc.owner_id} not found`);

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

			res.amountText += Currency.format(personAcc.curr_id, transObj.src_amount);
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

		let latestTransactionsList = transactionsList.slice(0, this.app.config.latestTransactions);

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
