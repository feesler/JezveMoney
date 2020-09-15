import { Component } from './component.js';
import { Currency } from '../../model/currency.js';


export class InfoTile extends Component
{
	async parse()
	{
		if (!this.elem || !await this.hasClass(this.elem, 'info-tile'))
			throw new Error('Wrong info tile structure');

		this.titleEl = await this.query(this.elem, '.info-tile__title');
		this.subtitleEl = await this.query(this.elem, '.info-tile__subtitle');

		this.id = this.parseId(await this.prop(this.elem, 'id'));
		this.title = await this.prop(this.titleEl, 'innerText');
		this.subtitle = await this.prop(this.subtitleEl, 'innerText');
		this.subtitle = this.subtitle.split('\r\n').join('\n');
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
