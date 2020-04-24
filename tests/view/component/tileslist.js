import { NullableComponent } from './component.js';
import { Tile } from './tile.js';
import { InfoTile } from './infotile.js';


export class TilesList extends NullableComponent
{
	constructor(parent, elem, tileClass)
	{
		super(parent, elem, tileClass);

		if (!tileClass)
			throw new Error('Invalid tile constructor specified');

		this.tileClass = tileClass;
	}


	async parse()
	{
		const env = this.parent.props.environment;

		this.items = [];
		let children = await env.queryAll(this.elem, ':scope > *');
		if (!children || !children.length || (children.length == 1 && await env.prop(children[0], 'tagName') == 'SPAN'))
			return;

		for(let i = 0; i < children.length; i++)
		{
			let tileObj = await this.tileClass.create(this.parent, children[i]);

			this.items.push(tileObj);
		}

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