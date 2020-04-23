import { NullableComponent } from './component.js';


export class TileInfoItem extends NullableComponent
{
	async parse()
	{
		const env = this.parent.props.environment;

		this.titleElem = await env.query(this.elem, ':scope > *');
		if (!this.titleElem)
			throw new Error('Title element not found');
		this.title = await env.prop(this.titleElem, 'innerText');

		this.buttonElem = await env.query(this.elem, 'button');
		if (!this.buttonElem)
			throw new Error('Button element not found');
		let buttonInner = await env.query(this.buttonElem, 'span');
		if (!buttonInner)
			throw new Error('Wrong structure of tile info block');
		this.value = await env.prop(buttonInner, 'innerText');
	}


	async click()
	{
		const env = this.parent.props.environment;

		return env.click(this.buttonElem);
	}
}
