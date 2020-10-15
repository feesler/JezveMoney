import { NullableComponent } from './component.js';
import { Tile } from './tile.js';
import { AccountsList } from '../../model/accountslist.js';
import { PersonsList } from '../../model/personslist.js';
import { asyncMap, copyObject } from '../../common.js';


export class TilesList extends NullableComponent
{
	constructor(parent, elem, tileClass)
	{
		super(parent, elem);

		if (!tileClass)
			throw new Error('Invalid tile constructor specified');

		this.tileClass = tileClass;
	}


	async parse()
	{
		this.items = [];
		let listItems = await this.queryAll(this.elem, ':scope > *');
		if (!listItems || !listItems.length || (listItems.length == 1 && await this.prop(listItems[0], 'tagName') == 'SPAN'))
			return;

		this.items = await asyncMap(listItems, item => this.tileClass.create(this.parent, item));
		this.items.sort((a, b) => a.id - b.id);
	}


    getItemData(item)
    {
        if (!item)
            throw new Error('Invalid item');

        return {
            id: item.id,
            balance: item.balance,
            name: item.name,
            isActive: item.isActive,
            icon_id: item.icon_id
        }
    }


    getItems()
    {
        return this.items.map(this.getItemData);
    }


	/**
	 * @returns {array} active items
	 */
	getActive()
	{
		return this.items.filter(item => item.isActive)
                         .map(this.getItemData);
	}


	/**
	 * @returns {number[]} indexes of active items
	 */
	getSelectedIndexes()
	{
		return this.items.filter(item => item.isActive)
                         .map(item => this.items.indexOf(item));
	}


	static renderAccounts(accountsList)
	{
		if (!(accountsList instanceof AccountsList))
			throw new Error('Invalid data');

		let visibleAccounts = accountsList.getVisible(true);

		let res = {
			items : visibleAccounts.map(Tile.renderAccount)
		};

		return res;
	}


	static renderHiddenAccounts(accountsList)
	{
		if (!(accountsList instanceof AccountsList))
			throw new Error('Invalid data');

		let hiddenAccounts = accountsList.getHidden(true);

		let res = {
			items : hiddenAccounts.map(Tile.renderAccount)
		};

		return res;
	}


	static renderPersons(personsList, tileClass = Tile)
	{
		if (!(personsList instanceof PersonsList))
			throw new Error('Invalid data');

		let visiblePersons = personsList.getVisible(true);

		let res = {
			items : visiblePersons.map(tileClass.renderPerson)
		};

		return res;
	}


	static renderHiddenPersons(personsList, tileClass = Tile)
	{
		if (!(personsList instanceof PersonsList))
			throw new Error('Invalid data');

		let hiddenPersons = personsList.getHidden(true);

		let res = {
			items : hiddenPersons.map(tileClass.renderPerson)
		};

		return res;
	}
}