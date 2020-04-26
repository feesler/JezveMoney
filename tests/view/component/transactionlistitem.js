import { Component } from './component.js';
import { Currency } from '../../model/currency.js';
import { EXPENSE, INCOME, TRANSFER, DEBT } from '../../model/transaction.js';


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


	static render(transaction, state)
	{
		let res = {};

		if (!transaction)
			throw new Error('Invalid transaction object');
		if (!state)
			throw new Error('Invalid state object');

		let srcAcc = state.accounts.getItem(transaction.src_id);
		let destAcc = state.accounts.getItem(transaction.dest_id);

		if (transaction.type == EXPENSE)
		{
			res.amountText = '- ' + Currency.format(transaction.src_curr, transaction.src_amount);
			if (transaction.src_curr != transaction.dest_curr)
			{
				res.amountText += ' (- ' + Currency.format(transaction.dest_curr, transaction.dest_amount) + ')';
			}

			res.accountTitle = srcAcc.name;
		}
		else if (transaction.type == INCOME)
		{
			res.amountText = '+ ' + Currency.format(transaction.src_curr, transaction.src_amount);
			if (transaction.src_curr != transaction.dest_curr)
			{
				res.amountText += ' (+ ' + Currency.format(transaction.dest_curr, transaction.dest_amount) + ')';
			}

			res.accountTitle = destAcc.name;
		}
		else if (transaction.type == TRANSFER)
		{
			res.amountText = Currency.format(transaction.src_curr, transaction.src_amount);
			if (transaction.src_curr != transaction.dest_curr)
			{
				res.amountText += ' (' + Currency.format(transaction.dest_curr, transaction.dest_amount) + ')';
			}

			res.accountTitle = `${srcAcc.name} → ${destAcc.name}`;
		}
		else if (transaction.type == DEBT)
		{
			res.accountTitle = '';
			let debtType = (!!srcAcc && srcAcc.owner_id != state.profile.owner_id);
			let personAcc = debtType ? srcAcc : destAcc;
			let person = state.persons.getItem(personAcc.owner_id);
			if (!person)
				throw new Error(`Person ${personAcc.owner_id} not found`);

			let acc = debtType ? destAcc : srcAcc;

			if (debtType)
			{
				res.accountTitle = person.name;
				if (acc)
					res.accountTitle += ' → ' + acc.name;
				res.amountText = (acc) ? '+ ' : '- ';
			}
			else
			{
				if (acc)
					res.accountTitle = acc.name + ' → ';
				res.accountTitle += person.name;
				res.amountText = (srcAcc) ? '- ' : '+ ';
			}

			res.amountText += Currency.format(personAcc.curr_id, transaction.src_amount);
		}

		res.dateFmt = transaction.date;
		res.comment = transaction.comment;

		return res;
	}
}