import { copyObject } from '../common.js'


export class List
{
	constructor(data = [])
	{
		if (!Array.isArray(data))
			throw new Error('Invalid data specified');

		this.setData(data);
	}


	setData(data)
	{
		this.data = copyObject(data);
	}


	reset()
	{
		this.data = [];
	}


	async fetch()
	{
		throw new Error('Fetch not implemented');
	}


	async refresh()
	{
		let newData = await this.fetch();
		this.setData(newData);
	}


	getItem(id)
	{
		let res = this.data.find(item => item.id == id);
		return copyObject(res);
	}


	getItems(ids)
	{
		let itemIds = Array.isArray(ids) ? ids : [ ids ];

		let res = this.data.filter(item => itemIds.includes(item.id));
		return copyObject(res);
	}


	getItemByIndex(ind)
	{
		if (!this.data)
			return null;

		let pos = parseInt(ind);
		if (isNaN(pos) || pos < 0 || pos >= this.data.length)
			return null;
		
		return copyObject(this.data[pos]);
	}


	// Return index of item with specified id
	getIndexOf(id)
	{
		return this.data.findIndex(item => item.id == id);
	}


	getLatestId()
	{
		let res = 0;

		for(let item of this.data)
		{
			res = Math.max(item.id, res);
		}

		return res;
	}


	// Return id of item with specified index(absolute position) in list
	posToId(pos)
	{
		let ind = parseInt(pos);
		if (isNaN(ind) || ind < 0 || ind >= this.data.length)
			throw new Error(`Invalid position ${pos} specified`);

		let item = this.data[pos];

		return item.id;
	}


	positionsToIds(positions)
	{
		let posList = Array.isArray(positions) ? positions : [ positions ];

		return posList.map(pos => this.posToId(pos));
	}


	// Return expected value of next id
	getNextId()
	{
		if (this.autoincrement)
			return this.autoincrement;

		let latest = this.getLatestId();
		if (latest > 0)
			return latest + 1;

		return 0;
	}


	// Push item to the end of list, automatically generate id
	// Return index of new item in the list
	create(item)
	{
		if (!item)
			throw new Error('Invalid item');

		let itemObj = copyObject(item);

		let next_id = this.getNextId();
		if (next_id)
		{
			itemObj.id = next_id;
			this.autoincrement = next_id + 1;
		}

		let res = this.data.length;
		this.data.push(itemObj);

		return res;
	}


	// Rewrite existing item in the list with specified data
	// item object must contain valid id field
	update(item)
	{
		if (!item || !item.id)
			throw new Error('Invalid item');

		let ind = this.getIndexOf(item.id);
		if (ind === -1)
			return false;

		let itemObj = copyObject(item);
		this.data.splice(ind, 1, itemObj);

		return true;
	}


	deleteItems(ids)
	{
		let res = List.deleteByIds(this.data, ids);

		this.data = res;

		return true;
	}


	static deleteByIds(list, ids)
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
}
