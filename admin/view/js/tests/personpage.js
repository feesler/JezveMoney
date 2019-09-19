// Create or update account page tests
function PersonPage()
{
	PersonPage.parent.constructor.apply(this, arguments);
}


extend(PersonPage, TestPage);


PersonPage.prototype.parseContent = function()
{
	var res = {};

	res.headingElem = vquery('.heading > h1');
	if (!res.headingElem)
		throw new Error('Heading element not found');
	res.heading = res.headingElem.innerHTML;

	res.formElem = vquery('form');
	if (!res.formElem)
		throw new Error('Form element not found');

	res.isEdit = (res.formElem.firstElementChild.id == 'pid');

	res.name = this.parseInputRow(res.formElem.querySelector('div.non_float'));
	if (!res.name)
		throw new Error('Person name input not found');

	res.submitBtn = vquery('.acc_controls .ok_btn');
	if (!res.submitBtn)
		throw new Error('Submit button not found');

	return res;
};


PersonPage.prototype.inputName = function(val)
{
	this.performAction(() => this.content.name.input(val));
};


// Input name, submit and return navigation promise
PersonPage.prototype.createPerson = function(personName)
{
	this.inputName(personName);

	return navigation(() => clickEmul(this.content.submitBtn), PersonsPage);
};
