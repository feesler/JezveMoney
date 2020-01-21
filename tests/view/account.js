import { TestView } from './testview.js';


// Create or update account view class
class AccountView extends TestView
{
	constructor(...args)
	{
		super(...args);

		this.nameTyped = false;
	}


	async buildModel(cont)
	{
		let res = {};

		res.isUpdate = cont.isUpdate;
		if (res.isUpdate)
			res.id = cont.id;

		// Name
		res.name = cont.name.value;
		res.nameTyped = this.nameTyped;

		// Iniital balance
		res.balance = cont.balance.value;
		res.fBalance = this.app.isValidValue(res.balance) ? this.app.normalize(res.balance) : res.balance;

		// Currency
		let selectedCurr = cont.currDropDown.textValue;
		res.currObj = this.app.findCurrencyByName(selectedCurr, this.app.currencies);
		if (!res.currObj)
			throw new Error(`Currency ${selectedCurr} not found`);

		res.curr_id = res.currObj.id

		// Icon
		let selectedIcon = cont.iconDropDown.textValue.toUpperCase();
		res.icon = this.tileIcons.findIndex(item => item.title.toUpperCase() == selectedIcon);
		res.tileIcon = this.tileIcons[res.icon];

		return res;
	}


	setExpectedAccount(account)
	{
		this.model.name = account.name.toString();

		this.model.balance = account.balance.toString();
		this.model.fBalance = account.balance;

		this.model.currObj = this.app.getCurrency(account.curr_id, this.app.currencies);
		if (!this.model.currObj)
			throw new Error(`Unexpected currency ${account.curr_id}`);

		this.model.curr_id = this.model.currObj.id;

		this.setExpectedState();
	}


	getExpectedAccount()
	{
		return {
			name : this.model.name,
			balance : this.model.fBalance,
			curr_id : this.model.curr_id,
			icon : this.model.icon
		};
	}


	setExpectedState()
	{
		let account = this.getExpectedAccount();
		let accTile = this.app.state.accountToTile(account);

		if (!this.model.nameTyped && !this.model.isUpdate)
			accTile.name = 'New account';

		let res = {
			visibility : {
				heading : true, tile : true, iconDropDown : true, name : true, currDropDown : true
			},
			values : {
				tile : accTile,
				name : account.name,
				currDropDown : { textValue : this.model.currObj.name },
				iconDropDown : { textValue : this.model.tileIcon.title }
			}
		};

		this.expectedState = res;

		return res;
	}


	async parseContent()
	{
		let res = {};

		res.heading = { elem : await this.query('.heading > h1') };
		if (!res.heading.elem)
			throw new Error('Heading element not found');
		res.heading.text = await this.prop(res.heading.elem, 'innerText');

		res.tile = await this.parseTile(await this.query('#acc_tile'));

		res.formElem = await this.query('form');
		if (!res.formElem)
			throw new Error('Form element not found');

		let hiddenEl = await this.query('#accid');
		res.isUpdate = (!!hiddenEl);

		let curChildren = (res.isUpdate) ? 3 : 2;
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

		res.cancelBtn = await this.query('.acc_controls .cancel_btn');
		if (!res.cancelBtn)
			throw new Error('Cancel button not found');

		return res;
	}


	async inputName(val)
	{
		this.model.name = val;
		this.model.nameTyped = this.nameTyped = true;

		this.setExpectedState();

		return this.performAction(() => this.content.name.input(val));
	}


	async inputBalance(val)
	{
		let fNewValue = this.app.isValidValue(val) ? this.app.normalize(val) : val;

		this.model.balance = val;
		this.model.fBalance = fNewValue;

		this.setExpectedState();

		return this.performAction(() => this.content.balance.input(val));
	}


	async changeCurrency(val)
	{
		let curr_id = parseInt(val);
		this.model.currObj = this.app.getCurrency(curr_id, this.app.currencies);
		if (!this.model.currObj)
			throw new Error(`Unexpected currency ${val}`);

		this.model.curr_id = this.model.currObj.id;

		this.setExpectedState();

		return this.performAction(() => this.content.currDropDown.selectByValue(val));
	}


	async changeIcon(val)
	{
		let iconInd = parseInt(val);
		if (iconInd < 0 || iconInd > this.tileIcons.length)
			throw new Error(`Icon ${val} not found`);

		this.model.icon = iconInd;
		this.model.tileIcon = this.tileIcons[iconInd];

		this.setExpectedState();

		return this.performAction(() => this.content.iconDropDown.selectByValue(val));
	}
}

export { AccountView };
