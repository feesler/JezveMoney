
class TransactionsList
{
	constructor(app, list)
	{
		this.app = app;
		this.list = app.copyObject(list);
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

		let origObj = this.list[ind];

		this.list.splice(ind, 1, transObj);

		if (origObj.date != transObj.date)
		{
			transObj.pos = 0;
			let newPos = this.getExpectedPos(transObj);
			this.updatePosById(transObj.id, newPos);

			this.sort();
		}

		return true;
	}


	sort()
	{
		this.list.sort((a, b) => b.pos - a.pos);
	}
}


export { TransactionsList };
