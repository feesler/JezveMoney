import { NullableComponent } from './component.js';
import { Tile } from './tile.js';
import { DropDown } from './dropdown.js';


export class TileBlock extends NullableComponent
{
	async parse()
	{
		const env = this.parent.props.environment;

		let lbl = await env.query(this.elem, 'div > label');
		if (!lbl)
			throw new Error('Tile block label not found');
		this.label = await env.prop(lbl, 'innerText');

		this.tile = await Tile.create(this.parent, await env.query(this.elem, '.tile'));
		if (!this.tile)
			throw new Error('Tile not found');

		let ddElem = await env.query(this.elem, '.dd_attached');
		this.dropDown = await DropDown.create(this.parent, ddElem);
	}


	async selectAccount(val)
	{
		if (this.dropDown)
			return this.dropDown.selectByValue(val);
	}
}
