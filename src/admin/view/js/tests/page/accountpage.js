// Create or update account page tests
function AccountPage()
{
	AccountPage.parent.constructor.apply(this, arguments);
}


extend(AccountPage, TestPage);


AccountPage.prototype.parseContent = async function()
{
	var res = {};

	res.heading = { elem : await this.query('.heading > h1') };
	if (!res.heading.elem)
		throw new Error('Heading element not found');
	res.heading.text = res.heading.elem.innerText;

	res.tile = await this.parseTile(await this.query('#acc_tile'));

	res.formElem = await this.query('form');
	if (!res.formElem)
		throw new Error('Form element not found');

	res.isEdit = (res.formElem.firstElementChild.id == 'accid');

	var elem = res.formElem.firstElementChild.nextElementSibling;
	if (res.isEdit)
		elem = elem.nextElementSibling;
	res.iconDropDown = await this.parseDropDown(await this.query(elem, '.dd_container'));

	elem = elem.nextElementSibling;
	res.name = await this.parseInputRow(elem);
	if (!res.name)
		throw new Error('Account name input not found');

	elem = elem.nextElementSibling;
	res.currDropDown = await this.parseDropDown(await this.query(elem, '.dd_container'));

	elem = elem.nextElementSibling;

	res.balance = await this.parseInputRow(elem);

	res.submitBtn = await this.query('.acc_controls .ok_btn');
	if (!res.submitBtn)
		throw new Error('Submit button not found');

	return res;
};


AccountPage.prototype.inputName = function(val)
{
	return this.performAction(() => this.content.name.input(val));
};


AccountPage.prototype.inputBalance = function(val)
{
	return this.performAction(() => this.content.balance.input(val));
};


AccountPage.prototype.changeCurrency = function(val)
{
	return this.performAction(() => this.content.currDropDown.selectByValue(val));
};


AccountPage.prototype.changeIcon = function(val)
{
	return this.performAction(() => this.content.iconDropDown.selectByValue(val));
};
