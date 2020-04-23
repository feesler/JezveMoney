import { NullableComponent } from './component.js';
import { IconLink } from './iconlink.js';


export class DatePickerFilter extends NullableComponent
{
	async parse()
	{
		const env = this.parent.props.environment;

		this.iconLink = await IconLink.create(this.parent, await env.query(this.elem, '.iconlink'));
		if (!this.iconLink)
			throw new Error('Iconlink of date picker not found');

		this.inputElem = await env.query(this.elem, '.stretch_input > input');
		if (!this.inputElem)
			throw new Error('Input element not found');

		this.datePickerBtn = await env.query(this.elem, '#cal_rbtn');
		if (!this.datePickerBtn)
			throw new Error('Date picker button not found');

		this.dayCells = [];
		let cells = await env.queryAll(this.elem, '.calTbl td');
		for(let cell of cells)
		{
			if (await env.hasClass(cell, 'omonth'))
				continue;

			let dayCell = {
				elem : cell,
				day : await env.prop(cell, 'innerHTML')
			};

			this.dayCells.push(dayCell);
		}
	}


	async select(val)
	{
		const env = this.parent.props.environment;

		if (await env.isVisible(this.iconLink.elem))
		{
			await this.iconLink.click();
			await performAction(() => env.click(this.datePickerBtn));
		}

		let cell = this.dayCells.find(item => item.day == val);
		if (cell)
			await this.parent.performAction(() => env.click(cell));
	}


	async selectRange(val1, val2)
	{
		const env = this.parent.props.environment;

		await this.parent.performAction(async () =>
		{
			if (await env.isVisible(this.iconLink.elem))
				return this.iconLink.click();
			else
				return env.click(this.datePickerBtn);
		});

		let cell1 = this.parent.content.dateFilter.dayCells.find(item => item.day == val1);
		if (!cell1)
			throw new Error(`Cell ${val1} not found`);

		let cell2 = this.parent.content.dateFilter.dayCells.find(item => item.day == val2);
		if (!cell2)
			throw new Error(`Cell ${val2} not found`);

		await env.click(cell1.elem);
		return env.click(cell2.elem);
	}


	async input(val)
	{
		const env = this.parent.props.environment;

		if (env.isVisible(this.iconLink.elem))
		{
			await this.iconLink.click();
			await this.parent.performAction(() => env.click(this.datePickerBtn));
		}

		return env.input(this.inputElem, val);
	}
}
