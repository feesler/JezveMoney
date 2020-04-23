import { NullableComponent } from './component.js';
import { IconLink } from './iconlink.js';
import { InputRow } from './inputrow.js';


export class DatePickerRow extends NullableComponent
{
	async parse()
	{
		const env = this.parent.props.environment;

		this.iconLink = await IconLink.create(this.parent, await env.query(this.elem, '.iconlink'));
		if (!this.iconLink)
			throw new Error('Iconlink of date picker not found');

		this.inputRow = await InputRow.create(this.parent, await env.query(this.elem, '.iconlink + *'));
		if (!this.inputRow || !this.inputRow.datePickerBtn)
			throw new Error('Unexpected structure of date picker input row');
		this.date = this.inputRow.value;
	}


	async input(val)
	{
		const env = this.parent.props.environment;

		if (env.isVisible(this.iconLink.elem))
		{
			await this.iconLink.click();
			await env.click(this.inputRow.datePickerBtn);
		}

		return this.inputRow.input(val);
	}
}
