// Create or update account page tests
function PersonPage()
{
	PersonPage.parent.constructor.apply(this, arguments);
}


extend(PersonPage, TestPage);


PersonPage.prototype.parseContent = async function()
{
	var res = {};

	res.headingElem = await this.query('.heading > h1');
	if (!res.headingElem)
		throw new Error('Heading element not found');
	res.heading = res.headingElem.innerText;

	res.formElem = await this.query('form');
	if (!res.formElem)
		throw new Error('Form element not found');

	res.isEdit = (res.formElem.firstElementChild.id == 'pid');

	res.name = await this.parseInputRow(await this.query(res.formElem, 'div.non_float'));
	if (!res.name)
		throw new Error('Person name input not found');

	res.submitBtn = await this.query('.acc_controls .ok_btn');
	if (!res.submitBtn)
		throw new Error('Submit button not found');

	return res;
};


PersonPage.prototype.inputName = function(val)
{
	this.performAction(() => this.content.name.input(val));
};


// Input name, submit and return navigation promise
PersonPage.prototype.createPerson = async function(personName)
{
	await this.inputName(personName);

	return this.navigation(() => this.click(this.content.submitBtn), PersonsPage);
};
