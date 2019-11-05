if (typeof module !== 'undefined' && module.exports)
{
	const common = require('../common.js');
	var extend = common.extend;

	var TestView = require('./testview.js');
}


// Create or update account view tests
function PersonView()
{
	PersonView.parent.constructor.apply(this, arguments);
}


extend(PersonView, TestView);


PersonView.prototype.parseContent = async function()
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
};


PersonView.prototype.inputName = async function(val)
{
	return this.performAction(() => this.content.name.input(val));
};


// Input name, submit and return navigation promise
PersonView.prototype.createPerson = async function(personName)
{
	await this.inputName(personName);

	return this.navigation(() => this.click(this.content.submitBtn));
};


if (typeof module !== 'undefined' && module.exports)
	module.exports = PersonView;
