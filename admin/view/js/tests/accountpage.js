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
		throw 'Heading element not found';
	res.heading.text = res.heading.elem.innerHTML;

	res.tile = this.parseTile(vge('acc_tile'));

	res.formElem = vquery('form');
	if (!res.formElem)
		throw 'Form element not found';

	res.isEdit = (res.formElem.firstElementChild.id == 'accid');

	var elem = res.formElem.firstElementChild.nextElementSibling;
	if (res.isEdit)
		elem = elem.nextElementSibling;
	res.iconDropDown = this.parseDropDown(elem.querySelector('.dd_container'));

	elem = elem.nextElementSibling;
	res.name = this.parseInputRow(elem);
	if (!res.name)
		throw 'Account name input not found';

	elem = elem.nextElementSibling;
	res.currDropDown = this.parseDropDown(elem.querySelector('.dd_container'));

	elem = elem.nextElementSibling;

	res.balance = this.parseInputRow(elem);

	res.submitBtn = vquery('.acc_controls .ok_btn');
	if (!res.submitBtn)
		throw 'Submit button not found';

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
