import { TestView } from './testview.js';
import { InputRow } from './component/inputrow.js';
import { IconLink } from './component/iconlink.js';
import { WarningPopup } from './component/warningpopup.js';


// Create or update account view tests
export class PersonView extends TestView
{
	async parseContent()
	{
		let res = {};

		res.headingElem = await this.query('.heading > h1');
		if (!res.headingElem)
			throw new Error('Heading element not found');
		res.heading = await this.prop(res.headingElem, 'innerText');

		res.formElem = await this.query('form');
		if (!res.formElem)
			throw new Error('Form element not found');

		let personIdInp = await this.query('#pid');
		res.isUpdate = !!personIdInp;
		if (res.isUpdate)
		{
			res.id = parseInt(await this.prop(personIdInp, 'value'));
			if (!res.id)
				throw new Error('Wrong account id');
		}

		res.delBtn = await IconLink.create(this, await this.query('#del_btn'));

		res.name = await InputRow.create(this, await this.query(res.formElem, 'div.non_float'));
		if (!res.name)
			throw new Error('Person name input not found');

		res.flagsInp = await this.query('#flags');
		res.flags = parseInt(await this.prop(res.flagsInp, 'value'));

		res.submitBtn = await this.query('.acc_controls .ok_btn');
		if (!res.submitBtn)
			throw new Error('Submit button not found');

		res.cancelBtn = await this.query('.acc_controls .cancel_btn');
		if (!res.cancelBtn)
			throw new Error('Cancel button not found');

		res.delete_warning = await WarningPopup.create(this, await this.query('#delete_warning'));

		return res;
	}


	async buildModel(cont)
	{
		let res = {};

		res.isUpdate = cont.isUpdate;
		if (res.isUpdate)
			res.id = cont.id;

		// Name
		res.name = cont.name.value;

		res.flags = cont.flags;

		return res;
	}


	getExpectedPerson()
	{
		let res = {
			name : this.model.name,
			flags : this.model.flags
		};

		if (this.model.isUpdate)
			res.id = this.model.id;

		return res;
	}


	isValid()
	{
		return (this.model.name && this.model.name.length > 0);
	}


	async clickDeleteButton()
	{
		if (!this.content.isUpdate || !this.content.delBtn)
			throw new Error('Unexpected action clickDeleteButton');

		return this.performAction(() => this.content.delBtn.click());
	}


	// Click on delete button and confirm wanring popup
	async deleteSelfItem()
	{
		await this.clickDeleteButton();

		if (!await this.isVisible(this.content.delete_warning.elem))
			throw 'Delete transaction warning popup not appear';
		if (!this.content.delete_warning.okBtn)
			throw 'OK button not found';

		await this.navigation(() => this.click(this.content.delete_warning.okBtn));
	}


	async inputName(val)
	{
		return this.performAction(() => this.content.name.input(val));
	}


	async submit()
	{
		let action = () => this.click(this.content.submitBtn);

		if (this.isValid())
			await this.navigation(action);
		else
			await this.performAction(action);
	}


	async cancel()
	{
		await this.navigation(() => this.click(this.content.cancelBtn));
	}
}

