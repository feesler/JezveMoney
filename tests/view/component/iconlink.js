import { NullableComponent } from './component.js';


export class IconLink extends NullableComponent
{
	async parse()
	{
		if (!this.elem)
			return null;

		if (!await this.hasClass(this.elem, 'iconlink'))
			throw new Error('Wrong icon link');

		this.linkElem = await this.query(this.elem, ':scope > *');
		if (!this.linkElem)
			throw new Error('Link element not found');

		const tag = await this.prop(this.linkElem, 'tagName');
		if (tag == 'A')
			this.link = await this.prop(this.linkElem, 'href');

		this.titleElem = await this.query(this.linkElem, '.icontitle');
		let titleInner = await this.query(this.titleElem, ':scope > *');
		if (!titleInner)
			throw new Error('Title element not found');
		this.title = await this.prop(titleInner, 'innerText');

		// Subtitle is optional
		this.subTitleElem = await this.query(this.titleElem, '.subtitle');
		if (this.subTitleElem)
		{
			this.subtitle = await this.prop(this.subTitleElem, 'innerText');
		}
	}


	async click()
	{
		return this.environment.click(this.linkElem);
	}
}
