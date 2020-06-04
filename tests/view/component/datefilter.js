import { NullableComponent } from './component.js';
import { IconLink } from './iconlink.js';
import { copyObject, isDate, fixDate } from '../../common.js';
import { DatePicker } from './datepicker.js';


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

		this.datePicker = await DatePicker.create(this.parent, await env.query(this.elem, '.calBase'));
	}


	async selectDate(date)
	{
		const env = this.parent.props.environment;

		if (!isDate(date))
			throw new Error('Invalid parameter');

		if (await env.isVisible(this.iconLink.elem))
		{
			await this.iconLink.click();
			await this.parse();
		}

		if (!this.datePicker)
			throw new Error('Date picker component not found');

		await this.datePicker.selectDate(date);
	}


	async selectRange(date1, date2)
	{
		const env = this.parent.props.environment;

		if (!isDate(date1) || !isDate(date2))
			throw new Error('Invalid parameters');

		if (await env.isVisible(this.iconLink.elem))
			await this.iconLink.click();
		else
			await env.click(this.datePickerBtn);
		await this.parse();

		if (!this.datePicker)
			throw new Error('Date picker component not found');
		await this.datePicker.selectRange(date1, date2);
	}


	getSelectedRange()
	{
		return copyObject(this.value);
	}


	async input(val)
	{
		const env = this.parent.props.environment;

		if (await env.isVisible(this.iconLink.elem))
		{
			await this.iconLink.click();
			await this.parent.performAction(() => env.click(this.datePickerBtn));
		}

		return env.input(this.inputElem, val);
	}
}
