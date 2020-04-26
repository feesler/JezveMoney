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


	async filterByAccounts(accounts)
	{
		if (!Array.isArray(accounts))
			accounts = [ accounts ];

		return this.navigation(async () =>
		{
			for(let acc_id of accounts)
			{
				await this.content.accDropDown.selectByValue(acc_id);
			}
			return this.click(this.content.accDropDown.selectBtn);
		});
	}


	async selectDateRange(start, end)
	{
		return this.navigation(() => this.content.dateFilter.selectRange(start, end));
	}


	async search(text)
	{
		return this.navigation(async () =>
		{
			await this.content.searchForm.input(text);
			return this.content.searchForm.submit();
		});
	}


	async setClassicMode()
	{
		if (this.content.modeSelector.listMode.isActive)
			return;

		return this.navigation(() => this.content.modeSelector.listMode.elem.click());
	}


	async setDetailsMode()
	{
		if (this.content.modeSelector.detailsMode.isActive)
			return;

		return this.navigation(() => this.content.modeSelector.detailsMode.elem.click());
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


	async goToFirstPage(type)
	{
		if (this.isFirstPage())
			return this;

		return this.navigation(() => this.content.paginator.goToFirstPage());
	}


	async goToLastPage(type)
	{
		if (this.isLastPage())
			return this;

		return this.navigation(() => this.content.paginator.goToLastPage());
	}


	async goToPrevPage(type)
	{
		if (this.isFirstPage())
			throw new Error('Can\'t go to previous page');

		return this.navigation(() => this.content.paginator.goToPrevPage());
	}


	async goToNextPage(type)
	{
		if (this.isLastPage())
			throw new Error('Can\'t go to next page');

		return this.navigation(() => this.content.paginator.goToNextPage());
	}


	async filterByType(type)
	{
		if (this.content.typeMenu.activeType == type || !this.content.typeMenu.items[type])
			return;

		return this.navigation(() => this.content.typeMenu.items[type].click());
	}


	// Click on add button and return navigation promise
	goToCreateTransaction()
	{
		return this.navigation(() => this.content.addBtn.click());
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
		await this.selectTransactions(num);

		return this.navigation(() => this.content.toolbar.editBtn.click());
	}


	// Delete specified transactions and return navigation promise
	async deleteTransactions(tr)
	{
		const onPage = App.config.transactionsOnPage;

		if (!tr)
			throw new Error('No transactions specified');

		if (!Array.isArray(tr))
			tr = [tr];

		let currentType = App.view.content.typeMenu.activeType;

		await this.goToFirstPage();

		let trOnCurrentPage;
		let absTrOnCurrentPage;

		while(true)
		{
			let pageNum = App.view.currentPage();


			absTrOnCurrentPage = tr.filter(tr_num => {
				return tr_num >= onPage * (pageNum - 1) &&
						tr_num < onPage * pageNum;
			});

			trOnCurrentPage = absTrOnCurrentPage.map(tr_num => tr_num - (pageNum - 1) * onPage);

			if (trOnCurrentPage.length)
			{
				await App.view.selectTransactions(trOnCurrentPage);

				await App.view.performAction(() => App.view.content.toolbar.delBtn.click());

				if (!await App.view.isVisible(App.view.content.delete_warning.elem))
					throw 'Delete transaction warning popup not appear';
				if (!App.view.content.delete_warning.okBtn)
					throw 'OK button not found';

				await App.view.navigation(() => App.view.click(App.view.content.delete_warning.okBtn));

				// After delete transactions navigation occurs to page without filters, so we need to restore it
				await App.view.filterByType(currentType);

				// Exclude previously removed transactions
				tr = tr.filter(tr_num => !absTrOnCurrentPage.includes(tr_num))
				if (!tr.length)
					break;

				// Shift positions
				tr = tr.map(tr_num => tr_num - trOnCurrentPage.length);
			}
			else
			{
				if (App.view.isLastPage())
				{
					if (tr.length)
						throw new Error(`Transaction(s) ${tr.join()} can not be removed`);
					else
						break;
				}
				else
				{
					await App.view.goToNextPage();
				}
			}
		}
	}

}
