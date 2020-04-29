import { NullableComponent } from './component.js';
import { TransactionListItem } from './transactionlistitem.js';
import { asyncMap, copyObject } from '../../common.js';


export class TransactionList extends NullableComponent
{
	async parse()
	{
		const env = this.parent.props.environment;

		this.items = [];
		this.details = (await env.prop(this.elem, 'tagName') == 'TABLE');
		let listItems = await env.queryAll(this.elem, (this.details) ? 'tr' : '.trlist_item_wrap > div');
		if (!listItems || !listItems.length || (listItems.length == 1 && await env.prop(listItems[0], 'tagName') == 'SPAN'))
			return;

		this.items = await asyncMap(listItems, item => TransactionListItem.create(this.parent, item));
	}


	getItems()
	{
		return this.items.map(item => {
			return {
				amountText : item.amountText,
				amountTitle : item.amountTitle,
				dateFmt : item.dateFmt,
				comment : item.comment,
			}
		});
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