import { NullableComponent } from './component.js';
import { asyncMap } from '../../common.js';


export class DropDown extends NullableComponent
{
	async parse()
	{
		const env = this.parent.props.environment;

		if (!this.elem || (!await env.hasClass(this.elem, 'dd_container') && !await env.hasClass(this.elem, 'dd_attached')))
			throw new Error('Wrong drop down element');

		this.isAttached = await env.hasClass(this.elem, 'dd_attached');
		if (this.isAttached)
			this.selectBtn = await env.query(this.elem, ':scope > *');
		else
			this.selectBtn = await env.query(this.elem, 'button.selectBtn');
		if (!this.selectBtn)
			throw new Error('Select button not found');

		if (!this.isAttached)
		{
			this.statSel = await env.query(this.elem, '.dd_input_cont span.statsel');
			if (!this.statSel)
				throw new Error('Static select element not found');
			this.input = await env.query(this.elem, '.dd_input_cont input');
			if (!this.input)
				throw new Error('Input element not found');

			this.editable = await env.isVisible(this.input);
			this.textValue = await ((this.editable) ? env.prop(this.input, 'value') : env.prop(this.statSel, 'innerText'));
		}

		this.selectElem = await env.query(this.elem, 'select');

		this.listContainer = await env.query(this.elem, '.ddlist');
		this.isMobile = await env.hasClass(this.listContainer, 'ddmobile');
		if (this.isMobile)
		{
			this.items = [];

			let options = await env.prop(this.selectElem, 'options');
			for(let option of options)
			{
				if (await env.prop(option, 'disabled'))
					continue;

				let itemObj = {
					id : this.parseId(await env.prop(option, 'value')),
					text : await env.prop(option, 'innerText'),
					elem : option
				};

				this.items.push(itemObj);
			}
		}
		else if (this.listContainer)
		{
			let listItems = await env.queryAll(this.elem, '.ddlist li > div');
			this.items = await asyncMap(listItems, async (item) =>
			{
				return {
					id : this.parseId(await env.prop(item, 'id')),
					text : await env.prop(item, 'innerText'),
					elem : item
				};
			});

		}
	}


	async selectByValue(val)
	{
		const env = this.parent.props.environment;

		if (this.isMobile)
		{
			let option = this.items.find(item => item.id == val);
			if (!option)
				throw new Error('Option item not found');

			await env.selectByValue(this.selectElem, option.elem.value);
			return env.onChange(this.selectElem);
		}
		else
		{
			await env.click(this.selectBtn);
			let li = this.items.find(item => item.id == val);
			if (!li)
				throw new Error('List item not found');
			return env.click(li.elem);
		}
	};
}