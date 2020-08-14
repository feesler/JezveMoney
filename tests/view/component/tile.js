import { Component } from './component.js';
import { findIconByClassName } from '../../common.js';
import { Currency } from '../../model/currency.js';


export class Tile extends Component
{
	async parse()
	{
		if (!this.elem || !await this.hasClass(this.elem, 'tile'))
			throw new Error('Wrong tile structure');

		this.linkElem = await this.query(this.elem, '.tilelink');
		this.balanceEL = await this.query(this.elem, '.acc_bal');
		this.nameEL = await this.query(this.elem, '.acc_name');

		this.id = this.parseId(await this.prop(this.elem, 'id'));
		this.balance = await this.prop(this.balanceEL, 'innerText');
		this.name = await this.prop(this.nameEL, 'innerText');

		this.isActive = !!(await this.query(this.elem, '.act'));

		this.iconElem = await this.query(this.elem, '.acc_icon > svg')
		let iconObj = findIconByClassName(await this.prop(this.iconElem, 'className.baseVal'));
		this.icon = iconObj.id;
	}


	async click()
	{
		return this.environment.click(this.linkElem);
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