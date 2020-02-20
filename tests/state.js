import { api } from './api.js';
import { EXPENSE, INCOME, TRANSFER, DEBT, copyObject, normalize } from './common.js';
import { Currency } from './currency.js';
import { TransactionsList } from './trlist.js';
import { App } from './app.js';


class AppState
{
	constructor()
	{
		this.accounts = null;
		this.persons = null;
		this.transactions = null;

		api.setEnv(App);
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

		let res = copyObject(list);
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
		{
			this.accounts = await api.account.list(true);
			this.accounts.forEach(item =>
			{
				delete item.createdate;
				delete item.updatedate;
			});
		}

		return this.accounts;
	}


	async getUserAccountsList()
	{
		let accList = await this.getAccountsList();

		return accList.filter(item => item.owner_id == App.owner_id);
	}


	async getAccount(acc_id)
	{
		let id = parseInt(acc_id);
		if (!id || isNaN(id))
			return null;

		if (!Array.isArray(this.accounts))
			await this.getAccountsList();

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
		{
			this.persons = await api.person.list();
			this.persons.forEach(item =>
			{
				delete item.createdate;
				delete item.updatedate;
			});
		}


		return this.persons;
	}


	async getPerson(person_id)
	{
		let id = parseInt(person_id);
		if (!id || isNaN(id))
			return null;

		if (!Array.isArray(this.persons))
			await this.getPersonsList();

		let personObj = this.persons.find(item => item.id == id);

		return personObj;
	}


	async getPersonByPos(personPos)
	{
		let pos = parseInt(personPos);
		if (isNaN(pos))
			return null;

		if (!Array.isArray(this.persons))
			await this.getPersonsList();

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


	// Update persons
	async updatePersons(pList, accList, transaction = null, origTransaction = null)
	{
		if (!Array.isArray(pList) || !Array.isArray(accList))
			throw new Error('Invalid parameters');

		let res = {
			persons : copyObject(pList),
			accounts : copyObject(accList)
		};

		// Delete case
		// If transaction is not set, check and remove person accounts absent in the accounts list
		if (!transaction)
		{
			for(let person of res.persons)
			{
				person.accounts = res.accounts.filter(item => item.owner_id == person.id);
			}

			return res;
		}

		if (transaction.type != DEBT)
			return res;

		// Update case
		if (origTransaction)
		{
			let orig = copyObject(origTransaction);
			// TODO : do not use! Bad practice: we need to calculate
			orig.srcAcc = await this.getAccount(orig.src_id);
			orig.destAcc = await this.getAccount(orig.dest_id);

	 		orig.debtType = (!!orig.srcAcc && orig.srcAcc.owner_id != App.owner_id);
			orig.personAccount = (orig.debtType) ? orig.srcAcc : orig.destAcc;
			if (!orig.personAccount)
				throw new Error('Invalid transaction: person account not found');

			// Save updates in result
			orig.person = res.persons.find(item => item.id == orig.personAccount.owner_id);
			if (!orig.person)
				throw new Error('Invalid transaction: person not found');

			let ind = orig.person.accounts.findIndex(item => item.id == orig.personAccount.id);
			if (ind !== -1)
				orig.person.accounts[ind] = orig.personAccount;

			ind = res.accounts.findIndex(item => item.id == orig.personAccount.id);
			if (ind !== -1)
				res.accounts[ind] = orig.personAccount;
			else
				res.accounts.push(orig.personAccount);
		}

		let srcAcc = await this.getAccount(transaction.src_id);
		let destAcc = await this.getAccount(transaction.dest_id);
 		let debtType = (!!srcAcc && srcAcc.owner_id != App.owner_id);

		let personAccount = (debtType) ? srcAcc : destAcc;
		if (!personAccount)
			throw new Error('Invalid transaction: person account not found');

		let person = res.persons.find(item => item.id == personAccount.owner_id);
		if (!person)
			throw new Error('Invalid transaction: person not found');

		let ind = person.accounts.findIndex(item => item.id == personAccount.id);
		if (ind !== -1)
			person.accounts[ind] = personAccount;
		else
			person.accounts.push(personAccount);

		ind = res.accounts.findIndex(item => item.id == personAccount.id);
		if (ind !== -1)
			res.accounts[ind] = personAccount;
		else
			res.accounts.push(personAccount);

		return res;
	}


/**
 * Transactions
 */
	async getTransactionsList(returnRaw = false)
	{
		if (!Array.isArray(this.transactions))
		{
			this.transactions = await api.transaction.list();
			this.transactions.forEach(item =>
			{
				delete item.createdate;
				delete item.updatedate;
			});
		}

		if (returnRaw)
			return this.transactions;
		else
			return new TransactionsList(this.transactions);
	}


	// Apply transaction to accounts
	applyTransaction(accList, transObj)
	{
		let res = copyObject(accList);

		let srcAcc = res.find(item => item.id == transObj.src_id);
		if (srcAcc)
		{
			srcAcc.balance = normalize(srcAcc.balance - transObj.src_amount);
			transObj.src_result = srcAcc.balance;
		}

		let destAcc = res.find(item => item.id == transObj.dest_id);
		if (destAcc)
		{
			destAcc.balance = normalize(destAcc.balance + transObj.dest_amount);
			transObj.dest_result = destAcc.balance;
		}

		return res;
	}


	// Cancel transaction to accounts
	cancelTransaction(accList, transObj)
	{
		let res = copyObject(accList);

		let srcAcc = res.find(item => item.id == transObj.src_id);
		if (srcAcc)
		{
			srcAcc.balance = normalize(srcAcc.balance + transObj.src_amount);
			transObj.src_result = srcAcc.balance;
		}

		let destAcc = res.find(item => item.id == transObj.dest_id);
		if (destAcc)
		{
			destAcc.balance = normalize(destAcc.balance - transObj.dest_amount);
			transObj.dest_result = destAcc.balance;
		}

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


	accountToTile(account)
	{
		let res = {};

		res.balance = Currency.format(account.curr_id, account.balance);
		res.name = account.name;
		res.icon = account.icon;

		return res;
	}


	personToTile(person, mainPage = true)
	{
		let res = {};

		if (mainPage)
		{
			res.title = person.name;

			let debtAccounts = this.filterPersonDebts(person.accounts);
			res.subtitle = debtAccounts.length ? debtAccounts.join('\n') : 'No debts';
		}
		else
		{
			res.name = person.name;
			res.balance = '';
		}

		return res;
	}


	async transactionToListItem(transObj)
	{
		let res = {};

		let srcAcc = await this.getAccount(transObj.src_id);
		let destAcc = await this.getAccount(transObj.dest_id);

		if (transObj.type == EXPENSE)
		{
			res.amountText = '- ' + Currency.format(transObj.src_curr, transObj.src_amount);
			if (transObj.src_curr != transObj.dest_curr)
			{
				res.amountText += ' (- ' + Currency.format(transObj.dest_curr, transObj.dest_amount) + ')';
			}

			res.accountTitle = srcAcc.name;
		}
		else if (transObj.type == INCOME)
		{
			res.amountText = '+ ' + Currency.format(transObj.src_curr, transObj.src_amount);
			if (transObj.src_curr != transObj.dest_curr)
			{
				res.amountText += ' (+ ' + Currency.format(transObj.dest_curr, transObj.dest_amount) + ')';
			}

			res.accountTitle = destAcc.name;
		}
		else if (transObj.type == TRANSFER)
		{
			res.amountText = Currency.format(transObj.src_curr, transObj.src_amount);
			if (transObj.src_curr != transObj.dest_curr)
			{
				res.amountText += ' (' + Currency.format(transObj.dest_curr, transObj.dest_amount) + ')';
			}

			res.accountTitle = srcAcc.name + ' → ' + destAcc.name;
		}
		else if (transObj.type == DEBT)
		{
			res.accountTitle = '';
			let debtType = (!!srcAcc && srcAcc.owner_id != App.owner_id);
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

		res.tiles.items = accList.filter(item => item.owner_id == App.owner_id)
									.map(item => this.accountToTile(item));

		return res;
	}


	renderPersonsWidget(personsList, mainPage = true)
	{
		if (!Array.isArray(personsList))
			throw new Error('Invalid data');

		let res = {};
		let personTiles = personsList.map(item => this.personToTile(item, mainPage));

		if (mainPage)
			res.infoTiles = { items : personTiles };
		else
			res.tiles = { items : personTiles };

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

		let latestTransactionsList = transactionsList.slice(0, App.config.latestTransactions);

		res.transList.items = await this.renderTransactionsList(latestTransactionsList);

		return res;
	}


	async render(accountList, personList, transactionList)
	{
		let res = { values : { widgets : { length : App.config.widgetsCount } } };

		// Accounts widget
		let accWidget = this.renderAccountsWidget(accountList);
		res.values.widgets[App.config.AccountsWidgetPos] = accWidget;
		// Persons widget
		let personsWidget = this.renderPersonsWidget(personList);
		res.values.widgets[App.config.PersonsWidgetPos] = personsWidget;
		// Transactions widget
		let transWidget = await this.renderTransactionsWidget(transactionList);
		res.values.widgets[App.config.LatestWidgetPos] = transWidget;

		return res;
	}
}


export { AppState };
