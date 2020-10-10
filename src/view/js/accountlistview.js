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

    if (this.props.accounts)
    {
        this.model.accounts = AccountList.create(this.props.accounts);
    }
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

    this.updateBtn = IconLink.fromElement({ elem: 'edit_btn' });
    this.exportBtn = IconLink.fromElement({ elem: 'export_btn' });

	this.showForm = ge('showform');
	this.showAccountsInp = ge('showaccounts');
    this.showBtn = IconLink.fromElement({
        elem: 'show_btn',
        onclick: function() {
            this.showForm.submit();
        }.bind(this)
    });
	if (!this.showBtn || !this.showForm || !this.showAccountsInp)
		throw new Error('Failed to initialize Account List view');

	this.hideForm = ge('hideform');
	this.hideAccountsInp = ge('hideaccounts');
    this.hideBtn = IconLink.fromElement({
        elem: 'hide_btn',
        onclick: function() {
            this.hideForm.submit();
        }.bind(this)
    });
	if (!this.hideBtn || !this.hideForm || !this.hideAccountsInp)
		throw new Error('Failed to initialize Account List view');

	this.delForm = ge('delform');
	this.delAccountsInp = ge('delaccounts');
    this.deleteBtn = IconLink.fromElement({
        elem: 'del_btn',
        onclick: this.showDeleteConfirmationPopup.bind(this)
    });
	if (!this.deleteBtn || !this.delForm || !this.delAccountsInp)
		throw new Error('Failed to initialize Account List view');
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
	var account = this.model.accounts.getItem(account_id);
	if (!account)
		return;
	
	var currentSelection = account.isVisible() ? this.model.selected.visible : this.model.selected.hidden;
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
	this.updateBtn.show(totalSelCount == 1);
	this.exportBtn.show(totalSelCount > 0);
	this.showBtn.show(hiddenSelCount > 0);
	this.hideBtn.show(selCount > 0);
	this.deleteBtn.show(totalSelCount > 0);

	var selArr = this.model.selected.visible.getIdArray();
	var hiddenSelArr = this.model.selected.hidden.getIdArray();
	var totalSelArr = selArr.concat(hiddenSelArr);
	this.showAccountsInp.value = totalSelArr.join();
	this.hideAccountsInp.value = totalSelArr.join();
	this.delAccountsInp.value = totalSelArr.join();

	if (totalSelCount == 1)
	{
        this.updateBtn.setURL(baseURL + 'accounts/edit/' + totalSelArr[0]);
	}

	if (totalSelCount > 0)
	{
		var exportURL = baseURL + 'accounts/export/';
		if (totalSelCount == 1)
			exportURL += totalSelArr[0];
		else
			exportURL += '?' + urlJoin({ id : totalSelArr });
		this.exportBtn.setURL(exportURL);
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
				okBtn : { onclick : this.onDeleteConfirmResult.bind(this, true) },
				cancelBtn : { onclick : this.onDeleteConfirmResult.bind(this, false) }
			}
		});
	}

	this.delConfirmPopup.setTitle((totalSelCount > 1) ? multiAccDeleteTitle : singleAccDeleteTitle);
	this.delConfirmPopup.setContent((totalSelCount > 1) ? multiAccDeleteMsg : singleAccDeleteMsg);

	this.delConfirmPopup.show();
};


/**
 * Delete confirmation result handler
 * @param {boolean} result - user confirmed delete
 */
AccountListView.prototype.onDeleteConfirmResult = function(result)
{
	if (this.delConfirmPopup)
		this.delConfirmPopup.close();

	if (result)
	{
		this.delForm.submit();
	}
};
