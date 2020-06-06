import { Component } from './component.js';
import { Transaction } from '../../model/transaction.js';


class MenuItem extends Component
{
	async parse()
	{
		if (!this.elem)
			throw new Error('Wrong structure of menu item');

		this.text = await this.prop(this.elem, 'innerText');
		this.type = Transaction.strToType(this.text);

		let tagName = await this.prop(this.elem, 'tagName');
		if (tagName == 'B')
		{
			this.isActive = true;
		}
		else if (tagName == 'A')
		{
			this.link = await this.prop(this.elem, 'href');
			this.isActive = false;
		}
	}


	async click()
	{
		if (!this.isActive)
			return this.environment.click(this.elem);
	}
}


export class TransactionTypeMenu extends Component
{
	async parse()
	{
		this.items = [];
		this.activeType = null;

		let menuItems = await this.queryAll(this.elem, 'span > *');
		for(let item of menuItems)
		{
			let menuItemObj = await MenuItem.create(this.parent, item);

			if (menuItemObj.isActive)
				this.activeType = menuItemObj.type;

			this.items[menuItemObj.type] = menuItemObj;
		}
	}


	async select(type)
	{
		if (this.activeType == type || !this.items[type])
			return;

		return this.items[type].click();
	}
}
