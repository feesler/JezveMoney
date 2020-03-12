import { TestView } from './testview.js';
import { DEBT, correctExch, isValidValue, normalizeExch } from '../common.js'
import { App } from '../app.js';


// Create or update transaction view class
class TransactionView extends TestView
{
	constructor(...args)
	{
		super(...args);

		this.expectedState = {};
	}


	async parseTileRightItem(elem)
	{
		if (!elem)
			return null;

		let self = this;
		let res = { elem : elem };
		res.titleElem = await this.query(elem, ':scope > *');
		if (!res.titleElem)
			throw new Error('Title element not found');
		res.title = await this.prop(res.titleElem, 'innerText');

		res.buttonElem = await this.query(elem, 'button');
		if (!res.buttonElem)
			throw new Error('Button element not found');
		let buttonInner = await this.query(res.buttonElem, 'span');
		if (!buttonInner)
			throw new Error('Wrong structure of tile info block');
		res.value = await this.prop(buttonInner, 'innerText');

		res.click = async function()
		{
			return self.click(this.buttonElem);
		};

		return res;
	}


	async parseTileBlock(elem)
	{
		if (!elem)
			return null;

		let res = { elem : elem };

		let lbl = await this.query(elem, 'div > label');
		if (!lbl)
			throw new Error('Tile block label not found');
		res.label = await this.prop(lbl, 'innerText');

		res.tile = await this.parseTile(await this.query(elem, '.tile'));
		if (!res.tile)
			throw new Error('Tile not found');

		res.dropDown = await this.parseDropDown(await this.query(elem, '.dd_attached'));

		res.selectAccount = async function(val)
		{
			if (res.dropDown)
				return res.dropDown.selectByValue(val);
		};

		return res;
	}


	async parseCommentRow(elem)
	{
		if (!elem)
			return null;

		let self = this;
		let res = { elem : elem };

		let iconLinkElem = await this.query(elem, '.iconlink');

		res.iconLink = await this.parseIconLink(iconLinkElem);
		if (!res.iconLink)
			throw new Error('Iconlink of comment not found');

		res.inputRow = await this.parseInputRow(await this.query('#comment_block'));
		if (!res.inputRow)
			throw new Error('Input row of comment not found');
		res.value = res.inputRow.value;

		res.input = async function(val)
		{
			if (await self.isVisible(this.iconLink.elem))
				await this.iconLink.click();

			return this.inputRow.input(val);
		};

		return res;
	}


	async parseContent()
	{
		let res = {};

		res.isUpdate = await this.global('edit_mode');

		if (res.isUpdate)
		{
			let hiddenEl = await this.query('input[name="id"]');
			if (!hiddenEl)
				throw new Error('Transaction id field not found');

			res.id = parseInt(await this.prop(hiddenEl, 'value'));
			if (!res.id)
				throw new Error('Wrong transaction id');
		}

		res.heading = { elem : await this.query('.heading > h1') };
		if (res.heading.elem)
			res.heading.title = await this.prop(res.heading.elem, 'innerText');

		res.delBtn = await this.parseIconLink(await this.query('#del_btn'));

		res.typeMenu = await this.parseTransactionTypeMenu(await this.query('#trtype_menu'));

		if (res.typeMenu.activeType == DEBT)
		{
			res.person = await this.parseTileBlock(await this.query('#person'));
			if (res.person)
			{
				let personIdInp = await this.query('#person_id');
				res.person.id = parseInt(await this.prop(personIdInp, 'value'));
			}

			res.account = await this.parseTileBlock(await this.query('#source'));
			if (res.account)
			{
				let accountIdInp = await this.query('#acc_id');
				res.account.id = parseInt(await this.prop(accountIdInp, 'value'));
				res.accTileContainer = { elem : await this.query('#source .tile_container') };
			}

			res.operation = await this.parseOperation(await this.query('#operation'));

			res.selaccount = { elem : await this.query('#selaccount'), btn : await this.query('#selaccount > *') };
			if (!res.selaccount.elem || !res.selaccount.btn)
				throw new Error('Select account button not found');
			res.selaccount.click = () => this.click(res.selaccount.btn);

			res.noacc_btn = { elem : await this.query('#noacc_btn'), btn : await this.query('#noacc_btn > *') };
			if (!res.noacc_btn.elem || !res.noacc_btn.btn)
				throw new Error('Disable account button not found');
			res.noacc_btn.click = () => this.click(res.noacc_btn.btn);
		}
		else
		{
			res.source = await this.parseTileBlock(await this.query('#source'));
			if (res.source)
			{
				let srcIdInp = await this.query('#src_id');
				res.source.id = parseInt(await this.prop(srcIdInp, 'value'));
			}
			res.destination = await this.parseTileBlock(await this.query('#destination'));
			if (res.destination)
			{
				let destIdInp = await this.query('#dest_id');
				res.destination.id = parseInt(await this.prop(destIdInp, 'value'));
			}
		}

		res.src_amount_left = await this.parseTileRightItem(await this.query('#src_amount_left'));
		res.dest_amount_left = await this.parseTileRightItem(await this.query('#dest_amount_left'));
		res.src_res_balance_left = await this.parseTileRightItem(await this.query('#src_res_balance_left'));
		res.dest_res_balance_left = await this.parseTileRightItem(await this.query('#dest_res_balance_left'));
		res.exch_left = await this.parseTileRightItem(await this.query('#exch_left'));

		res.src_amount_row = await this.parseInputRow(await this.query('#src_amount_row'));
		res.dest_amount_row = await this.parseInputRow(await this.query('#dest_amount_row'));
		res.exchange_row = await this.parseInputRow(await this.query('#exchange'));
		res.result_balance_row = await this.parseInputRow(await this.query('#result_balance'));
		res.result_balance_dest_row = await this.parseInputRow(await this.query('#result_balance_dest'));

		let calendarBtn = await this.query('#calendar_btn');
		res.datePicker = await this.parseDatePickerRow(await this.parent(calendarBtn));
		let commentBtn = await this.query('#comm_btn');
		res.comment_row = await this.parseCommentRow(await this.parent(commentBtn));

		res.submitBtn = await this.query('#submitbtn');
		res.cancelBtn = await this.query('#submitbtn + *');

		res.delete_warning = await this.parseWarningPopup(await this.query('#delete_warning'));

		return res;
	}


	getExpectedTransaction()
	{
		let res = {};

		if (this.model.isUpdate)
			res.id = this.model.id;

		res.type = this.model.type;
		res.src_id = (this.model.srcAccount) ? this.model.srcAccount.id : 0;
		res.dest_id = (this.model.destAccount) ? this.model.destAccount.id : 0;
		res.src_amount = this.model.fSrcAmount;
		res.dest_amount = this.model.fDestAmount;
		res.src_curr = this.model.src_curr_id;
		res.dest_curr = this.model.dest_curr_id;
		res.date = this.model.date;
		res.comment = this.model.comment;

		return res;
	}


	// Return null if object can't be found
	async getUpdateTransactionObj()
	{
		return this.global('edit_transaction');
	}


	calcExchByAmounts(model)
	{
		if (model.fSrcAmount == 0 || model.fDestAmount == 0)
			model.exchRate = 1;
		else
			model.exchRate = correctExch(model.fDestAmount / model.fSrcAmount);

		return model
	}


	updateExch(model)
	{
		model.fExchRate = isValidValue(model.exchRate) ? normalizeExch(model.exchRate) : model.exchRate;

		model.exchSign = model.destCurr.sign + '/' + model.srcCurr.sign;
		model.backExchSign = model.srcCurr.sign + '/' + model.destCurr.sign;

		let exchText = model.exchSign;

		if (isValidValue(model.exchRate) && model.fExchRate != 0 && model.fExchRate != 1)
		{
			let backExchRate = 1;
			if (model.fSrcAmount != 0 && model.fDestAmount != 0)
				backExchRate = model.fSrcAmount / model.fDestAmount;

			model.invExchRate = parseFloat(backExchRate.toFixed(5));

			exchText += ' ('  + model.invExchRate + ' ' + model.backExchSign + ')';
		}

		model.fmtExch = model.fExchRate + ' ' + exchText;

		return model;
	}


	async changeTransactionType(type)
	{
		if (this.content.typeMenu.activeType == type || !this.content.typeMenu.items[type])
			return;

		return this.navigation(() => this.content.typeMenu.items[type].click());
	}


	async clickDeleteButton()
	{
		if (!this.content.isUpdate || !this.content.delBtn)
			throw new Error('Unexpected action clickDeleteButton');

		return this.performAction(() => this.content.delBtn.click());
	}


	// Click on delete button and confirm wanring popup
	async deleteSelfItem()
	{
		await this.clickDeleteButton();

		if (!await this.isVisible(this.content.delete_warning.elem))
			throw 'Delete transaction warning popup not appear';
		if (!this.content.delete_warning.okBtn)
			throw 'OK button not found';

		await this.navigation(() => this.click(this.content.delete_warning.okBtn));
	}


	async submit()
	{
		return this.navigation(() => this.click(this.content.submitBtn));
	}


	async changeSrcAccount(val)
	{
		return this.performAction(() => this.content.source.selectAccount(val));
	}


	async changeSrcAccountByPos(pos)
	{
		return this.changeSrcAccount(this.content.source.dropDown.items[pos].id);
	}


	async changeDestAccount(val)
	{
		return this.performAction(() => this.content.destination.selectAccount(val));
	}


	async changeDestAccountByPos(pos)
	{
		return this.changeDestAccount(this.content.destination.dropDown.items[pos].id);
	}


	async inputSrcAmount(val)
	{
		return this.performAction(() => this.content.src_amount_row.input(val));
	}


	async clickSrcAmount()
	{
		return this.performAction(() => this.content.src_amount_left.click());
	}


	async inputDestAmount(val)
	{
		return this.performAction(() => this.content.dest_amount_row.input(val));
	}


	async clickSrcResultBalance()
	{
		return this.performAction(() => this.content.src_res_balance_left.click());
	}


	async clickDestResultBalance()
	{
		return this.performAction(() => this.content.dest_res_balance_left.click());
	}


	async clickDestAmount()
	{
		return this.performAction(() => this.content.dest_amount_left.click());
	}


	async inputResBalance(val)
	{
		return this.performAction(() => this.content.result_balance_row.input(val))
	}


	async inputDestResBalance(val)
	{
		return this.performAction(() => this.content.result_balance_dest_row.input(val))
	}


	async changeSourceCurrency(val)
	{
		return this.performAction(() => this.content.src_amount_row.selectCurr(val));
	}


	async changeDestCurrency(val)
	{
		return this.performAction(() => this.content.dest_amount_row.selectCurr(val));
	}


	async clickExchRate()
	{
		return this.performAction(() => this.content.exch_left.click());
	}


	async inputExchRate(val)
	{
		return this.performAction(() => this.content.exchange_row.input(val));
	}


	async changeDate(val)
	{
		return this.performAction(() => this.content.datePicker.input(val));
	}


	async inputComment(val)
	{
		return this.performAction(() => this.content.comment_row.input(val));
	}
}


export { TransactionView };
