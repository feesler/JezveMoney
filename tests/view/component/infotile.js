import { Component } from './component.js';
import { Currency } from '../../model/currency.js';


export class InfoTile extends Component
{
	async parse()
	{
		const env = this.parent.props.environment;

		if (!this.elem || !await env.hasClass(this.elem, 'info_tile'))
			throw new Error('Wrong info tile structure');

		this.titleEl = await env.query(this.elem, '.info_title');
		this.subtitleEl = await env.query(this.elem, '.info_subtitle');

		this.id = this.parseId(await env.prop(this.elem, 'id'));
		this.title = await env.prop(this.titleEl, 'innerText');
		this.subtitle = await env.prop(this.subtitleEl, 'innerText');
	}


	// Format non-zero balances of person accounts
	// Return array of strings
	static filterPersonDebts(accounts)
	{
		if (!Array.isArray(accounts))
			throw new Error('Unexpected input');

		let res = accounts.filter(item => item.balance != 0)
							.map(item => Currency.format(item.curr_id, item.balance));

		return res;
	}


	static renderPerson(person)
	{
		let res = {};

		res.title = person.name;

		let debtAccounts = InfoTile.filterPersonDebts(person.accounts);
		res.subtitle = debtAccounts.length ? debtAccounts.join('\n') : 'No debts';

		return res;
	}
}
