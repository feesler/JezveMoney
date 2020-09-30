import { TestView } from './testview.js';
import { convDate, correctExch, isValidValue, normalizeExch } from '../common.js'
import { DEBT } from '../model/transaction.js';
import { TransactionTypeMenu } from './component/transactiontypemenu.js';
import { InputRow } from './component/inputrow.js';
import { IconLink } from './component/iconlink.js';
import { WarningPopup } from './component/warningpopup.js';
import { DatePickerRow } from './component/daterow.js';
import { CommentRow } from './component/commentrow.js';
import { TileInfoItem } from './component/tileinfoitem.js';
import { TileBlock } from './component/tileblock.js';


// Create or update transaction view class
export class TransactionView extends TestView
{
	constructor(...args)
	{
		super(...args);

		this.expectedState = {};
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
			res.heading.title = await this.prop(res.heading.elem, 'textContent');

		res.delBtn = await IconLink.create(this, await this.query('#del_btn'));

		res.typeMenu = await TransactionTypeMenu.create(this, await this.query('.trtype-menu'));
		if (res.typeMenu.multi)
			throw new Error('Invalid transaction type menu');

		if (res.typeMenu.isSingleSelected(DEBT))
		{
			res.person = await TileBlock.create(this, await this.query('#person'));
			if (res.person)
			{
				let personIdInp = await this.query('#person_id');
				res.person.id = parseInt(await this.prop(personIdInp, 'value'));
			}

			res.account = await TileBlock.create(this, await this.query('#source'));
			if (res.account)
			{
				let accountIdInp = await this.query('#acc_id');
				res.account.id = parseInt(await this.prop(accountIdInp, 'value'));
				res.accTileContainer = { elem : await this.query('#source .tile_container') };
			}

			res.operation = await this.parseOperation(await this.query('#operation'));

			res.selaccount = {
				elem : await this.query('#selaccount'),
				btn : await this.query('#selaccount > *')
			};
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
			res.source = await TileBlock.create(this, await this.query('#source'));
			if (res.source)
			{
				let srcIdInp = await this.query('#src_id');
				res.source.id = parseInt(await this.prop(srcIdInp, 'value'));
			}
			res.destination = await TileBlock.create(this, await this.query('#destination'));
			if (res.destination)
			{
				let destIdInp = await this.query('#dest_id');
				res.destination.id = parseInt(await this.prop(destIdInp, 'value'));
			}
		}

		res.src_amount_left = await TileInfoItem.create(this, await this.query('#src_amount_left'));
		res.dest_amount_left = await TileInfoItem.create(this, await this.query('#dest_amount_left'));
		res.src_res_balance_left = await TileInfoItem.create(this, await this.query('#src_res_balance_left'));
		res.dest_res_balance_left = await TileInfoItem.create(this, await this.query('#dest_res_balance_left'));
		res.exch_left = await TileInfoItem.create(this, await this.query('#exch_left'));

		res.src_amount_row = await InputRow.create(this, await this.query('#src_amount_row'));
		res.dest_amount_row = await InputRow.create(this, await this.query('#dest_amount_row'));
		res.exchange_row = await InputRow.create(this, await this.query('#exchange'));
		res.result_balance_row = await InputRow.create(this, await this.query('#result_balance'));
		res.result_balance_dest_row = await InputRow.create(this, await this.query('#result_balance_dest'));

		let calendarBtn = await this.query('#calendar_btn');
		res.datePicker = await DatePickerRow.create(this, await this.parentNode(calendarBtn));
		let commentBtn = await this.query('#comm_btn');
		res.comment_row = await CommentRow.create(this, await this.parentNode(commentBtn));

		res.submitBtn = await this.query('#submitbtn');
		res.cancelBtn = await this.query('#submitbtn + *');

		res.delete_warning = await WarningPopup.create(this, await this.query('#delete_warning'));

		return res;
	}


	async isValid()
	{
		if (this.content.src_amount_row && await this.isVisible(this.content.src_amount_row.elem))
		{
			if (!this.model.srcAmount.length || !isValidValue(this.model.srcAmount))
				return false;
		}

		if (this.content.dest_amount_row && await this.isVisible(this.content.dest_amount_row.elem))
		{
			if (!this.model.destAmount.length || !isValidValue(this.model.destAmount))
				return false;
		}

		let timestamp = convDate(this.model.date);
		if (!timestamp || timestamp < 0)
			return false;

		return true;
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
		if (this.content.typeMenu.isSingleSelected(type))
			return;

		return this.navigation(() => this.content.typeMenu.select(type));
	}


	async clickDeleteButton()
	{
		if (!this.content.isUpdate || !this.content.delBtn)
			throw new Error('Unexpected action clickDeleteButton');

		await this.performAction(() => this.content.delBtn.click());
	}


	// Click on delete button and confirm wanring popup
	async deleteSelfItem()
	{
		await this.clickDeleteButton();

		if (!this.content.delete_warning || !await this.isVisible(this.content.delete_warning.elem))
			throw new Error('Delete transaction warning popup not appear');
		if (!this.content.delete_warning.okBtn)
			throw new Error('OK button not found');

		await this.navigation(() => this.click(this.content.delete_warning.okBtn));
	}


	async submit()
	{
		let action = () => this.click(this.content.submitBtn);

		if (await this.isValid())
			await this.navigation(action);
		else
			await this.performAction(action);
	}


	async cancel()
	{
		await this.navigation(() => this.click(this.content.cancelBtn));
	}


	async changeSrcAccount(val)
	{
		await this.performAction(() => this.content.source.selectAccount(val));

		return this.checkState();
	}


	async changeSrcAccountByPos(pos)
	{
		await this.changeSrcAccount(this.content.source.dropDown.items[pos].id);

		return this.checkState();
	}


	async changeDestAccount(val)
	{
		await this.performAction(() => this.content.destination.selectAccount(val));

		return this.checkState();
	}


	async changeDestAccountByPos(pos)
	{
		await this.changeDestAccount(this.content.destination.dropDown.items[pos].id);

		return this.checkState();
	}


	async inputSrcAmount(val)
	{
		await this.performAction(() => this.content.src_amount_row.input(val));

		return this.checkState();
	}


	async clickSrcAmount()
	{
		await this.performAction(() => this.content.src_amount_left.click());

		return this.checkState();
	}


	async inputDestAmount(val)
	{
		await this.performAction(() => this.content.dest_amount_row.input(val));

		return this.checkState();
	}


	async clickSrcResultBalance()
	{
		await this.performAction(() => this.content.src_res_balance_left.click());

		return this.checkState();
	}


	async clickDestResultBalance()
	{
		await this.performAction(() => this.content.dest_res_balance_left.click());

		return this.checkState();
	}


	async clickDestAmount()
	{
		await this.performAction(() => this.content.dest_amount_left.click());

		return this.checkState();
	}


	async inputResBalance(val)
	{
		await this.performAction(() => this.content.result_balance_row.input(val))

		return this.checkState();
	}


	async inputDestResBalance(val)
	{
		await this.performAction(() => this.content.result_balance_dest_row.input(val))

		return this.checkState();
	}


	async changeSourceCurrency(val)
	{
		await this.performAction(() => this.content.src_amount_row.selectCurr(val));

		return this.checkState();
	}


	async changeDestCurrency(val)
	{
		await this.performAction(() => this.content.dest_amount_row.selectCurr(val));

		return this.checkState();
	}


	async clickExchRate()
	{
		await this.performAction(() => this.content.exch_left.click());

		return this.checkState();
	}


	async inputExchRate(val)
	{
		await this.performAction(() => this.content.exchange_row.input(val));

		return this.checkState();
	}


	async changeDate(val)
	{
		await this.performAction(() => this.content.datePicker.input(val));

		return this.checkState();
	}


	async inputComment(val)
	{
		await this.performAction(() => this.content.comment_row.input(val));

		return this.checkState();
	}
}
