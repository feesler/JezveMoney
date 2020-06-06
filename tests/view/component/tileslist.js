import { NullableComponent } from './component.js';
import { Tile } from './tile.js';
import { InfoTile } from './infotile.js';
import { asyncMap } from '../../common.js';


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


	static renderAccounts(accountsList)
	{
		if (!Array.isArray(accountsList))
			throw new Error('Invalid data');

		let res = {
			tiles : {
				items : accountsList.map(Tile.renderAccount)
			}
		};

		return res;
	}


	static renderPersons(personsList, tileClass = Tile)
	{
		if (!Array.isArray(personsList))
			throw new Error('Invalid data');

		let personTiles = {
			items : personsList.map(tileClass.renderPerson)
		};

		let res = {};
		if (tileClass == InfoTile)
			res.infoTiles = personTiles;
		else
			res.tiles = personTiles;

		return res;
	}
}