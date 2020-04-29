import { NullableComponent } from './component.js';
import { IconLink } from './iconlink.js';
import { copyObject, isDate, fixDate } from '../../common.js';


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

		let dateValue = await env.prop(this.inputElem, 'value');
		if (!dateValue)
			dateValue = '';

		if (dateValue == '')
		{
			this.value = { startDate : null, endDate : null };
		}
		else
		{
			let dates = dateValue.split(' - ');
			this.value = { startDate : dates[0], endDate : dates[1] };
		}

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


	isSameMonth(date1, date2)
	{
		if (!isDate(date1) || !isDate(date2))
			throw new Error('Invalid parameters');
		
		return date1.getMonth() == date2.getMonth() && date1.getFullYear() == date2.getFullYear();
	}


	async selectRange(date1, date2)
	{
		const env = this.parent.props.environment;

		if (!isDate(date1) || !isDate(date2))
			throw new Error('Invalid parameters');

		let now = new Date();
		if (!this.isSameMonth(date1, now) || !this.isSameMonth(date2, now))
			throw new Error('Only current month is supported now');

		await this.parent.performAction(async () =>
		{
			if (await env.isVisible(this.iconLink.elem))
				return this.iconLink.click();
			else
				return env.click(this.datePickerBtn);
		});

		let day1 = date1.getDate();
		let cell1 = this.parent.content.dateFilter.dayCells.find(item => item.day == day1);
		if (!cell1)
			throw new Error(`Cell ${val1} not found`);

		let day2 = date2.getDate();
		let cell2 = this.parent.content.dateFilter.dayCells.find(item => item.day == day2);
		if (!cell2)
			throw new Error(`Cell ${val2} not found`);

		await env.click(cell1.elem);
		return env.click(cell2.elem);
	}


	getSelectedRange()
	{
		return copyObject(this.value);
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
