import { Component } from './component.js';
import { Transaction } from '../../model/transaction.js';


class MenuItem extends Component
{
	async parse()
	{
		const env = this.parent.props.environment;

		if (!this.elem)
			throw new Error('Wrong structure of menu item');

		this.text = await env.prop(this.elem, 'innerText');
		this.type = Transaction.strToType(this.text);

		let tagName = await env.prop(this.elem, 'tagName');
		if (tagName == 'B')
		{
			this.isActive = true;
		}
		else if (tagName == 'A')
		{
			this.link = await env.prop(this.elem, 'href');
			this.isActive = false;
		}
	}


	async click()
	{
		const env = this.parent.props.environment;

		if (!this.isActive)
			return env.click(this.elem);
	}
}


export class TransactionTypeMenu extends Component
{
	async parse()
	{
		const env = this.parent.props.environment;

		this.items = [];
		this.activeType = null;

		let menuItems = await env.queryAll(this.elem, 'span > *');
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
