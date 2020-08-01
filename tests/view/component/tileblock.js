import { NullableComponent } from './component.js';
import { Tile } from './tile.js';
import { DropDown } from './dropdown.js';


export class TileBlock extends NullableComponent
{
	async parse()
	{
		let lbl = await this.query(this.elem, 'div > label');
		if (!lbl)
			throw new Error('Tile block label not found');
		this.label = await this.prop(lbl, 'innerText');

		this.tile = await Tile.create(this.parent, await this.query(this.elem, '.tile'));
		if (!this.tile)
			throw new Error('Tile not found');

		let ddElem = await this.query(this.elem, '.dd__container_attached');
		this.dropDown = await DropDown.create(this.parent, ddElem);
	}


	async selectAccount(account_id)
	{
		if (this.dropDown)
			return this.dropDown.select(account_id);
	}
}
