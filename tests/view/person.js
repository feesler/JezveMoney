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

		res.isUpdate = (!!await this.query('#pid'));

		res.delBtn = await IconLink.create(this, await this.query('#del_btn'));

		res.name = await InputRow.create(this, await this.query(res.formElem, 'div.non_float'));
		if (!res.name)
			throw new Error('Person name input not found');

		res.submitBtn = await this.query('.acc_controls .ok_btn');
		if (!res.submitBtn)
			throw new Error('Submit button not found');

		res.delete_warning = await WarningPopup.create(this, await this.query('#delete_warning'));

		return res;
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


	// Input name, submit and return navigation promise
	async createPerson(personName)
	{
		await this.inputName(personName);

		return this.navigation(() => this.click(this.content.submitBtn));
	}
}

