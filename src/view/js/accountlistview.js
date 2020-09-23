var singleAccDeleteTitle = 'Delete account';
var multiAccDeleteTitle = 'Delete accounts';
var multiAccDeleteMsg = 'Are you sure want to delete selected accounts?<br>All income and expense transactions history will be lost. Transfer to this accounts will be changed to expense. Transfer from this accounts will be changed to income.';
var singleAccDeleteMsg = 'Are you sure want to delete selected account?<br>All income and expense transactions history will be lost. Transfer to this account will be changed to expense. Transfer from this account will be changed to income.';


/**
 * List of accounts view
 */
function AccountListView(props)
{
	AccountListView.parent.constructor.apply(this, arguments);

	this.model = {
		selected: {
			visible : new Selection(),
			hidden : new Selection()
		}
	};

}


extend(AccountListView, View);


/**
 * View initialization
 */
AccountListView.prototype.onStart = function()
{
	this.tilesContainer = ge('tilesContainer');
	if (!this.tilesContainer)
		throw new Error('Failed to initialize Account List view');
	this.tilesContainer.addEventListener('click', this.onTileClick.bind(this));

	this.hiddenTilesContainer = ge('hiddenTilesContainer');
	if (!this.hiddenTilesContainer)
		throw new Error('Failed to initialize Account List view');
	this.hiddenTilesContainer.addEventListener('click', this.onTileClick.bind(this));

	this.editBtn = ge('edit_btn');
	if (!this.editBtn)
		throw new Error('Failed to initialize Account List view');
	this.editBtnLink = this.editBtn.querySelector('a');
	if (!this.editBtnLink)
		throw new Error('Failed to initialize Account List view');

	this.exportBtn = ge('export_btn');
	if (!this.exportBtn)
		throw new Error('Failed to initialize Account List view');
	this.exportBtnLink = this.exportBtn.querySelector('a');
	if (!this.exportBtnLink)
		throw new Error('Failed to initialize Account List view');

	this.showBtn = ge('show_btn');
	this.showForm = ge('showform');
	this.showAccountsInp = ge('showaccounts');
	if (!this.showBtn || !this.showForm || !this.showAccountsInp)
		throw new Error('Failed to initialize Account List view');
	this.showBtn.addEventListener('click', function()
	{
		this.showForm.submit();
	}.bind(this));

	this.hideBtn = ge('hide_btn');
	this.hideForm = ge('hideform');
	this.hideAccountsInp = ge('hideaccounts');
	if (!this.hideBtn || !this.hideForm || !this.hideAccountsInp)
		throw new Error('Failed to initialize Account List view');
	this.hideBtn.addEventListener('click', function()
	{
		this.hideForm.submit();
	}.bind(this));

	this.deleteBtn = ge('del_btn');
	this.delForm = ge('delform');
	this.delAccountsInp = ge('delaccounts');
	if (!this.hideBtn || !this.hideForm || !this.delAccountsInp)
		throw new Error('Failed to initialize Account List view');

	var btn = this.deleteBtn.querySelector('button');
	if (!btn)
		throw new Error('Failed to initialize Account List view');
	btn.onclick = this.showDeleteConfirmationPopup.bind(this);
};


/**
 * Tile click event handler
 */
AccountListView.prototype.onTileClick = function(e)
{
	if (!e || !e.target)
		return;

	var tile = e.target.closest('.tile');
	if (!tile || !tile.dataset)
		return;

	var account_id = parseInt(tile.dataset.id);
	var account = getAccount(account_id);
	if (!account)
		return;
	
	var currentSelection = isHiddenAccount(account) ? this.model.selected.hidden : this.model.selected.visible;
	if (currentSelection.isSelected(account_id))
	{
		currentSelection.deselect(account_id);
		tile.classList.remove('tile_selected');
	}
	else
	{
		currentSelection.select(account_id);
		tile.classList.add('tile_selected');
	}

	var selCount = this.model.selected.visible.count();
	var hiddenSelCount = this.model.selected.hidden.count();
	var totalSelCount = selCount + hiddenSelCount;
	show(this.editBtn, (totalSelCount == 1));
	show(this.exportBtn, (totalSelCount > 0));
	show(this.showBtn, (hiddenSelCount > 0));
	show(this.hideBtn, (selCount > 0));
	show(this.deleteBtn, (totalSelCount > 0));

	var selArr = this.model.selected.visible.getIdArray();
	var hiddenSelArr = this.model.selected.hidden.getIdArray();
	var totalSelArr = selArr.concat(hiddenSelArr);
	this.showAccountsInp.value = totalSelArr.join();
	this.hideAccountsInp.value = totalSelArr.join();
	this.delAccountsInp.value = totalSelArr.join();

	if (totalSelCount == 1)
	{
		this.editBtnLink.href = baseURL + 'accounts/edit/' + totalSelArr[0];
	}

	if (totalSelCount > 0)
	{
		var exportURL = baseURL + 'accounts/export/';
		if (totalSelCount == 1)
			exportURL += totalSelArr[0];
		else
			exportURL += '?' + urlJoin({ id : totalSelArr });
		this.exportBtnLink.href = exportURL;
	}

	show('toolbar', (totalSelCount > 0));
	if (totalSelCount > 0)
	{
		onScroll();
	}
};


/**
 * Delete button click event handler
 */
AccountListView.prototype.onDelete = function(e)
{
	this.showDeleteConfirmationPopup();
};


/**
 * Show account(s) delete confirmation popup
 */
AccountListView.prototype.showDeleteConfirmationPopup = function()
{
	var selCount = this.model.selected.visible.count();
	var hiddenSelCount = this.model.selected.hidden.count();
	var totalSelCount = selCount + hiddenSelCount;
	if (!totalSelCount)
		return;

	// check popup already created
	if (!this.delConfirmPopup)
	{
		this.delConfirmPopup = Popup.create({
			id : 'delete_warning',
			content : singleAccDeleteMsg,
			btn : {
				okBtn : { onclick : this.onDeleteConrifmResult.bind(this, true) },
				cancelBtn : { onclick : this.onDeleteConrifmResult.bind(this, false) }
			}
		});
	}

	this.delConfirmPopup.setTitle(singleAccDeleteTitle);
	this.delConfirmPopup.setContent(singleAccDeleteMsg);

	this.delConfirmPopup.show();
};


/**
 * Delete confirmation result handler
 * @param {boolean} result - user confirmed delete
 */
AccountListView.prototype.onDeleteConrifmResult = function(result)
{
	if (this.delConfirmPopup)
		this.delConfirmPopup.close();

	if (result)
	{
		this.delForm.submit();
	}
};
