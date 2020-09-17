import { Component } from './component.js';
import { Currency } from '../../model/currency.js';
import { EXPENSE, INCOME, TRANSFER, DEBT } from '../../model/transaction.js';


export class TransactionListItem extends Component
{
	async parse()
	{
		this.id = parseInt(await this.prop(this.elem, 'dataset.id'));

		let titleElem = await this.query(this.elem, '.trans-list__item-title > span');
		if (!titleElem)
			throw new Error('Account title not found');
		this.accountTitle = await this.prop(titleElem, 'innerText');

		let amountElem = await this.query(this.elem, '.trans-list__item-content > span');
		if (!amountElem)
			throw new Error('Amount text not found');
		this.amountText = await this.prop(amountElem, 'innerText');

		let dateElem = await this.query(this.elem, '.trans-list__item-details > *');
		if (!dateElem || await this.prop(dateElem, 'tagName') != 'SPAN')
			throw new Error('Date element not found');

		this.dateFmt = await this.prop(dateElem, 'innerText');

		let commentElem = await this.query(this.elem, '.trans-list__item-comment');
		this.comment = commentElem ? await this.prop(commentElem, 'innerText') : '';
	}


	async click()
	{
		return this.environment.click(this.elem);
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