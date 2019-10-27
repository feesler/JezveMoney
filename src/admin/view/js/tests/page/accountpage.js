// Create or update account page tests
function AccountPage()
{
	AccountPage.parent.constructor.apply(this, arguments);
}


extend(AccountPage, TestPage);


AccountPage.prototype.parseContent = function()
{
	var res = {};

	res.heading = { elem : vquery('.heading > h1') };
	if (!res.heading.elem)
		throw new Error('Heading element not found');
	res.heading.text = res.heading.elem.innerText;

	res.tile = this.parseTile(vquery('#acc_tile'));

	res.formElem = vquery('form');
	if (!res.formElem)
		throw new Error('Form element not found');

	res.isEdit = (res.formElem.firstElementChild.id == 'accid');

	var elem = res.formElem.firstElementChild.nextElementSibling;
	if (res.isEdit)
		elem = elem.nextElementSibling;
	res.iconDropDown = this.parseDropDown(vquery(elem, '.dd_container'));

	elem = elem.nextElementSibling;
	res.name = this.parseInputRow(elem);
	if (!res.name)
		throw new Error('Account name input not found');

	elem = elem.nextElementSibling;
	res.currDropDown = this.parseDropDown(vquery(elem, '.dd_container'));

	elem = elem.nextElementSibling;

	res.balance = this.parseInputRow(elem);

	res.submitBtn = vquery('.acc_controls .ok_btn');
	if (!res.submitBtn)
		throw new Error('Submit button not found');

	return res;
};


AccountPage.prototype.inputName = function(val)
{
	this.performAction(() => this.content.name.input(val));
};


AccountPage.prototype.inputBalance = function(val)
{
	this.performAction(() => this.content.balance.input(val));
};


AccountPage.prototype.changeCurrency = function(val)
{
	this.performAction(() => this.content.currDropDown.selectByValue(val));
};


AccountPage.prototype.changeIcon = function(val)
{
	this.performAction(() => this.content.iconDropDown.selectByValue(val));
};
