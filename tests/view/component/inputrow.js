import { NullableComponent } from './component.js';
import { DropDown } from './dropdown.js';


export class InputRow extends NullableComponent
{
	async parse()
	{
		this.labelEl = await this.query(this.elem, 'label');
		if (!this.labelEl)
			throw new Error('Label element not found');
		this.label = await this.prop(this.labelEl, 'innerText');

		this.currElem = await this.query(this.elem, '.btn.rcurr_btn') || await this.query(this.elem, '.exchrate_comm');
		this.isCurrActive = false;
		if (this.currElem)
		{
			this.isCurrActive = !await this.hasClass(this.currElem, 'inact_rbtn') && !await this.hasClass(this.currElem, 'exchrate_comm');
			if (this.isCurrActive)
			{
				let ddElem = await this.query(this.currElem, ':scope > *');
				this.currDropDown = await DropDown.create(this.parent, ddElem);
				if (!this.currDropDown.isAttached)
					throw new Error('Currency drop down is not attached');
				this.currSignElem = this.currDropDown.selectBtn;
			}
			else if (await this.hasClass(this.currElem, 'exchrate_comm'))
			{
				this.currSignElem = this.currElem;
			}
			else
			{
				this.currSignElem = await this.query(this.currElem, ':scope > *');
			}

			this.currSign = await this.prop(this.currSignElem, 'innerText');
		}
		else
		{
			this.datePickerBtn = await this.query(this.elem, '.btn.cal_btn');
		}

		let t = await this.query(this.elem, 'input[type="hidden"]');
		if (t)
		{
			this.hiddenValue = await this.prop(t, 'value');
		}

		this.valueInput = await this.query(this.elem, '.stretch_input > input');
		this.value = await this.prop(this.valueInput, 'value');
	}


	async input(val)
	{
		return this.environment.input(this.valueInput, val.toString());
	}


	async selectCurr(curr_id)
	{
		if (this.isCurrActive && this.currDropDown)
			return this.currDropDown.select(curr_id);
	}
}
