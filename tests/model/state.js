import {
	getIcon,
	isValidValue,
	isObject,
	copyObject,
	setParam,
	checkObjValue,
} from '../common.js';
import { EXPENSE, INCOME, DEBT, availTransTypes } from './transaction.js';
import { App } from '../app.js';
import { Currency } from './currency.js';
import { ACCOUNT_HIDDEN, AccountsList } from './accountslist.js';
import { PersonsList } from './personslist.js';
import { TransactionsList } from './transactionslist.js';
import { api } from './api.js';


export class AppState
{
	constructor()
	{
		this.accounts = null;
		this.persons = null;
		this.transactions = null;
	}


	async fetch()
	{
		let newState = await api.state.read();

		this.setState(newState);
	}


	setState(state)
	{
		if (!this.accounts)
			this.accounts = new AccountsList;
		this.accounts.data = copyObject(state.accounts.data);
		this.accounts.autoincrement = state.accounts.autoincrement;

		if (!this.persons)
			this.persons = new PersonsList;
		this.persons.data = copyObject(state.persons.data);
		this.persons.autoincrement = state.persons.autoincrement;

		if (!this.transactions)
			this.transactions = new TransactionsList;
		this.transactions.data = copyObject(state.transactions.data);
		this.transactions.sort();
		this.transactions.autoincrement = state.transactions.autoincrement;

		this.profile = copyObject(state.profile);
	}


	async fetchAndTest()
	{
		let newState = new AppState;
		await newState.fetch();

		let res = newState.meetExpectation(this)
		if (res)
			this.setState(newState);

		return res;
	}


	clone()
	{
		let res = new AppState;

		res.accounts = this.accounts.clone();
		res.persons = this.persons.clone();
		res.transactions = this.transactions.clone();
		res.profile = copyObject(this.profile);

		return res;
	}


	meetExpectation(expected)
	{
		let res = checkObjValue(this.accounts.data, expected.accounts.data) &&
					checkObjValue(this.transactions.data, expected.transactions.data) &&
					checkObjValue(this.persons.data, expected.persons.data) &&
					checkObjValue(this.profile, expected.profile);
		return res;
	}


/**
 * Profile
 */

	resetAll()
	{
		this.accounts.reset();
		this.persons.reset();
		this.transactions.reset();
	}


	changeName(name)
	{
		this.profile.name = name;
	}


	deleteProfile()
	{
		this.resetAll();
		delete this.profile;
	}


/**
 * Accounts
 */

	checkAccountCorrectness(params)
	{
		if (!isObject(params))
			return false;

		if (typeof params.name !== 'string' || params.name == '')
			return false;

		// Check there is no account with same name
		let accObj = this.accounts.findByName(params.name);
		if (accObj && (!params.id || (params.id && params.id != accObj.id)))
			return false;

		let currObj = Currency.getById(params.curr_id);
		if (!currObj)
			return false;

		if (!getIcon(params.icon))
			return false;

		if (!isValidValue(params.initbalance))
			return false;

		return true;
	}


	createAccount(params)
	{
		let resExpected = this.checkAccountCorrectness(params);
		if (!resExpected)
			return false;

		let ind = this.accounts.create(params);
		let item = this.accounts.getItemByIndex(ind);
		this.updatePersonAccounts();

		return item.id;
	}


	updateAccount(params)
	{
		let origAcc = this.accounts.getItem(params.id);
		if (!origAcc)
			return false;
	
		// Prepare expected account object
		let expAccount = copyObject(origAcc);
		setParam(expAccount, params);

		let resExpected = this.checkAccountCorrectness(expAccount);
		if (!resExpected)
			return false;

		let balDiff = expAccount.initbalance - origAcc.initbalance;
		if (balDiff.toFixed(2) != 0)
		{
			expAccount.balance = origAcc.balance + balDiff;
		}

		// Prepare expected updates of transactions list
		this.transactions = this.transactions.updateAccount(this.accounts.data, expAccount);

		// Prepare expected updates of accounts list
		this.accounts.update(expAccount);

		this.transactions.updateResults(this.accounts);
		this.updatePersonAccounts();

		return true;
	}


	deleteAccounts(ids)
	{
		if (!Array.isArray(ids))
			ids = [ ids ];

		for(let acc_id of ids)
		{
			if (!this.accounts.getItem(acc_id))
				return false;
		}

		this.transactions = this.transactions.deleteAccounts(this.accounts.data, ids)

		// Prepare expected updates of accounts list
		this.accounts.deleteItems(ids);

		this.transactions.updateResults(this.accounts);
		this.updatePersonAccounts();

		return true;
	}


	showAccounts(ids, show = true)
	{
		if (!Array.isArray(ids))
			ids = [ ids ];

		for(let acc_id of ids)
		{
			let account = this.accounts.getItem(acc_id);
			if (!account)
				return false;

			if (show)
				account.flags &= ~ACCOUNT_HIDDEN;
			else
				account.flags |= ACCOUNT_HIDDEN;
			
			this.accounts.update(account);
		}


		return true;
	}


	resetAccounts()
	{
		this.accounts.data = [];
		this.transactions.data = [];

		return true;
	}

/**
 * Persons
 */

	checkPersonCorrectness(params)
	{
		if (!isObject(params))
			return false;

		if (typeof params.name !== 'string' || params.name == '')
			return false;

		// Check there is no person with same name
		let personObj = this.persons.findByName(params.name);
		if (personObj && (!params.id || params.id && params.id != personObj.id))
			return false;

		return true;
	}


	createPerson(params)
	{
		let resExpected = this.checkPersonCorrectness(params);
		if (!resExpected)
			return false;

		let ind = this.persons.create(params);
		let item = this.persons.getItemByIndex(ind);
		item.accounts = [];

		return item.id;
	}


	updatePerson(params)
	{
		let origPerson = this.persons.getItem(params.id);
		if (!origPerson)
			return false;

		let expPerson = copyObject(origPerson);
		setParam(expPerson, params);
	
		let resExpected = this.checkPersonCorrectness(params);
		if (!resExpected)
			return false;

		this.persons.update(expPerson);

		return true;
	}


	deletePersons(ids)
	{
		if (!Array.isArray(ids))
			ids = [ ids ];

		let accountsToDelete = [];
		for(let person_id of ids)
		{
			let person = this.persons.getItem(person_id);
			if (!person)
				return false;

			if (Array.isArray(person.accounts))
				accountsToDelete.push(...person.accounts.map(item => item.id));
		}

		this.persons.deleteItems(ids);

		// Prepare expected updates of transactions
		this.transactions = this.transactions.deleteAccounts(this.accounts.data, accountsToDelete)

		this.accounts.deleteItems(accountsToDelete);

		this.transactions.updateResults(this.accounts);

		return true;
	}

/**
 * Transactions
 */

	checkTransactionCorrectness(params)
	{
		if (!isObject(params))
			return false;

		if (!availTransTypes.includes(params.type))
			return false;

		if (params.type == DEBT)
		{
			if (!params.person_id)
				return false;

			let person = this.persons.getItem(params.person_id);
			if (!person)
				return false;

			if (params.acc_id)
			{
				let account = this.accounts.getItem(params.acc_id);
				if (!account)
					return false;
			}
		}
		else
		{
			if (params.src_id)
			{
				if (params.type == INCOME)
					return false;

				let account = this.accounts.getItem(params.src_id);
				if (!account)
					return false;
			}

			if (params.dest_id)
			{
				if (params.type == EXPENSE)
					return false;

				let account = this.accounts.getItem(params.dest_id);
				if (!account)
					return false;
			}
		}

		return true;
	}


	// Convert real transaction object to request
	// Currently only DEBT affected:
	//  (person_id, acc_id, op) parameters are used instead of (src_id, dest_id)
	transactionToRequest(transaction)
	{
		if (!transaction)
			return transaction;

		let res = copyObject(transaction);
		if (transaction.type != DEBT)
			return res;

		let srcAcc = this.accounts.getItem(transaction.src_id);
		let destAcc = this.accounts.getItem(transaction.dest_id);
		if (srcAcc && srcAcc.owner_id != this.profile.owner_id)
		{
			res.op = 1;
			res.person_id = srcAcc.owner_id;
			res.acc_id = (destAcc) ? destAcc.id : 0;
		}
		else if (destAcc && destAcc.owner_id != this.profile.owner_id)
		{
			res.op = 2;
			res.person_id = destAcc.owner_id;
			res.acc_id = (srcAcc) ? srcAcc.id : 0;
		}
		else
			throw new Error('Invalid transaction');

		delete res.src_id;
		delete res.dest_id;

		return res;
	}


	getExpectedTransaction(params)
	{
		if (!params.date)
			params.date = App.dates.now;
		if (!params.comment)
			params.comment = '';

		let res = copyObject(params);

		if (params.type != DEBT)
			return res;

		let reqCurr = (res.op == 1) ? res.src_curr : res.dest_curr;
		let personAcc = this.getExpectedPersonAccount(res.person_id, reqCurr);
		if (!personAcc)
			throw new Error('Fail to obtain expected account of person');

		if (res.op == 1)
		{
			res.src_id = personAcc.id;
			res.dest_id = res.acc_id;
		}
		else
		{
			res.src_id = res.acc_id;
			res.dest_id = personAcc.id;
		}

		// Different currencies not supported yet for debts
		res.src_curr = res.dest_curr = reqCurr;

		delete res.op;
		delete res.person_id;
		delete res.acc_id;

		return res;
	}


	updatePersonAccounts()
	{
		for(let person of this.persons.data)
		{
			person.accounts = this.accounts.data.filter(item => item.owner_id == person.id)
												.map(item => { return { id : item.id, balance : item.balance, curr_id : item.curr_id }; });
		}
	}


	createTransaction(params)
	{
		let resExpected = this.checkTransactionCorrectness(params);
		if (!resExpected)
			return false;

		// Prepare expected transaction object
		let expTrans = this.getExpectedTransaction(params);
		expTrans.pos = 0;

		// Prepare expected updates of accounts
		this.accounts = this.accounts.createTransaction(expTrans);
		
		// Prepare expected updates of transactions
		let ind = this.transactions.create(expTrans);
		this.transactions.updateResults(this.accounts);
		this.updatePersonAccounts();

		let item = this.transactions.getItemByIndex(ind);

		return item.id;
	}


	updateTransaction(params)
	{
		let origTrans = this.transactions.getItem(params.id);
		if (!origTrans)
			return false;

		// Convert original transaction to request form (only for DEBT: person_id, acc_id, op fields)
		let updTrans = this.transactionToRequest(origTrans);
		setParam(updTrans, params);

		let correct = this.checkTransactionCorrectness(updTrans);
		if (!correct)
			return false;

		// Prepare expected transaction object
		let expTrans = this.getExpectedTransaction(updTrans);

		// Prepare expected updates of accounts
		this.accounts = this.accounts.updateTransaction(origTrans, expTrans);

		// Prepare expected updates of transactions
		this.transactions.update(expTrans.id, expTrans);
		this.transactions.updateResults(this.accounts);
		this.updatePersonAccounts();

		return true;
	}


	deleteTransactions(ids)
	{
		if (!Array.isArray(ids))
			ids = [ ids ];

		let itemsToDelete = [];
		for(let transaction_id of ids)
		{
			let item = this.transactions.getItem(transaction_id);
			if (!item)
				return false;

			itemsToDelete.push(item);
		}

		// Prepare expected updates of transactions list
		this.accounts = this.accounts.deleteTransactions(itemsToDelete);
		this.transactions.deleteItems(ids)
		this.transactions.updateResults(this.accounts);
		this.updatePersonAccounts();

		return true;
	}


	setTransactionPos({ id, pos })
	{
		if (!parseInt(id) || !parseInt(pos))
			return false;

		if (!this.transactions.setPos(id, pos))
			return false;

		this.transactions.updateResults(this.accounts);

		return true;
	}


	getPersonAccount(person_id, currency_id)
	{
		let p_id = parseInt(person_id);
		let curr_id = parseInt(currency_id);
		if (!p_id || !curr_id)
			return null;

		let accObj = this.accounts.data.find(item => item.owner_id == p_id &&
													item.curr_id == curr_id);

		return copyObject(accObj);
	}


	// Search for account of person in specified currency
	// In case no such account exist create new account with expected properties
	getExpectedPersonAccount(person_id, currency_id)
	{
		let p_id = parseInt(person_id);
		let curr_id = parseInt(currency_id);
		if (!p_id || !curr_id)
			return null;

		let accObj = this.getPersonAccount(person_id, currency_id);
		if (accObj)
			return accObj;

		accObj = {
			owner_id : p_id,
			name : `acc_${person_id}_${currency_id}`,
			initbalance : 0,
			balance : 0,
			curr_id : currency_id,
			icon : 0
		};

		let ind = this.accounts.create(accObj);

		return this.accounts.getItemByIndex(ind);
	}
}

