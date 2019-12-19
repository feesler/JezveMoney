import { TestView } from './testview.js';


// Create or update account view tests
class PersonView extends TestView
{
	async parseContent()
	{
		var res = {};

		res.headingElem = await this.query('.heading > h1');
		if (!res.headingElem)
			throw new Error('Heading element not found');
		res.heading = await this.prop(res.headingElem, 'innerText');

		res.formElem = await this.query('form');
		if (!res.formElem)
			throw new Error('Form element not found');

		res.isEdit = (!!await this.query('#pid'));

		res.name = await this.parseInputRow(await this.query(res.formElem, 'div.non_float'));
		if (!res.name)
			throw new Error('Person name input not found');

		res.submitBtn = await this.query('.acc_controls .ok_btn');
		if (!res.submitBtn)
			throw new Error('Submit button not found');

		return res;
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


export { PersonView };
