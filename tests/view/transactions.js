import { TestView } from './testview.js';


// List of transactions view class
class TransactionsView extends TestView
{
	async parseSearchForm(elem)
	{
		if (!elem)
			return null;

		let self = this;
		let res = { elem : elem,
					inputElem : await this.query(elem, '#search'),
					submitBtn : await this.query(elem, 'button.search_btn'), };
		if (!res.inputElem || !res.submitBtn)
			throw new Error('unexpected structure of search form');

		res.value = await this.prop(res.inputElem, 'value');
		res.input = async function(val)
		{
			return self.input(this.inputElem, val);
		};

		res.submit = async function()
		{
			return self.click(this.submitBtn);
		};

		return res;
	}


	async parseModeSelector(elem)
	{
		if (!elem)
			return null;

		let res = { elem : elem };

		if (!await this.hasClass(res.elem, 'mode_selector'))
			throw new Error('Unexpected stucture of mode selector control');

		res.listMode = { elem : await this.query(res.elem, '.list_mode') };
		res.detailsMode = { elem : await this.query(res.elem, '.details_mode') };
		if (!res.listMode.elem || !res.detailsMode.elem)
			throw new Error('Unexpected stucture of mode selector control');

		res.listMode.isActive = (await this.prop(res.listMode.elem, 'tagName') == 'B');
		res.detailsMode.isActive = (await this.prop(res.detailsMode.elem, 'tagName') == 'B');
		if ((res.listMode.isActive && res.detailsMode.isActive) ||
			(!res.listMode.isActive && !res.detailsMode.isActive))
			throw new Error('Wrong mode selector state');

		res.details = res.detailsMode.isActive;

		return res;
	}


	async parsePaginator(elem)
	{
		if (!elem)
			return null;

		let self = this;
		let res = { elem : elem, items : [], activeItem : null };

		if (!await this.hasClass(res.elem, 'paginator'))
			throw new Error('Unexpected stucture of paginator control');

		let ellipsisBefore = false;
		let prevPageItem = null;
		let elems = await this.queryAll(res.elem, ':scope > span');

		if (elems.length == 1)
			throw new Error('Single item paginator control');

		for(let itemElem of elems)
		{
			let child = await this.query(itemElem, ':scope > *');

			// Check element with no child contain ellipsis and skip
			if (!child)
			{
				if (await this.prop(itemElem, 'innerText') != '...')
					throw new Error('Unexpected paginator item');

				// Check ellipsis is between two page number items:
				//  - ellipsis can't be first item
				//  - ellipsis can't follow after ellipsis
				if (!res.items.length || ellipsisBefore || !prevPageItem)
					throw new Error('Unexpected placement of paginator ellipsis');

				ellipsisBefore = true;
				continue;
			}

			let item = { elem : itemElem };

			let tagName = await this.prop(child, 'tagName');
			if (tagName == 'A')
			{
				item.linkElem = child;
				item.link = await this.prop(child, 'href');
				item.isActive = false;
			}
			else if (tagName == 'B')
			{
				item.isActive = true;
			}
			else
				throw new Error('Unexpected stucture of paginator control');

			item.title = await this.prop(child, 'innerText');
			item.num = parseInt(item.title);
			if (!item.title || isNaN(item.num) || item.num < 1)
				throw new Error('Unexpected title of paginator item');

			// Check correctnes of order
			if ((!res.items.length && item.num != 1) ||											// First item must always be 1
				(res.items.length && (!prevPageItem || item.num <= prevPageItem.num)) ||		// Following items must be greater than previous
				(res.items.length && !ellipsisBefore && item.num != prevPageItem.num + 1))		// Sequential items must increase only by 1
				throw new Error('Unexpected order of paginator item');

			if (item.isActive)
			{
				if (res.activeItem)
					throw new Error('More than one active paginator item');

				res.activeItem = item;
				res.active = item.num;
			}

			item.ind = res.items.length;
			res.items.push(item);
			prevPageItem = item;
			ellipsisBefore = false;
		}

		// Check ellipsis is not the last item
		if (ellipsisBefore)
			throw new Error('Unexpected placement of paginator ellipsis');

		// Check active item present is paginator is visible(2 or more pages)
		if (res.items.length && !res.activeItem)
			throw new Error('Active paginator item not found');

		if (res.items.length)
		{
			res.pages = res.items[res.items.length - 1].num;
		}
		else
		{
			res.pages = 1;
			res.active = 1;
		}

		res.isFirstPage = function()
		{
			return (!this.activeItem || this.activeItem.ind == 0);
		};

		res.isLastPage = function()
		{
			return (!this.activeItem || this.activeItem.ind == this.items.length - 1);
		};

		res.goToFirstPage = async function()
		{
			if (!this.items.length)
				return;

			let item = this.items[0];
			if (item.isActive)
				return;

			return self.click(item.linkElem);
		};

		res.goToPrevPage = async function()
		{
			if (this.isFirstPage())
				return;

			let item = this.items[this.activeItem.ind - 1];
			if (item.isActive)
				return;

			return self.click(item.linkElem);
		};

		res.goToNextPage = async function()
		{
			if (this.isLastPage())
				return;

			let item = this.items[this.activeItem.ind + 1];
			if (item.isActive)
				return;

			return self.click(item.linkElem);
		};

		res.goToLastPage = async function()
		{
			if (!this.items.length)
				return;

			let item = this.items[this.items.length - 1];
			if (item.isActive)
				return;

			return self.click(item.linkElem);
		};

		return res;
	}


	async parseContent()
	{
		let res = { titleEl : await this.query('.content_wrap > .heading > h1'),
	 				addBtn : await this.parseIconLink(await this.query('#add_btn')),
					toolbar : {
						elem : await this.query('#toolbar'),
						editBtn : await this.parseIconLink(await this.query('#edit_btn')),
						exportBtn : await this.parseIconLink(await this.query('#export_btn')),
						delBtn : await this.parseIconLink(await this.query('#del_btn'))
					}
				};
		if (!res.titleEl || !res.addBtn || !res.toolbar.elem || !res.toolbar.editBtn || !res.toolbar.delBtn)
			throw new Error('Wrong transactions view structure');

		res.typeMenu = await this.parseTransactionTypeMenu(await this.query('#trtype_menu'));
		if (!res.typeMenu)
			throw new Error('Search form not found');

		res.accDropDown = await this.parseDropDown(await this.query('.tr_filter .dd_container'));
		if (!res.accDropDown)
			throw new Error('Account filter control not found');

		let calendarBtn = await this.query('#calendar_btn');
		res.dateFilter = await this.parseDatePickerFilter(await this.parent(calendarBtn));
		if (!res.dateFilter)
			throw new Error('Date filter not found');

		res.searchForm = await this.parseSearchForm(await this.query('#searchFrm'));
		if (!res.searchForm)
			throw new Error('Search form not found');

		res.modeSelector = await this.parseModeSelector(await this.query('.trans_list .mode_selector'));
		res.paginator = await this.parsePaginator(await this.query('.trans_list .paginator'));

		res.title = await this.prop(res.titleEl, 'innerText');
		res.transList = await this.parseTransactionsList(await this.query('#tritems'));
		if (!res.transList)
			throw new Error('List of transactions not found');

		if (res.transList.items && res.transList.items.length && !res.modeSelector)
			throw new Error('Mode selector not found');
		if (res.transList.items && res.transList.items.length && !res.paginator)
			throw new Error('Paginator not found');

		res.delete_warning = await this.parseWarningPopup(await this.query('#delete_warning'));

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
		let app = this.app;
		const onPage = app.config.transactionsOnPage;

		if (!tr)
			throw new Error('No transactions specified');

		if (!Array.isArray(tr))
			tr = [tr];

		let currentType = app.view.content.typeMenu.activeType;

		await this.goToFirstPage();

		let trOnCurrentPage;
		let absTrOnCurrentPage;

		while(true)
		{
			let pageNum = app.view.currentPage();


			absTrOnCurrentPage = tr.filter(tr_num => {
				return tr_num >= onPage * (pageNum - 1) &&
						tr_num < onPage * pageNum;
			});

			trOnCurrentPage = absTrOnCurrentPage.map(tr_num => tr_num - (pageNum - 1) * onPage);

			if (trOnCurrentPage.length)
			{
				await app.view.selectTransactions(trOnCurrentPage);

				await app.view.performAction(() => app.view.content.toolbar.delBtn.click());

				if (!await app.view.isVisible(app.view.content.delete_warning.elem))
					throw 'Delete transaction warning popup not appear';
				if (!app.view.content.delete_warning.okBtn)
					throw 'OK button not found';

				await app.view.navigation(() => app.view.click(app.view.content.delete_warning.okBtn));

				// After delete transactions navigation occurs to page without filters, so we need to restore it
				await app.view.filterByType(currentType);

				// Exclude previously removed transactions
				tr = tr.filter(tr_num => !absTrOnCurrentPage.includes(tr_num))
				if (!tr.length)
					break;

				// Shift positions
				tr = tr.map(tr_num => tr_num - trOnCurrentPage.length);
			}
			else
			{
				if (app.view.isLastPage())
				{
					if (tr.length)
						throw new Error('Transaction(s) ' + tr.join() + ' can not be removed');
					else
						break;
				}
				else
				{
					await app.view.goToNextPage();
				}
			}
		}
	}

}


export { TransactionsView };
