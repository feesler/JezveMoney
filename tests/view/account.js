import { TestView } from './testview.js';
import { Currency } from '../currency.js';
import {
	getIcon,
	isValidValue,
	normalize,
	setParam,
	findIconByTitle,
	copyObject
} from '../common.js'
import { App } from '../app.js'


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
		res.initbalance = cont.balance.value;
		res.fInitBalance = isValidValue(res.initbalance) ? normalize(res.initbalance) : res.initbalance;

		let origBalance = (res.isUpdate && this.origAccount) ? this.origAccount.balance : 0;
		let origInitBalance = (res.isUpdate && this.origAccount) ? this.origAccount.initbalance : 0;

		res.balance = origBalance + res.fInitBalance - origInitBalance;
		res.fBalance = res.balance;

		// Currency
		let selectedCurr = cont.currDropDown.textValue;
		res.currObj = Currency.findByName(selectedCurr);
		if (!res.currObj)
			throw new Error(`Currency ${selectedCurr} not found`);

		res.curr_id = res.currObj.id

		// Icon
		let iconObj = findIconByTitle(cont.iconDropDown.textValue);
		res.icon = iconObj.id;
		res.tileIcon = iconObj;

		return res;
	}


	setExpectedAccount(account)
	{
		this.origAccount = copyObject(account);

		this.model.name = account.name.toString();

		this.model.initbalance = account.initbalance.toString();
		this.model.fInitBalance = normalize(account.initbalance);

		this.model.balance = account.balance.toString();
		this.model.fBalance = account.balance;

		this.model.currObj = Currency.getById(account.curr_id);
		if (!this.model.currObj)
			throw new Error(`Unexpected currency ${account.curr_id}`);

		this.model.curr_id = this.model.currObj.id;

		this.setExpectedState();
	}


	getExpectedAccount()
	{
		let res = {
			name : this.model.name,
			owner_id : App.owner_id,
			initbalance : this.model.initbalance,
			curr_id : this.model.curr_id,
			icon : this.model.icon
		};

		if (this.model.isUpdate)
			res.id = this.model.id;

		let origBalance = (this.model.isUpdate && this.origAccount) ? this.origAccount.balance : 0;
		let origInitBalance = (this.model.isUpdate && this.origAccount) ? this.origAccount.initbalance : 0;

		res.balance = origBalance + normalize(res.initbalance) - origInitBalance;

		return res;
	}


	setExpectedState()
	{
		let account = this.getExpectedAccount();
		let accTile = App.state.accountToTile(account);

		if (!this.model.nameTyped && !this.model.isUpdate)
			accTile.name = 'New account';

		let res = {
			visibility : {
				heading : true, tile : true, iconDropDown : true, name : true, currDropDown : true
			},
			values : {
				tile : accTile,
				name : account.name,
				balance : account.initbalance.toString(),
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

		res.delBtn = await this.parseIconLink(await this.query('#del_btn'));

		res.tile = await this.parseTile(await this.query('#acc_tile'));

		res.formElem = await this.query('form');
		if (!res.formElem)
			throw new Error('Form element not found');

		let hiddenEl = await this.query('#accid');
		res.isUpdate = (!!hiddenEl);
		if (res.isUpdate)
		{
			res.id = parseInt(await this.prop(hiddenEl, 'value'));
			if (!res.id)
				throw new Error('Wrong account id');
		}

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

		res.delete_warning = await this.parseWarningPopup(await this.query('#delete_warning'));

		return res;
	}


	async clickDeleteButton()
	{
		if (!this.content.isUpdate || !this.content.delBtn)
			throw new Error('Unexpected action clickDeleteButton');

		return this.performAction(() => this.content.delBtn.click());
	}


	// Click on delete button and confir wanring popup
	async deleteSelfItem()
	{
		await this.clickDeleteButton();

		if (!await this.isVisible(this.content.delete_warning.elem))
			throw 'Delete transaction warning popup not appear';
		if (!this.content.delete_warning.okBtn)
			throw 'OK button not found';

		await this.navigation(() => this.click(this.content.delete_warning.okBtn));
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
		let fNewValue = isValidValue(val) ? normalize(val) : val;

		this.model.initbalance = val;
		this.model.fInitBalance = fNewValue;

		this.setExpectedState();

		return this.performAction(() => this.content.balance.input(val));
	}


	async changeCurrency(val)
	{
		let curr_id = parseInt(val);
		this.model.currObj = Currency.getById(curr_id);
		if (!this.model.currObj)
			throw new Error(`Unexpected currency ${val}`);

		this.model.curr_id = this.model.currObj.id;

		this.setExpectedState();

		return this.performAction(() => this.content.currDropDown.selectByValue(val));
	}


	async changeIcon(val)
	{
		let iconObj = getIcon(val);
		if (!iconObj)
			throw new Error(`Icon ${val} not found`);

		this.model.icon = iconObj.id;
		this.model.tileIcon = iconObj;

		this.setExpectedState();

		return this.performAction(() => this.content.iconDropDown.selectByValue(val));
	}
}

export { AccountView };
