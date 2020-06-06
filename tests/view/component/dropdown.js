import { NullableComponent } from './component.js';
import { asyncMap } from '../../common.js';


export class DropDown extends NullableComponent
{
	async parse()
	{
		if (!this.elem || (!await this.hasClass(this.elem, 'dd_container') && !await this.hasClass(this.elem, 'dd_attached')))
			throw new Error('Wrong drop down element');

		this.isAttached = await this.hasClass(this.elem, 'dd_attached');
		if (this.isAttached)
			this.selectBtn = await this.query(this.elem, ':scope > *');
		else
			this.selectBtn = await this.query(this.elem, 'button.selectBtn');
		if (!this.selectBtn)
			throw new Error('Select button not found');

		if (!this.isAttached)
		{
			this.statSel = await this.query(this.elem, '.dd_input_cont span.statsel');
			if (!this.statSel)
				throw new Error('Static select element not found');
			this.inputElem = await this.query(this.elem, '.dd_input_cont input');
			if (!this.inputElem)
				throw new Error('Input element not found');

			this.editable = await this.isVisible(this.inputElem);
			this.textValue = await ((this.editable) ? this.prop(this.inputElem, 'value') : this.prop(this.statSel, 'innerText'));
		}

		this.selectElem = await this.query(this.elem, 'select');
		this.isMulti = await this.prop(this.selectElem, 'multiple');

		this.listContainer = await this.query(this.elem, '.ddlist');
		this.isMobile = await this.hasClass(this.listContainer, 'ddmobile');
		if (this.isMobile)
		{
			this.items = [];

			let options = await this.prop(this.selectElem, 'options');
			for(let option of options)
			{
				if (await this.prop(option, 'disabled'))
					continue;

				let itemObj = {
					id : this.parseId(await this.prop(option, 'id')),
					text : await this.prop(option, 'innerText'),
					selected : await this.prop(option, 'selected'),
					elem : option
				};

				this.items.push(itemObj);
			}
		}
		else if (this.listContainer)
		{
			let listItems = await this.queryAll(this.elem, '.ddlist li > div');
			this.items = await asyncMap(listItems, async (item) =>
			{
				return {
					id : this.parseId(await this.prop(item, 'id')),
					text : await this.prop(item, 'innerText'),
					selected : await this.prop(await this.query(item, "input[type=checkbox]"), 'checked'),
					elem : item
				};
			});

		}
	}


	async selectByValue(val)
	{
		if (this.isMobile)
		{
			let option = this.items.find(item => item.id == val);
			if (!option)
				throw new Error('Option item not found');

			await this.selectByValue(this.selectElem, option.elem.value);
			await this.onChange(this.selectElem);
		}
		else
		{
			await this.click(this.selectBtn);
			let li = this.items.find(item => item.id == val);
			if (!li)
				throw new Error('List item not found');
			await this.click(li.elem);
		}
	}


	async select(val)
	{
		let values = Array.isArray(val) ? val : [ val ];

		for(let value of values)
		{
			await this.selectByValue(value);
		}

		if (this.isMobile)
			await this.onBlur(this.selectElem);
		else if (this.isMulti)
			await this.click(this.selectBtn);
	}


	getSelectedValues()
	{
		let res = this.items.filter(item => item.selected)
							.map(item => item.id);
		return res;
	}
}
