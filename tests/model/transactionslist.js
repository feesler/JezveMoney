import {
	copyObject,
	convDate,
	fixDate
} from '../common.js';
import { App } from '../app.js';
import { api } from '../api.js';
import { List } from './list.js';
import {
	EXPENSE,
	INCOME,
	TRANSFER,
	DEBT,
	availTransTypes
} from './transaction.js';


export class TransactionsList extends List
{
	async fetch()
	{
		return api.transaction.list();
	}


	setData(data)
	{
		super.setData(data);

		this.sort();
	}


	clone()
	{
		let res = new TransactionsList(this.data);
		res.autoincrement = this.autoincrement;

		return res;
	}


	getExpectedPos(params)
	{
		let pos = this.getLastestPos(params.date);

		return pos + 1;
	}


	getLastestPos(date = null)
	{
		let cmpDate = convDate(date);
		let checkList = (cmpDate) ? this.data.filter(item => convDate(item.date) <= cmpDate) : this.data;

		let res = checkList.reduce((r, item) => Math.max(r, (item.pos) ? item.pos : 0), 0);

		return res;
	}


	updatePosById(item_id, pos)
	{
		let ind = this.getIndexOf(item_id);
		if (ind === -1)
			throw new Error(`Transaction ${item_id} not found`);

		return this.updatePos(ind, pos);
	}


	updatePos(ind, pos)
	{
		if (ind < 0 || ind >= this.data.length)
			throw new Error(`Wrong transaction index: ${ind}`);

		let trObj = this.data[ind];
		if (!trObj)
			throw new Error('Transaction not found');

		let oldPos = trObj.pos;
		if (oldPos == pos)
			return;

		if (this.data.find(item => item.pos == pos))
		{
			for(let item of this.data)
			{
				if (oldPos == 0)			// insert with specified position
				{
					if (item.pos >= pos)
						item.pos += 1;
				}
				else if (pos < oldPos)		// moving up
				{
					if (item.pos >= pos && item.pos < oldPos)
						item.pos += 1;
				}
				else if (pos > oldPos)		// moving down
				{
					if (item.pos > oldPos && item.pos <= pos)
						item.pos -= 1;
				}
			}
		}

		trObj.pos = pos;
	}


	create(item)
	{
		item.pos = 0;

		let ind = super.create(item);
/*
		let ind = this.data.length;
		transObj.pos = 0;
		this.data.push(transObj);
*/
		let transObj = this.data[ind];
		let expPos = this.getExpectedPos(transObj);
		this.updatePos(ind, expPos);

		this.sort();

		return this.data.findIndex(item => item == transObj);
	}


	update(id, transObj)
	{
		let item = this.getItem(id);
		if (!item)
			return false;

		let origObj = copyObject(item);
/*
		let origObj = this.data.splice(ind, 1, transObj);
		if (!origObj || !origObj.length)
			return false;
*/
		if (!super.update(transObj))
			return false;

		if (origObj.date != transObj.date)
		{
			transObj.pos = 0;
			let newPos = this.getExpectedPos(transObj);
			this.updatePosById(transObj.id, newPos);

			this.sort();
		}
		else
			transObj.pos = origObj.pos;

		return true;
	}


/*
	del(type, inds)
	{
		let typedIndexes = (Array.isArray(inds)) ? inds : [ inds ];
		let indexes = [];

		// Save absolute indexes of items with specified type
		let typeItems = [];
		this.data.forEach((item, ind) =>
		{
			if (type == 0 || item.type == type)
				typeItems.push(ind);
		});

		// Check requested indexes and map its absolute values
		for(let ind of typedIndexes)
		{
			if (ind < 0 || ind >= typeItems.length)
				throw new Error('Wrong transaction position: ' + ind);

			indexes.push(typeItems[ind]);
		}

		let shift = 0;
		let delList = [];
		for(let ind of indexes)
		{
			let item = this.data.splice(ind - (shift++), 1);
			delList.push(item[0]);
		}

		return delList;
	}
*/

/*
	deleteItems(ids)
	{
		let res = this.deleteByIds(this.data, ids);

		return new TransactionsList(res);
	}
*/


	getItemsByType(list, type)
	{
		// If type == 0 or no value is specified assume filter is set as ALL
		if (!type)
			return list;

		if (!availTransTypes.includes(type))
			throw new Error('Wrong parameters');

		return list.filter(item => item.type == type);
	}


	filterByType(type)
	{
		let items = this.getItemsByType(this.data, type);
		if (items == this.data)
			return this;

		return new TransactionsList(items);
	}


	getItemsByAccounts(list, ids)
	{
		if (!ids)
			throw new Error('Wrong parameters');

		let accounts = (Array.isArray(ids)) ? ids : [ ids ];
		if (!accounts.length)
			return list;

		return list.filter(item => accounts.includes(item.src_id) || accounts.includes(item.dest_id));
	}


	filterByAccounts(ids)
	{
		let items = this.getItemsByAccounts(this.data, ids);
		if (items == this.data)
			return this;

		return new TransactionsList(items);
	}


	getItemsByDate(list, start, end)
	{
		if (!start && !end)
			return list;

		let fStart = fixDate(start);
		let fEnd = fixDate(end);

		return list.filter(item =>
		{
			let date = convDate(item.date);
			if (!date)
				return false;

			if (fStart && date < fStart)
				return false;
			if (fEnd && date > fEnd)
				return false;

			return true;
		});
	}


	filterByDate(start, end)
	{
		let items = this.getItemsByDate(this.data, start, end);
		if (items == this.data)
			return this;

		return new TransactionsList(items);
	}


	getItemsByQuery(list, query)
	{
		if (!query)
			return list;

		let lcQuery = query.toLowerCase();

		return list.filter(item => item.comment.toLowerCase().includes(lcQuery));
	}


	filterByQuery(query)
	{
		let items = this.getItemsByQuery(this.data, query);
		if (items == this.data)
			return this;

		return new TransactionsList(items);
	}


	getItemsPage(list, num, limit)
	{
		let pageLimit = (typeof limit !== 'undefined') ? limit : App.config.transactionsOnPage;

		let totalPages = this.expectedPages(pageLimit);
		if (num < 1 || num > totalPages)
			throw new Error(`Wrong page ${num}`);

		let offset = (num - 1) * pageLimit;

		let res = copyObject(list);

		res.sort((a, b) => a.pos - b.pos);

		return res.slice(offset, Math.min(offset + pageLimit, res.length));
	}


	getPage(num, limit)
	{
		let items = this.getItemsPage(this.data, num, limit);
		if (items == this.data)
			return this;

		return new TransactionsList(items);
	}


	getItems(list, par)
	{
		let res = list;
		let params = par || {};

		if ('type' in params)
			res = this.getItemsByType(res, params.type);
		if ('accounts' in params)
			res = this.getItemsByAccounts(res, params.accounts);
		if ('startDate' in params && 'endDate' in params)
			res = this.getItemsByDate(res, params.startDate, params.endDate);
		if ('search' in params)
			res = this.getItemsByQuery(res, params.search);

		let targetPage = ('page' in params) ? params.page : 1;
		res = this.getItemsPage(res, targetPage, params.onPage);

		return res;
	}


	filter(params)
	{
		let items = this.getItems(this.data, params);
		if (items == this.data)
			return this;

		return new TransactionsList(items);
	}


	sort()
	{
		this.data.sort((a, b) => b.pos - a.pos);
	}


	sortAsc()
	{
		let res = copyObject(this.data);

		return res.sort((a, b) => a.pos - b.pos);
	}


	expectedPages(limit)
	{
		let onPage = (typeof limit !== 'undefined') ? limit : App.config.transactionsOnPage;

		return Math.max(Math.ceil(this.data.length / onPage), 1);
	}


	// Return expected list of transactions after update specified account
	onUpdateAccount(list, accList, account)
	{
		let origAcc = accList.find(item => item.id == account.id);
		if (!origAcc)
			throw new Error('Specified account not found in the original list');

		if (origAcc.curr_id == account.curr_id)
			return list;

		let res = [];
		for(let trans of list)
		{
			let convTrans = copyObject(trans);

			if (convTrans.src_id == account.id)
			{
				convTrans.src_curr = account.curr_id;
				if (convTrans.dest_curr == account.curr_id)
					convTrans.src_amount = convTrans.dest_amount;
			}
			if (convTrans.dest_id == account.id)
			{
				convTrans.dest_curr = account.curr_id;
				if (convTrans.src_curr == account.curr_id)
					convTrans.dest_amount = convTrans.src_amount;
			}

			res.push(convTrans);
		}

		return res;
	}


	// Return expected list of transactions after update specified account
	updateAccount(accList, account)
	{
		let res = this.onUpdateAccount(this.data, accList, account);

		return new TransactionsList(res);
	}


	// Return expected list of transactions after delete specified accounts
	onDeleteAccounts(list, accList, ids)
	{
		let res = [];

		if (!Array.isArray(ids))
			ids = [ ids ];

		for(let trans of list)
		{
			let srcRemoved = ids.includes(trans.src_id);
			let destRemoved = ids.includes(trans.dest_id);

			if (trans.type == EXPENSE && srcRemoved)
				continue;
			if (trans.type == INCOME && destRemoved)
				continue;
			if ((trans.type == TRANSFER || trans.type == DEBT) &&
				srcRemoved && destRemoved)
				continue;
			if (trans.type == DEBT && srcRemoved && trans.dest_id == 0)
				continue;
			if (trans.type == DEBT && destRemoved && trans.src_id == 0)
				continue;

			let convTrans = copyObject(trans);

			if (convTrans.type == TRANSFER)
			{
				if (ids.includes(convTrans.src_id))
				{
					convTrans.type = INCOME;
					convTrans.src_id = 0;
				}
				else if (ids.includes(convTrans.dest_id))
				{
					convTrans.type = EXPENSE;
					convTrans.dest_id = 0;
				}
			}
			else if (convTrans.type == DEBT)
			{
				for(let acc_id of ids)
				{
					let acc = accList.find(item => item.id == acc_id);

					if (convTrans.src_id == acc_id)
					{
						if (acc.owner_id != App.owner_id)
						{
							convTrans.type = INCOME;
						}

						convTrans.src_id = 0;
					}
					else if (convTrans.dest_id == acc_id)
					{
						if (acc.owner_id != App.owner_id)
						{
							convTrans.type = EXPENSE;
						}
						convTrans.dest_id = 0;
					}
				}
			}

			res.push(convTrans);
		}

		return res;
	}


	deleteAccounts(accList, ids)
	{
		let res = this.onDeleteAccounts(this.data, accList, ids);

		return new TransactionsList(res);
	}
}
