import { NullableComponent } from './component.js';
import { IconLink } from './iconlink.js';
import { InputRow } from './inputrow.js';


export class CommentRow extends NullableComponent
{
	async parse()
	{
		const env = this.parent.props.environment;

		let iconLinkElem = await env.query(this.elem, '.iconlink');

		this.iconLink = await IconLink.create(this.parent, iconLinkElem);
		if (!this.iconLink)
			throw new Error('Iconlink of comment not found');

		this.inputRow = await InputRow.create(this.parent, await env.query(this.elem, '#comment_block'));
		if (!this.inputRow)
			throw new Error('Input row of comment not found');

		this.value = this.inputRow.value;
	}


	async input()
	{
		const env = this.parent.props.environment;

		if (await env.isVisible(this.iconLink.elem))
			await this.iconLink.click();

		return this.inputRow.input(val);
	}
}
