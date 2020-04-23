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

		let menuItems = await env.queryAll(this.elem, 'span');
		for(let i = 0; i < menuItems.length; i++)
		{
			let menuItemObj = await MenuItem.create(this.parent, await env.query(menuItems[i], ':scope > *'));

			if (menuItemObj.isActive)
				this.activeType = menuItemObj.type;

			this.items[menuItemObj.type] = menuItemObj;
		}
	}
}
