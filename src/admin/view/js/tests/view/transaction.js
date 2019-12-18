if (typeof module !== 'undefined' && module.exports)
{
	const common = require('../common.js');
	var extend = common.extend;
	var isArray = common.isArray;
	var idSearch = common.idSearch;
	var normalize = common.normalize;
	var normalizeExch = common.normalizeExch;
	var correct = common.correct;
	var correctExch = common.correctExch;
	var isValidValue = common.isValidValue;
	var getPosById = common.getPosById;

	var TestView = require('./testview.js');
}


// Create or update transaction view class
class TransactionView extends TestView
{
	async parseTileRightItem(elem)
	{
		if (!elem)
			return null;

		var self = this;
		var res = { elem : elem };
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

		var res = { elem : elem };

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

		var self = this;
		var res = { elem : elem };

		var iconLinkElem = await this.query(elem, '.iconlink');

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
		var res = {};

		res.isUpdate = await this.global('edit_mode');

		if (res.isUpdate)
		{
			let hiddenEl = await this.query('input[name="transid"]');
			if (!hiddenEl)
				throw new Error('Transaction id field not found');

			res.id = parseInt(await this.prop(hiddenEl, 'value'));
			if (!res.id)
				throw new Error('Wrong transaction id');
		}

		res.heading = { elem : await this.query('.heading > h1') };
		if (res.heading.elem)
			res.heading.title = await this.prop(res.heading.elem, 'innerText');

		res.delBtn = await this.query('#del_btn');

		res.typeMenu = await this.parseTransactionTypeMenu(await this.query('#trtype_menu'));

		if (res.typeMenu.activeType == 4)	/* DEBT */
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

		return res;
	}


	// Return null if no account can't be found
	async getAccount(acc_id)
	{
		return idSearch(await this.global('accounts'), acc_id);
	}


	// Return zero if no account can't be found
	async getAccountByPos(pos)
	{
		let accounts = await this.global('accounts');
		if (pos >= 0 && pos < accounts.length)
			return accounts[pos];
		else
			return null;
	}


	// Return current position of account in accounts array
	// Return -1 in case account can't be found
	async getAccountPos(acc_id)
	{
		return getPosById(await this.global('accounts'), acc_id);
	}


	// Return another account id if possible
	// Return zero if no account found
	async getNextAccount(acc_id)
	{
		let data = await this.global('accounts');
		var pos;

		if (!isArray(data) || data.length < 2 || !acc_id)
			return -1;

		pos = await this.getAccountPos(acc_id);
		if (pos == -1)
			return 0;

		pos = ((pos == data.length - 1) ? 0 : pos + 1);

		return data[pos].id;
	}


	// Return zero if no person found
	async getPerson(person_id)
	{
		return idSearch(await this.global('persons'), person_id);
	}


	// Return zero if no person found
	async getPersonByPos(pos)
	{
		let persons = await this.global('persons');

		if (pos >= 0 && pos < persons.length)
			return persons[pos];
		else
			return null;
	}


	// Return zero if no person found
	async getPersonPos(person_id)
	{
		return getPosById(await this.global('persons'), person_id);
	}


	// Return account of person in specified currency
	getPersonAccount(person, curr_id)
	{
		var resAcc = null;

		if (!person || !person.accounts || !curr_id)
			return resAcc;

		// check person have account in specified currency
		person.accounts.some(function(acc)
		{
			var cond = (acc.curr_id == curr_id);

			if (cond)
				resAcc = acc;

			return cond;
		});

		return resAcc;
	}


	// Return null if no account can't be found
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

		var exchText = model.exchSign;

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


if (typeof module !== 'undefined' && module.exports)
	module.exports = TransactionView;
