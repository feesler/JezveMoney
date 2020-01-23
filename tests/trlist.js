
class TransactionsList
{
	constructor(app, list)
	{
		this.app = app;
		this.list = app.copyObject(list);
		this.availTypes = [ app.EXPENSE, app.INCOME, app.TRANSFER, app.DEBT ];
		this.sort();
	}


	getExpectedPos(params)
	{
		let pos = this.getLastestPos(params.date);

		return pos + 1;
	}


	getLastestPos(date = null)
	{
		let cmpDate = this.app.convDate(date);
		let checkList = (cmpDate) ? this.list.filter(item => this.app.convDate(item.date) <= cmpDate) : this.list;

		let res = checkList.reduce((r, item) => Math.max(r, (item.pos) ? item.pos : 0), 0);

		return res;
	}


	updatePosById(item_id, pos)
	{
		let ind = this.findItem(item_id);
		if (ind === -1)
			throw new Error('Transaction ' + item_id + ' not found');

		return this.updatePos(ind, pos);
	}


	updatePos(ind, pos)
	{
		if (ind < 0 || ind >= this.list.length)
			throw new Error('Wrong transaction index: ' + ind);

		let trObj = this.list[ind];
		if (!trObj)
			throw new Error('Transaction not found');

		let oldPos = trObj.pos;
		if (oldPos == pos)
			return;

		if (this.list.find(item => item.pos == pos))
		{
			for(let item of this.list)
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


	findItem(item_id)
	{
		return this.list.findIndex(item => item.id == item_id);
	}


	create(transObj)
	{
		let ind = this.list.length;
		this.list.push(transObj);

		let expPos = this.getExpectedPos(transObj);
		this.updatePos(ind, expPos);

		this.sort();

		return this.list.findIndex(item => item == transObj);
	}


	update(id, transObj)
	{
		let ind = this.findItem(id);
		if (ind === -1)
			return false;

		let origObj = this.list.splice(ind, 1, transObj);
		if (!origObj || !origObj.length)
			return false;

		if (origObj[0].date != transObj.date)
		{
			transObj.pos = 0;
			let newPos = this.getExpectedPos(transObj);
			this.updatePosById(transObj.id, newPos);

			this.sort();
		}

		return true;
	}


	del(type, inds)
	{
		let typedIndexes = (Array.isArray(inds)) ? inds : [ inds ];
		let indexes = [];

		// Save absolute indexes of items with specified type
		let typeItems = [];
		this.list.forEach((item, ind) =>
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
			let item = this.list.splice(ind - (shift++), 1);
			delList.push(item[0]);
		}

		return delList;
	}


	getItemsByType(list, type)
	{
		// If type == 0 or no value is specified assume filter is set as ALL
		if (!type)
			return list;

		if (!this.availTypes.includes(type))
			throw new Error('Wrong parameters');

		return list.filter(item => item.type == type);
	}


	filterByType(type)
	{
		let items = this.getItemsByType(this.list, type);
		if (items == this.list)
			return this;

		return new TransactionsList(this.app, items);
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
		let items = this.getItemsByAccounts(this.list, ids);
		if (items == this.list)
			return this;

		return new TransactionsList(this.app, items);
	}


	getItemsByDate(list, start, end)
	{
		if (!start && !end)
			return list;

		let fStart = this.app.fixDate(start);
		let fEnd = this.app.fixDate(end);

		return list.filter(item =>
		{
			let date = this.app.convDate(item.date);
			if (!date)
				return false;

			if (fStart && date < fStart)
				return false;
			if (fEnd && date > fEnd)
				return false;

			return true;
		});
	}


	filterByDate(list, start, end)
	{
		let items = this.getItemsByDate(this.list, start, end);
		if (items == this.list)
			return this;

		return new TransactionsList(this.app, items);
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
		let items = this.getItemsByQuery(this.list, query);
		if (items == this.list)
			return this;

		return new TransactionsList(this.app, items);
	}


	getItemsPage(list, num, limit)
	{
		let pageLimit = (typeof limit !== 'undefined') ? limit : this.app.config.transactionsOnPage;

		if (num < 1 || num > Math.ceil(list.length / pageLimit))
			throw new Error('Wrong page');

		let offset = (num - 1) * pageLimit;

		return list.slice(offset, Math.min(offset + pageLimit, list.length));
	}


	getPage(num, limit)
	{
		let items = this.getItemsPage(this.list, num, limit);
		if (items == this.list)
			return this;

		return new TransactionsList(this.app, items);
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
		let items = this.getItems(this.list, params);
		if (items == this.list)
			return this;

		return new TransactionsList(this.app, items);
	}


	sort()
	{
		this.list.sort((a, b) => b.pos - a.pos);
	}
}


export { TransactionsList };
