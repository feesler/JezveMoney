import 'jezvejs/style';
import { ge, urlJoin } from 'jezvejs';
import { Selection } from 'jezvejs/Selection';
import { View } from '../../js/View.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { Toolbar } from '../../Components/Toolbar/Toolbar.js';
import { AccountList } from '../../js/model/AccountList.js';
import '../../css/app.css';
import '../../Components/Tile/style.css';
import '../../Components/IconLink/style.css';

const singleAccDeleteTitle = 'Delete account';
const multiAccDeleteTitle = 'Delete accounts';
const multiAccDeleteMsg = 'Are you sure want to delete selected accounts?<br>All income and expense transactions history will be lost. Transfer to this accounts will be changed to expense. Transfer from this accounts will be changed to income.';
const singleAccDeleteMsg = 'Are you sure want to delete selected account?<br>All income and expense transactions history will be lost. Transfer to this account will be changed to expense. Transfer from this account will be changed to income.';

/* global baseURL */

/**
 * List of accounts view
 */
class AccountListView extends View {
    constructor(...args) {
        super(...args);

        this.model = {
            selected: {
                visible: new Selection(),
                hidden: new Selection(),
            },
        };

        if (this.props.accounts) {
            this.model.accounts = AccountList.create(this.props.accounts);
        }
    }

    /**
     * View initialization
     */
    onStart() {
        this.tilesContainer = ge('tilesContainer');
        if (!this.tilesContainer) {
            throw new Error('Failed to initialize Account List view');
        }
        this.tilesContainer.addEventListener('click', (e) => this.onTileClick(e));

        this.hiddenTilesContainer = ge('hiddenTilesContainer');
        if (!this.hiddenTilesContainer) {
            throw new Error('Failed to initialize Account List view');
        }
        this.hiddenTilesContainer.addEventListener('click', (e) => this.onTileClick(e));

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
            onshow: () => this.showForm.submit(),
            onhide: () => this.hideForm.submit(),
            ondelete: () => this.confirmDelete(),
        });
    }

    /**
     * Tile click event handler
     */
    onTileClick(e) {
        if (!e || !e.target) {
            return;
        }

        const tile = e.target.closest('.tile');
        if (!tile || !tile.dataset) {
            return;
        }

        const accountId = parseInt(tile.dataset.id, 10);
        const account = this.model.accounts.getItem(accountId);
        if (!account) {
            return;
        }

        const currentSelection = account.isVisible()
            ? this.model.selected.visible
            : this.model.selected.hidden;
        if (currentSelection.isSelected(accountId)) {
            currentSelection.deselect(accountId);
            tile.classList.remove('tile_selected');
        } else {
            currentSelection.select(accountId);
            tile.classList.add('tile_selected');
        }

        const selCount = this.model.selected.visible.count();
        const hiddenSelCount = this.model.selected.hidden.count();
        const totalSelCount = selCount + hiddenSelCount;
        this.toolbar.updateBtn.show(totalSelCount === 1);
        this.toolbar.exportBtn.show(totalSelCount > 0);
        this.toolbar.showBtn.show(hiddenSelCount > 0);
        this.toolbar.hideBtn.show(selCount > 0);
        this.toolbar.deleteBtn.show(totalSelCount > 0);

        const selArr = this.model.selected.visible.getIdArray();
        const hiddenSelArr = this.model.selected.hidden.getIdArray();
        const totalSelArr = selArr.concat(hiddenSelArr);
        this.showAccountsInp.value = totalSelArr.join();
        this.hideAccountsInp.value = totalSelArr.join();
        this.delAccountsInp.value = totalSelArr.join();

        if (totalSelCount === 1) {
            this.toolbar.updateBtn.setURL(`${baseURL}accounts/update/${totalSelArr[0]}`);
        }

        if (totalSelCount > 0) {
            let exportURL = `${baseURL}accounts/export/`;
            if (totalSelCount === 1) {
                exportURL += totalSelArr[0];
            } else {
                exportURL += `?${urlJoin({ id: totalSelArr })}`;
            }
            this.toolbar.exportBtn.setURL(exportURL);
        }

        this.toolbar.show(totalSelCount > 0);
    }

    /**
     * Show account(s) delete confirmation popup
     */
    confirmDelete() {
        const totalSelCount = this.model.selected.visible.count()
            + this.model.selected.hidden.count();
        if (!totalSelCount) {
            return;
        }

        ConfirmDialog.create({
            id: 'delete_warning',
            title: (totalSelCount > 1) ? multiAccDeleteTitle : singleAccDeleteTitle,
            content: (totalSelCount > 1) ? multiAccDeleteMsg : singleAccDeleteMsg,
            onconfirm: () => this.delForm.submit(),
        });
    }
}

window.view = new AccountListView(window.app);
