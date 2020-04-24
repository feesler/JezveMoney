import { NullableComponent } from './component.js';
import { TransactionListItem } from './transactionlistitem.js';


export class TransactionList extends NullableComponent
{
	async parse()
	{
		const env = this.parent.props.environment;

		this.items = [];

		let children = await env.queryAll(this.elem, ':scope > *');
		if (!children || !children.length || (children.length == 1 && await env.prop(children[0], 'tagName') == 'SPAN'))
			return;

		this.details = (await env.prop(this.elem, 'tagName') == 'TABLE');
		let listItems = await env.queryAll(this.elem, (this.details) ? 'tr' : '.trlist_item_wrap > div');
		for(let i = 0; i < listItems.length; i++)
		{
			let itemObj = await TransactionListItem.create(this.parent, listItems[i]);

			this.items.push(itemObj);
		}
	}


	static render(transactions, state)
	{
		if (!Array.isArray(transactions))
			return [];

		return transactions.map(item => TransactionListItem.render(item, state));
	}


	static renderWidget(transactions, state)
	{
		if (!Array.isArray(transactions))
			throw new Error('Invalid data');

		let res = {
			title : 'Transactions',
			transList : {
				items : this.render(transactions, state)
			}
		};

		return res;
	}
}