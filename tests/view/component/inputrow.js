import { NullableComponent } from './component.js';
import { DropDown } from './dropdown.js';


export class InputRow extends NullableComponent
{
	async parse()
	{
		const env = this.parent.props.environment;

		this.labelEl = await env.query(this.elem, 'label');
		if (!this.labelEl)
			throw new Error('Label element not found');
		this.label = await env.prop(this.labelEl, 'innerText');

		this.currElem = await env.query(this.elem, '.btn.rcurr_btn') || await env.query(this.elem, '.exchrate_comm');
		this.isCurrActive = false;
		if (this.currElem)
		{
			this.isCurrActive = !await env.hasClass(this.currElem, 'inact_rbtn') && !await env.hasClass(this.currElem, 'exchrate_comm');
			if (this.isCurrActive)
			{
				let ddElem = await env.query(this.currElem, ':scope > *');
				this.currDropDown = await DropDown.create(this.parent, ddElem);
				if (!this.currDropDown.isAttached)
					throw new Error('Currency drop down is not attached');
				this.currSignElem = this.currDropDown.selectBtn;
			}
			else if (await env.hasClass(this.currElem, 'exchrate_comm'))
			{
				this.currSignElem = this.currElem;
			}
			else
			{
				this.currSignElem = await env.query(this.currElem, ':scope > *');
			}

			this.currSign = await env.prop(this.currSignElem, 'innerText');
		}
		else
		{
			this.datePickerBtn = await env.query(this.elem, '.btn.cal_btn');
		}

		let t = await env.query(this.elem, 'input[type="hidden"]');
		if (t)
		{
			this.hiddenValue = await env.prop(t, 'value');
		}

		this.valueInput = await env.query(this.elem, '.stretch_input > input');
		this.value = await env.prop(this.valueInput, 'value');
	}


	async input(val)
	{
		const env = this.parent.props.environment;

		return env.input(this.valueInput, val.toString());
	}


	async selectCurr(val)
	{
		if (this.isCurrActive && this.currDropDown)
			return this.currDropDown.selectByValue(val);
	}
}
