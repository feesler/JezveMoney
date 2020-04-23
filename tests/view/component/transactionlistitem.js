import { Component } from './component.js';


export class TransactionListItem extends Component
{
	async parse()
	{
		const env = this.parent.props.environment;

		this.id = this.parseId(await env.prop(this.elem, 'id'));

		let titleElem = await env.query(this.elem, '.tritem_acc_name > span');
		if (!titleElem)
			throw new Error('Account title not found');
		this.accountTitle = await env.prop(titleElem, 'innerText');

		let amountElem = await env.query(this.elem, '.tritem_sum > span');
		if (!amountElem)
			throw new Error('Amount text not found');
		this.amountText = await env.prop(amountElem, 'innerText');

		let dateElem = await env.query(this.elem, '.tritem_date_comm > *');
		if (!dateElem || await env.prop(dateElem, 'tagName') != 'SPAN')
			throw new Error('Date element not found');

		this.dateFmt = await env.prop(dateElem, 'innerText');

		let commentElem = await env.query(this.elem, '.tritem_comm');
		this.comment = commentElem ? await env.prop(commentElem, 'innerText') : '';
	}


	async click()
	{
		const env = this.parent.props.environment;

		return env.click(this.elem);
	}
}