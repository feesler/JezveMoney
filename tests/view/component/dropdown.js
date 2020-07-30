import { NullableComponent } from './component.js';
import { asyncMap } from '../../common.js';


export class DropDown extends NullableComponent
{
	// Find for closest parent DropDown container of element
	static async getParentContainer(env, elem)
	{
		if (!elem)
			throw new Error('Invalid element');

		let container = await env.closest(elem, '.dd__container');
		if (!container)
			container = await env.closest(elem, '.dd__container_attached');

		return container;
	}


	// Create new instance of DropDown component using any child element of container
	static async createFromChild(parent, elem)
	{
		if (!parent || !elem)
			throw new Error('Invalid parameters');

		let container = await DropDown.getParentContainer(parent.environment, elem);
		if (!container)
			throw new Error('Container not found');

		return super.create(parent, container);
	}


	async parse()
	{
		if (!this.elem || (!await this.hasClass(this.elem, 'dd__container') && !await this.hasClass(this.elem, 'dd__container_attached')))
			throw new Error('Invalid drop down element');

		this.isAttached = await this.hasClass(this.elem, 'dd__container_attached');
		if (this.isAttached)
			this.selectBtn = await this.query(this.elem, ':scope > *');
		else
			this.selectBtn = await this.query(this.elem, 'button.dd__toggle-btn');
		if (!this.selectBtn)
			throw new Error('Select button not found');

		this.disabled = await this.hasClass(this.elem, 'dd__container_disabled');

		if (!this.isAttached)
		{
			this.statSel = await this.query(this.elem, '.dd__single-selection');
			if (!this.statSel)
				throw new Error('Static select element not found');
			this.inputElem = await this.query(this.elem, 'input[type="text"]');
			if (!this.inputElem)
				throw new Error('Input element not found');

			this.editable = await this.isVisible(this.inputElem);
			this.textValue = await ((this.editable) ? this.prop(this.inputElem, 'value') : this.prop(this.statSel, 'textContent'));
		}

		this.selectElem = await this.query(this.elem, 'select');
		this.isMulti = await this.prop(this.selectElem, 'multiple');
		if (this.isMulti)
		{
			let selItemElems = await this.queryAll(this.elem, '.dd__selection > .dd__selection-item');
			this.selectedItems = await asyncMap(selItemElems, async el =>
			{
				let text = await this.prop(el, 'textContent');
				let ind = text.indexOf('×');
				if (ind !== -1)
					text = text.substr(0, ind);
				
				return text;
			});
		}

		let selectOptions = await this.queryAll(this.selectElem, 'option');
		let optionsData = await asyncMap(selectOptions, async (item) => {
			return {
				id : await this.prop(item, 'value'),
				title : await this.prop(item, 'textContent'),
				selected : await this.prop(item, 'selected')
			};
		})

		this.listContainer = await this.query(this.elem, '.dd__list');
		if (this.listContainer)
		{
			let listItems = await this.queryAll(this.elem, '.dd__list li > div');
			this.items = await asyncMap(listItems, async (item) =>
			{
				let res = {
					text : await this.prop(item, 'textContent'),
					elem : item
				};

				let option = optionsData.find(item => item.title == res.text);
				if (option)
				{
					res.id = option.id;
					res.selected = option.selected
				}

				return res;
			});
		}
	}


	async selectByValue(val)
	{
		await this.click(this.selectBtn);
		let li = this.items.find(item => item.id == val);
		if (!li)
			throw new Error('List item not found');
		await this.click(li.elem);
	}


	async select(val)
	{
		let values = Array.isArray(val) ? val : [ val ];

		for(let value of values)
		{
			await this.selectByValue(value);
		}

		if (this.isMulti)
			await this.click(this.selectBtn);
	}


	getSelectedValues()
	{
		let res = this.items.filter(item => item.selected)
							.map(item => item.id);
		return res;
	}
}
