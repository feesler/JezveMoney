
class TransactionsList
{
	constructor(app, list)
	{
		this.app = app;
		this.list = app.copyObject(list);
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


	updatePos(item_id, pos)
	{
		let trObj = this.list.find(item => item.id == item_id);
		if (!trObj)
			throw new Error('Transaction ' + item_id + ' not found');

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


	create(transObj)
	{
		this.list.push(transObj);

		let expPos = this.getExpectedPos(transObj);
		this.updatePos(transObj.id, expPos);

		this.sort();
	}


	update(id, transObj)
	{
		let ind = this.list.findIndex(item => item.id == transObj.id);
		if (ind === -1)
			return;

		let origObj = this.list[ind];

		this.list.splice(ind, 1, transObj);

		if (origObj.date != transObj.date)
		{
			transObj.pos = 0;
			let newPos = this.getExpectedPos(transObj);
			this.updatePos(transObj.id, newPos);

			this.sort();
		}
	}


	sort()
	{
		this.list.sort((a, b) => a.pos - b.pos);
	}
}


export { TransactionsList };
