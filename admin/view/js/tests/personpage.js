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
		throw 'Heading element not found';
	res.heading = res.headingElem.innerHTML;

	res.formElem = vquery('form');
	if (!res.formElem)
		throw 'Form element not found';

	res.isEdit = (res.formElem.firstElementChild.id == 'pid');

	res.nameInp = vge('pname');
	if (!res.nameInp)
		throw 'Person name input not found';
	res.name = res.nameInp.value;

	res.submitBtn = vquery('.acc_controls .ok_btn');
	if (!res.submitBtn)
		throw 'Submit button not found';

	return res;
};


PersonPage.prototype.inputName = function(val)
{
	this.performAction(() => inputEmul(this.content.nameInp, val));
};


// Input name, submit and return navigation promise
PersonPage.prototype.createPerson = function(personName)
{
	this.inputName(personName);

	return navigation(() => clickEmul(this.content.submitBtn), PersonsPage);
};
