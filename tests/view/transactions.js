import { TestView } from './testview.js';
import { App } from '../app.js';
import { DropDown } from './component/dropdown.js';
import { IconLink } from './component/iconlink.js';
import { WarningPopup } from './component/warningpopup.js';
import { TransactionTypeMenu } from './component/transactiontypemenu.js';
import { DatePickerFilter } from './component/datepickerfilter.js';
import { Paginator } from './component/paginator.js';
import { ModeSelector } from './component/modeselector.js';
import { SearchForm } from './component/searchform.js';
import { TransactionList } from './component/transactionlist.js';
import { copyObject, fixDate } from '../common.js';


// List of transactions view class
export class TransactionsView extends TestView
{
	async parseContent()
	{
		let res = {
			titleEl : await this.query('.content_wrap > .heading > h1'),
			addBtn : await IconLink.create(this, await this.query('#add_btn')),
			toolbar : {
				elem : await this.query('#toolbar'),
				editBtn : await IconLink.create(this, await this.query('#edit_btn')),
				exportBtn : await IconLink.create(this, await this.query('#export_btn')),
				delBtn : await IconLink.create(this, await this.query('#del_btn'))
			}
		};

		if (!res.titleEl || !res.addBtn || !res.toolbar.elem || !res.toolbar.editBtn || !res.toolbar.delBtn)
			throw new Error('Wrong transactions view structure');

		res.typeMenu = await TransactionTypeMenu.create(this, await this.query('#trtype_menu'));
		if (!res.typeMenu)
			throw new Error('Search form not found');

		res.accDropDown = await DropDown.create(this, await this.query('.tr_filter .dd_container'));
		if (!res.accDropDown)
			throw new Error('Account filter control not found');

		let calendarBtn = await this.query('#calendar_btn');
		res.dateFilter = await DatePickerFilter.create(this, await this.parent(calendarBtn));
		if (!res.dateFilter)
			throw new Error('Date filter not found');

		res.searchForm = await SearchForm.create(this, await this.query('#searchFrm'));
		if (!res.searchForm)
			throw new Error('Search form not found');

		res.modeSelector = await ModeSelector.create(this, await this.query('.trans_list .mode_selector'));
		res.paginator = await Paginator.create(this, await this.query('.trans_list .paginator'));

		res.title = await this.prop(res.titleEl, 'innerText');
		res.transList = await TransactionList.create(this, await this.query('#tritems'));
		if (!res.transList)
			throw new Error('List of transactions not found');

		if (res.transList.items && res.transList.items.length && !res.modeSelector)
			throw new Error('Mode selector not found');
		if (res.transList.items && res.transList.items.length && !res.paginator)
			throw new Error('Paginator not found');

		res.delete_warning = await WarningPopup.create(this, await this.query('#delete_warning'));

		return res;
	}


	async buildModel(cont)
	{
		let res = {};

		res.data = App.state.transactions.clone();

		res.filter = {
			type : parseInt(cont.typeMenu.activeType),
			accounts : cont.accDropDown.getSelectedValues(),
			search : cont.searchForm.value,
		};
		let dateRange = cont.dateFilter.getSelectedRange();
		if (dateRange && dateRange.startDate && dateRange.endDate)
		{
			res.filter.startDate = dateRange.startDate;
			res.filter.endDate = dateRange.endDate;
		}

		res.filtered = res.data.filter(res.filter);
		res.list = {
			page : cont.paginator.active,
			pages : cont.paginator.getPages(),
			items : cont.transList.getItems()
		};

		res.detailsMode = cont.modeSelector.details;
		res.deleteConfirmPopup = cont.delete_warning && await this.isVisible(cont.delete_warning.elem);

		return res;
	}


	cloneModel(model)
	{
		let res = copyObject(model);

		res.data = model.data.clone();
		res.filtered = model.filtered.clone();

		return res;
	}


	updateModelFilter(model)
	{
		let res = this.cloneModel(model);

		res.filtered = res.data.filter(res.filter);

		let pageItems = res.filtered.getPage(1);
		res.list = {
			page : 1,
			pages : res.filtered.expectedPages(),
			items : TransactionList.render(pageItems.data, App.state)
		};

		return res;
	}


	onFilterUpdate()
	{
		this.model = this.updateModelFilter(this.model);
		return this.setExpectedState();
	}


	setModelPage(model, page)
	{
		if (page < 1 || page > model.list.pages)
			throw new Error(`Invalid page number ${page}`);

		let res = this.cloneModel(model);

		res.filtered = res.data.filter(res.filter);
		res.list.page = page;
		let pageItems = res.filtered.getPage(page);
		res.list.items = TransactionList.render(pageItems.data, App.state);

		return res;
	}


	onPageChanged(page)
	{
		this.model = this.setModelPage(this.model, page);
		return this.setExpectedState();
	}


	setExpectedState()
	{
		let res = {
			visibility : {
				typeMenu : true, accDropDown : true, searchForm : true,
				modeSelector : true, paginator : true, transList : true
			},
			values : {
				typeMenu : { activeType : this.model.filter.type },
				searchForm : { value : this.model.filter.search },
				paginator : {
					pages : this.model.list.pages,
					active : this.model.list.page
				},
				modeSelector : { details : this.model.detailsMode }
			}
		};

		return res;
	}


	async filterByAccounts(accounts)
	{
		this.model.filter.accounts = accounts;
		let expected = this.onFilterUpdate();

		await this.navigation(() => this.content.accDropDown.select(accounts));

		return App.view.checkState(expected);
	}


	async selectDateRange(start, end)
	{
		this.model.filter.startDate = start;
		this.model.filter.endDate = end;
		let expected = this.onFilterUpdate();

		let startDate = new Date(fixDate(start));
		let endDate = new Date(fixDate(end));

		await this.navigation(() => this.content.dateFilter.selectRange(startDate, endDate));

		return App.view.checkState(expected);
	}


	async search(text)
	{
		this.model.filter.search = text;
		let expected = this.onFilterUpdate();

		await this.navigation(() => this.content.searchForm.search(text));

		return App.view.checkState(expected);
	}


	async setClassicMode()
	{
		if (this.content.modeSelector.listMode.isActive)
			return false;

		this.model.detailsMode = false;
		let expected = this.setExpectedState();

		await this.navigation(() => this.content.modeSelector.setClassicMode());

		return App.view.checkState(expected);
	}


	async setDetailsMode()
	{
		if (this.content.modeSelector.detailsMode.isActive)
			return false;

		this.model.detailsMode = true;
		let expected = this.setExpectedState();

		await this.navigation(() => this.content.modeSelector.setDetailsMode());

		return App.view.checkState(expected);
	}


	currentPage()
	{
		return this.content.paginator ? this.content.paginator.active : 1;
	}


	pagesCount()
	{
		if (this.content.paginator && this.content.paginator.items && this.content.paginator.items.length)
			return this.content.paginator.items.length;
		else
			return 1;
	}


	isFirstPage()
	{
		return !this.content.paginator || this.content.paginator.isFirstPage();
	}


	isLastPage()
	{
		return !this.content.paginator || this.content.paginator.isLastPage();
	}


	async goToFirstPage()
	{
		if (this.isFirstPage())
			return this;

		let expected = this.onPageChanged(1);

		await this.navigation(() => this.content.paginator.goToFirstPage());

		return App.view.checkState(expected);
	}


	async goToLastPage()
	{
		if (this.isLastPage())
			return;

		let expected = this.onPageChanged(this.pagesCount());

		await this.navigation(() => this.content.paginator.goToLastPage());

		return App.view.checkState(expected);
	}


	async goToPrevPage()
	{
		if (this.isFirstPage())
			throw new Error('Can\'t go to previous page');

		let expected = this.onPageChanged(this.currentPage() - 1);

		await this.navigation(() => this.content.paginator.goToPrevPage());

		return App.view.checkState(expected);
	}


	async goToNextPage()
	{
		if (this.isLastPage())
			throw new Error('Can\'t go to next page');

		let expected = this.onPageChanged(this.currentPage() + 1);

		await this.navigation(() => this.content.paginator.goToNextPage());

		return App.view.checkState(expected);
	}


	async iteratePages()
	{
		let res = { items : [], pages : [] };

		if (!(App.view instanceof TransactionsView) || !App.view.content.transList)
			throw new Error('Not expected view');

		if (!App.view.isFirstPage())
			await App.view.goToFirstPage();

		let pos = App.view.pagesCount() * App.config.transactionsOnPage;
		while(App.view.content.transList.items.length)
		{
			let pageItems = App.view.content.transList.items.map(item => {
				return {
					id : item.id,
					accountTitle : item.accountTitle,
					amountText : item.amountText,
					dateFmt : item.dateFmt,
					comment : item.comment,
					pos : pos--
				}
			});

			res.pages.push(pageItems);
			res.items.push(...pageItems);

			if (App.view.isLastPage())
				break;

			await App.view.goToNextPage();
		}

		return res;
	}


	async filterByType(type)
	{
		if (this.content.typeMenu.activeType == type || !this.content.typeMenu.items[type])
			return;

		this.model.filter.type = type;
		let expected = this.onFilterUpdate();

		await this.navigation(() => this.content.typeMenu.select(type));

		return App.view.checkState(expected);
	}


	// Click on add button and return navigation promise
	async goToCreateTransaction()
	{
		await this.navigation(() => this.content.addBtn.click());
	}


	async selectTransactions(tr)
	{
		if (typeof tr === 'undefined')
			throw new Error('No transactions specified');

		if (!Array.isArray(tr))
			tr = [tr];

		let ind = 0;
		for(let tr_num of tr)
		{
			if (tr_num < 0 || tr_num >= this.content.transList.items.length)
				throw 'Wrong transaction number';

			await this.performAction(() => this.content.transList.items[tr_num].click());

			let editIsVisible = await this.isVisible(this.content.toolbar.editBtn.elem);
			if (ind == 0 && !editIsVisible)
				throw 'Edit button is not visible';
			else if (ind > 0 && editIsVisible)
				throw 'Edit button is visible while more than one transactions is selected';

			if (!await this.isVisible(this.content.toolbar.delBtn.elem))
				throw 'Delete button is not visible';

			ind++;
		}
	}


	// Select specified transaction, click on edit button and return navigation promise
	async goToUpdateTransaction(num)
	{
		let pos = parseInt(num);
		if (isNaN(pos))
			throw new Error('Invalid position of transaction');

		await this.selectTransactions(num);

		return this.navigation(() => this.content.toolbar.editBtn.click());
	}


	// Delete specified transactions and return navigation promise
	async deleteTransactions(tr)
	{
		if (!tr)
			throw new Error('No transactions specified');

		if (!Array.isArray(tr))
			tr = [tr];

		await this.selectTransactions(tr);

		await this.performAction(() => this.content.toolbar.delBtn.click());

		if (!await this.isVisible(this.content.delete_warning.elem))
			throw 'Delete transaction warning popup not appear';
		if (!this.content.delete_warning.okBtn)
			throw 'OK button not found';

		await this.navigation(() => this.click(this.content.delete_warning.okBtn));
	}
}
