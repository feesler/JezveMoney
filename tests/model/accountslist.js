import { copyObject, normalize } from '../common.js';
import { api } from './api.js';
import { List } from './list.js';
import { App } from '../app.js';


export const ACCOUNT_HIDDEN = 1;


export class AccountsList extends List
{
	async fetch()
	{
		return api.account.list(true);
	}


	clone()
	{
		let res = new AccountsList(this.data);
		res.autoincrement = this.autoincrement;

		return res;
	}


	// Apply transaction to accounts
	static applyTransaction(accounts, transaction)
	{
		if (!Array.isArray(accounts))
			throw new Error('Invalid accounts list specified');
		if (!transaction)
			throw new Error('Invalid transaction specified');

		let res = copyObject(accounts);

		let srcAcc = (transaction.src_id) ? res.find(item => item.id == transaction.src_id) : null;
		if (srcAcc)
		{
			srcAcc.balance = normalize(srcAcc.balance - transaction.src_amount);
		}

		let destAcc = (transaction.dest_id) ? res.find(item => item.id == transaction.dest_id) : null;
		if (destAcc)
		{
			destAcc.balance = normalize(destAcc.balance + transaction.dest_amount);
		}

		return res;
	}


	// Cancel transaction to accounts
	static cancelTransaction(accounts, transaction)
	{
		if (!Array.isArray(accounts))
			throw new Error('Invalid accounts list specified');
		if (!transaction)
			throw new Error('Invalid transaction specified');

		let res = copyObject(accounts);

		let srcAcc = (transaction.src_id) ? res.find(item => item.id == transaction.src_id) : null;
		if (srcAcc)
		{
			srcAcc.balance = normalize(srcAcc.balance + transaction.src_amount);
		}

		let destAcc = (transaction.dest_id) ? res.find(item => item.id == transaction.dest_id) : null;
		if (destAcc)
		{
			destAcc.balance = normalize(destAcc.balance - transaction.dest_amount);
		}

		return res;
	}


	createTransaction(transaction, returnRaw = false)
	{
		let res = AccountsList.applyTransaction(this.data, transaction);

		if (returnRaw)
			return res;
		else
			return new AccountsList(res);
	}


	updateTransaction(origTransaction, newTransaction, returnRaw = false)
	{
		let afterCancel = AccountsList.cancelTransaction(this.data, origTransaction)
		let res = AccountsList.applyTransaction(afterCancel, newTransaction);

		if (returnRaw)
			return res;
		else
			return new AccountsList(res);
	}


	deleteTransactions(transactions, returnRaw = false)
	{
		let transList = Array.isArray(transactions) ? transactions : [ transactions ];
		let res = copyObject(this.data);

		for(let transaction of transList)
		{
			res = AccountsList.cancelTransaction(res, transaction);
		}

		if (returnRaw)
			return res;
		else
			return new AccountsList(res);
	}


	// Reset balance of all accounts to initial values
	toInitial(returnRaw = false)
	{
		let res = copyObject(this.data);
		for(let acc of res)
		{
			acc.balance = acc.initbalance;
		}

		if (returnRaw)
			return res;
		else
			return new AccountsList(res);
	}


	findByName(name, caseSens = false)
	{
		let lookupName;

		if (caseSens)
		{
			lookupName = name;
			return this.data.find(item => item.name == lookupName);
		}
		else
		{
			lookupName = name.toLowerCase();
			return this.data.find(item => item.name.toLowerCase() == lookupName);
		}
	}


	getUserAccounts(returnRaw = false)
	{
		let res = this.data.filter(item => item.owner_id == App.owner_id);

		if (returnRaw)
			return copyObject(res);
		else
			return new AccountsList(res);
	}


	isHidden(account)
	{
		if (!account)
			throw new Error('Invalid account');

		return (account.flags & ACCOUNT_HIDDEN) == ACCOUNT_HIDDEN;
	}


	getVisible(returnRaw = false)
	{
		let res = this.data.filter(item => !this.isHidden(item));

		if (returnRaw)
			return copyObject(res);
		else
			return new AccountsList(res);
	}


	getHidden(returnRaw = false)
	{
		let res = this.data.filter(item => this.isHidden(item));

		if (returnRaw)
			return copyObject(res);
		else
			return new AccountsList(res);
	}


	// Return another visible user account id if possible
	// Return zero if no account found
	getNext(account_id)
	{
		if (!account_id)
			return 0;

		let userAccounts = this.getUserAccounts();
		if (!userAccounts)
			return 0;
		let visibleAccounts = userAccounts.getVisible();
		if (!visibleAccounts || visibleAccounts.length < 2)
			return 0;

		let ind = visibleAccounts.getIndexOf(account_id);
		if (ind === -1)
			return 0;

		ind = (ind == visibleAccounts.length - 1) ? 0 : ind + 1;

		return visibleAccounts.indexToId(ind);
	}
}
