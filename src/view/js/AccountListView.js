'use strict';

/* global ge, urlJoin, extend, baseURL */
/* global AccountList */
/* global View, ConfirmDialog, Toolbar */

var singleAccDeleteTitle = 'Delete account';
var multiAccDeleteTitle = 'Delete accounts';
var multiAccDeleteMsg = 'Are you sure want to delete selected accounts?<br>All income and expense transactions history will be lost. Transfer to this accounts will be changed to expense. Transfer from this accounts will be changed to income.';
var singleAccDeleteMsg = 'Are you sure want to delete selected account?<br>All income and expense transactions history will be lost. Transfer to this account will be changed to expense. Transfer from this account will be changed to income.';

/**
 * List of accounts view
 */
function AccountListView() {
    AccountListView.parent.constructor.apply(this, arguments);

    this.model = {
        selected: {
            visible: new Selection(),
            hidden: new Selection()
        }
    };

    if (this.props.accounts) {
        this.model.accounts = AccountList.create(this.props.accounts);
    }
}

extend(AccountListView, View);

/**
 * View initialization
 */
AccountListView.prototype.onStart = function () {
    this.tilesContainer = ge('tilesContainer');
    if (!this.tilesContainer) {
        throw new Error('Failed to initialize Account List view');
    }
    this.tilesContainer.addEventListener('click', this.onTileClick.bind(this));

    this.hiddenTilesContainer = ge('hiddenTilesContainer');
    if (!this.hiddenTilesContainer) {
        throw new Error('Failed to initialize Account List view');
    }
    this.hiddenTilesContainer.addEventListener('click', this.onTileClick.bind(this));

    this.showForm = ge('showform');
    this.showAccountsInp = ge('showaccounts');
    if (!this.showForm || !this.showAccountsInp) {
        throw new Error('Failed to initialize Account List view');
    }

    this.hideForm = ge('hideform');
    this.hideAccountsInp = ge('hideaccounts');
    if (!this.hideForm || !this.hideAccountsInp) {
        throw new Error('Failed to initialize Account List view');
    }

    this.delForm = ge('delform');
    this.delAccountsInp = ge('delaccounts');
    if (!this.delForm || !this.delAccountsInp) {
        throw new Error('Failed to initialize Account List view');
    }
    this.toolbar = Toolbar.create({
        elem: 'toolbar',
        onshow: this.showForm.submit.bind(this.showForm),
        onhide: this.hideForm.submit.bind(this.hideForm),
        ondelete: this.confirmDelete.bind(this)
    });
};

/**
 * Tile click event handler
 */
AccountListView.prototype.onTileClick = function (e) {
    var tile;
    var accountId;
    var account;
    var currentSelection;
    var selCount;
    var hiddenSelCount;
    var totalSelCount;
    var selArr;
    var hiddenSelArr;
    var totalSelArr;
    var exportURL;

    if (!e || !e.target) {
        return;
    }

    tile = e.target.closest('.tile');
    if (!tile || !tile.dataset) {
        return;
    }

    accountId = parseInt(tile.dataset.id, 10);
    account = this.model.accounts.getItem(accountId);
    if (!account) {
        return;
    }

    currentSelection = account.isVisible()
        ? this.model.selected.visible
        : this.model.selected.hidden;
    if (currentSelection.isSelected(accountId)) {
        currentSelection.deselect(accountId);
        tile.classList.remove('tile_selected');
    } else {
        currentSelection.select(accountId);
        tile.classList.add('tile_selected');
    }

    selCount = this.model.selected.visible.count();
    hiddenSelCount = this.model.selected.hidden.count();
    totalSelCount = selCount + hiddenSelCount;
    this.toolbar.updateBtn.show(totalSelCount === 1);
    this.toolbar.exportBtn.show(totalSelCount > 0);
    this.toolbar.showBtn.show(hiddenSelCount > 0);
    this.toolbar.hideBtn.show(selCount > 0);
    this.toolbar.deleteBtn.show(totalSelCount > 0);

    selArr = this.model.selected.visible.getIdArray();
    hiddenSelArr = this.model.selected.hidden.getIdArray();
    totalSelArr = selArr.concat(hiddenSelArr);
    this.showAccountsInp.value = totalSelArr.join();
    this.hideAccountsInp.value = totalSelArr.join();
    this.delAccountsInp.value = totalSelArr.join();

    if (totalSelCount === 1) {
        this.toolbar.updateBtn.setURL(baseURL + 'accounts/edit/' + totalSelArr[0]);
    }

    if (totalSelCount > 0) {
        exportURL = baseURL + 'accounts/export/';
        if (totalSelCount === 1) {
            exportURL += totalSelArr[0];
        } else {
            exportURL += '?' + urlJoin({ id: totalSelArr });
        }
        this.toolbar.exportBtn.setURL(exportURL);
    }

    this.toolbar.show(totalSelCount > 0);
};

/**
 * Show account(s) delete confirmation popup
 */
AccountListView.prototype.confirmDelete = function () {
    var totalSelCount = this.model.selected.visible.count() + this.model.selected.hidden.count();
    if (!totalSelCount) {
        return;
    }

    ConfirmDialog.create({
        id: 'delete_warning',
        title: (totalSelCount > 1) ? multiAccDeleteTitle : singleAccDeleteTitle,
        content: (totalSelCount > 1) ? multiAccDeleteMsg : singleAccDeleteMsg,
        onconfirm: this.delForm.submit.bind(this.delForm)
    });
};
