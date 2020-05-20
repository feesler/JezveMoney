import { Component } from './component.js';
import { findIconByClassName } from '../../common.js';
import { Currency } from '../../model/currency.js';


export class Tile extends Component
{
	async parse()
	{
		const env = this.parent.props.environment;

		if (!this.elem || !await env.hasClass(this.elem, 'tile'))
			throw new Error('Wrong tile structure');

		this.linkElem = await env.query(this.elem, '.tilelink');
		this.balanceEL = await env.query(this.elem, '.acc_bal');
		this.nameEL = await env.query(this.elem, '.acc_name');

		this.id = this.parseId(await env.prop(this.elem, 'id'));
		this.balance = await env.prop(this.balanceEL, 'innerText');
		this.name = await env.prop(this.nameEL, 'innerText');

		this.isActive = !!(await env.query(this.elem, '.act'));

		let iconObj = findIconByClassName(await env.prop(this.elem, 'className'));
		this.icon = iconObj.id;
	}


	async click()
	{
		const env = this.parent.props.environment;

		return env.click(this.linkElem);
	}


	static renderAccount(account)
	{
		let res = {
			balance : Currency.format(account.curr_id, account.balance),
			name : account.name,
			icon : account.icon,
		};

		return res;
	}


	static renderPerson(person)
	{
		let res = {
			name : person.name,
			balance : '',
		};

		return res;
	}
}