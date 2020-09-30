import { Component } from './component.js';
import { Transaction } from '../../model/transaction.js';


class MenuItem extends Component
{
	async parse()
	{
		if (!this.elem)
			throw new Error('Wrong structure of menu item');

		let type_id = await this.prop(this.elem, 'dataset.type');
		this.type = parseInt(type_id);
		if (isNaN(this.type))
			throw new Error(`Invalid transaction type ${type_id}`);

		this.titleElem = await this.query(this.elem, '.trtype-menu_item_title');
		this.text = await this.prop(this.titleElem, 'textContent');

		this.isActive = await this.hasClass(this.elem, 'trtype-menu__item_selected');

		this.checkElem = await this.query(this.elem, '.trtype-menu__item-check');
		this.linkElem = await this.query(this.elem, 'a');
		this.link = await this.prop(this.linkElem, 'href');
	}


	async toggle()
	{
		if (!this.checkElem)
			throw new Error('Check not available');

		return this.environment.click(this.checkElem);
	}


	async click()
	{
		return this.environment.click(this.linkElem);
	}
}


export class TransactionTypeMenu extends Component
{
	async parse()
	{
		this.items = [];
		this.selectedTypes = [];

		this.multi = await this.hasClass(this.elem, 'trtype-menu-multi');

		let menuItems = await this.queryAll(this.elem, '.trtype-menu__item');
		for(let item of menuItems)
		{
			let menuItemObj = await MenuItem.create(this.parent, item);

			if (menuItemObj.isActive)
				this.selectedTypes.push(menuItemObj.type);

			this.items[menuItemObj.type] = menuItemObj;
		}
	}


	isSameSelected(type)
	{
		let data = Array.isArray(type) ? type : [ type ];

		if (this.selectedTypes.length != data.length)
			return false;

		if (data.some(item => !this.selectedTypes.includes(item)))
			return false;
		if (this.selectedTypes.some(item => !data.includes(item)))
			return false;

		return true;
	}


	isSingleSelected(type)
	{
		return this.selectedTypes.length == 1 && this.selectedTypes[0] == type;
	}


	getSelectedTypes()
	{
		return this.selectedTypes;
	}


	async select(type)
	{
		if (!this.items[type])
			throw new Error(`MenuItem of type '${type}' not found`);

		return this.items[type].click();
	}


	async toggle(type)
	{
		if (!this.items[type])
			throw new Error(`MenuItem of type '${type}' not found`);

		return this.items[type].toggle();
	}
}
