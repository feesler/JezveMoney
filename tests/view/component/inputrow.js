import { NullableComponent } from './component.js';
import { DropDown } from './dropdown.js';


export class InputRow extends NullableComponent
{
	async parse()
	{
		this.labelEl = await this.query(this.elem, 'label');
		if (!this.labelEl)
			throw new Error('Label element not found');
		this.label = await this.prop(this.labelEl, 'textContent');

		this.currElem = await this.query(this.elem, '.btn.input-group__btn');
		this.isCurrActive = false;
		if (this.currElem)
		{
			this.isCurrActive = !await this.hasClass(this.currElem, 'input-group__btn_inactive');
			if (this.isCurrActive)
			{
				let ddElem = await this.query(this.currElem, ':scope > *');
				this.currDropDown = await DropDown.create(this.parent, ddElem);
				if (!this.currDropDown.isAttached)
					throw new Error('Currency drop down is not attached');
				this.currSignElem = this.currDropDown.selectBtn;
			}
			else
			{
				this.currSignElem = await this.query(this.currElem, ':scope > *');
			}

			this.currSign = await this.prop(this.currSignElem, 'textContent');
		}
		else
		{
			let datePickerContainer = await this.query('#calendar');
			if (datePickerContainer)
				this.datePickerBtn = await this.query(this.elem, '.btn.icon-btn');
		}

		let t = await this.query(this.elem, 'input[type="hidden"]');
		if (t)
		{
			this.hiddenValue = await this.prop(t, 'value');
		}

		this.valueInput = await this.query(this.elem, '.stretch-input > input');
		this.value = await this.prop(this.valueInput, 'value');

		this.validationEnabled = await this.hasClass(this.elem, 'validation-block');
		if (this.validationEnabled)
		{
			this.isInvalid = await this.hasClass(this.elem, 'invalid-block');
			this.feedBackElem = await this.query(this.elem, '.invalid-feedback');
			if (!this.feedBackElem)
				throw new Error('Validation feedback element not found');
			this.feedbackText = await this.prop(this.feedBackElem, 'textContent');
		}
	}


	async input(val)
	{
		return this.environment.input(this.valueInput, val.toString());
	}


	async selectCurr(curr_id)
	{
		if (this.isCurrActive && this.currDropDown)
			return this.currDropDown.setSelection(curr_id);
	}
}
