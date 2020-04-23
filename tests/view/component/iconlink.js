import { NullableComponent } from './component.js';


export class IconLink extends NullableComponent
{
	async parse()
	{
		const env = this.parent.props.environment;

		if (!this.elem)
			return null;

		if (!await env.hasClass(this.elem, 'iconlink'))
			throw new Error('Wrong icon link');

		this.linkElem = await env.query(this.elem, ':scope > *');
		if (!this.linkElem)
			throw new Error('Link element not found');

		this.titleElem = await env.query(this.linkElem, '.icontitle');
		let titleInner = await env.query(this.titleElem, ':scope > *');
		if (!titleInner)
			throw new Error('Title element not found');
		this.title = await env.prop(titleInner, 'innerText');

		// Subtitle is optional
		this.subTitleElem = await env.query(this.titleElem, '.subtitle');
		if (this.subTitleElem)
		{
			this.subtitle = await env.prop(this.subTitleElem, 'innerText');
		}
	}


	async click()
	{
		const env = this.parent.props.environment;

		return env.click(this.linkElem);
	}
}
