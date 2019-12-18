if (typeof module !== 'undefined' && module.exports)
{
	const common = require('../common.js');
	var extend = common.extend;

	var TestView = require('./testview.js');
}


// Create or update account view class
class AccountView extends TestView
{

async parseContent()
{
	var res = {};

	res.heading = { elem : await this.query('.heading > h1') };
	if (!res.heading.elem)
		throw new Error('Heading element not found');
	res.heading.text = await this.prop(res.heading.elem, 'innerText');

	res.tile = await this.parseTile(await this.query('#acc_tile'));

	res.formElem = await this.query('form');
	if (!res.formElem)
		throw new Error('Form element not found');

	let hiddenEl = await this.query('#accid');
	res.isEdit = (!!hiddenEl);

	let curChildren = (res.isEdit) ? 3 : 2;
	let elem = await this.query('form > *:nth-child(' + curChildren + ')');

	res.iconDropDown = await this.parseDropDown(await this.query(elem, '.dd_container'));

	curChildren++;
	elem = await this.query('form > *:nth-child(' + curChildren + ')');
	res.name = await this.parseInputRow(elem);
	if (!res.name)
		throw new Error('Account name input not found');

	curChildren++;
	elem = await this.query('form > *:nth-child(' + curChildren + ')');
	res.currDropDown = await this.parseDropDown(await this.query(elem, '.dd_container'));

	curChildren++;
	elem = await this.query('form > *:nth-child(' + curChildren + ')');

	res.balance = await this.parseInputRow(elem);

	res.submitBtn = await this.query('.acc_controls .ok_btn');
	if (!res.submitBtn)
		throw new Error('Submit button not found');

	return res;
}


async inputName(val)
{
	return this.performAction(() => this.content.name.input(val));
}


async inputBalance(val)
{
	return this.performAction(() => this.content.balance.input(val));
}


async changeCurrency(val)
{
	return this.performAction(() => this.content.currDropDown.selectByValue(val));
}


async changeIcon(val)
{
	return this.performAction(() => this.content.iconDropDown.selectByValue(val));
}

}

if (typeof module !== 'undefined' && module.exports)
	module.exports = AccountView;
