import 'jezvejs/style';
import { ge, urlJoin } from 'jezvejs';
import { Selection } from 'jezvejs/Selection';
import { Application } from '../../js/Application.js';
import { View } from '../../js/View.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { Toolbar } from '../../Components/Toolbar/Toolbar.js';
import '../../css/app.css';
import '../../Components/Tile/style.css';
import '../../Components/IconLink/style.css';

const TITLE_SINGLE_ACC_DELETE = 'Delete account';
const TITLE_MULTI_ACC_DELETE = 'Delete accounts';
const MSG_MULTI_ACC_DELETE = 'Are you sure want to delete selected accounts?<br>All income and expense transactions history will be lost. Transfer to this accounts will be changed to expense. Transfer from this accounts will be changed to income.';
const MSG_SINGLE_ACC_DELETE = 'Are you sure want to delete selected account?<br>All income and expense transactions history will be lost. Transfer to this account will be changed to expense. Transfer from this account will be changed to income.';

/**
 * List of accounts view
 */
class AccountListView extends View {
    constructor(...args) {
        super(...args);

        this.state = {
            selected: {
                visible: new Selection(),
                hidden: new Selection(),
            },
        };
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
        this.visibleTiles = Array.from(this.tilesContainer.querySelectorAll('.tile'));

        this.hiddenTilesContainer = ge('hiddenTilesContainer');
        if (!this.hiddenTilesContainer) {
            throw new Error('Failed to initialize Account List view');
        }
        this.hiddenTilesContainer.addEventListener('click', (e) => this.onTileClick(e));
        this.hiddenTiles = Array.from(this.hiddenTilesContainer.querySelectorAll('.tile'));

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
        const account = window.app.model.accounts.getItem(accountId);
        if (!account) {
            return;
        }

        const currentSelection = account.isVisible()
            ? this.state.selected.visible
            : this.state.selected.hidden;
        if (currentSelection.isSelected(accountId)) {
            currentSelection.deselect(accountId);
        } else {
            currentSelection.select(accountId);
        }

        this.render(this.state);
    }

    /**
     * Show account(s) delete confirmation popup
     */
    confirmDelete() {
        const totalSelCount = this.state.selected.visible.count()
            + this.state.selected.hidden.count();
        if (!totalSelCount) {
            return;
        }

        ConfirmDialog.create({
            id: 'delete_warning',
            title: (totalSelCount > 1) ? TITLE_MULTI_ACC_DELETE : TITLE_SINGLE_ACC_DELETE,
            content: (totalSelCount > 1) ? MSG_MULTI_ACC_DELETE : MSG_SINGLE_ACC_DELETE,
            onconfirm: () => this.delForm.submit(),
        });
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        // Render visible accounts
        this.visibleTiles.forEach((tile) => {
            const accountId = parseInt(tile.dataset.id, 10);

            if (state.selected.visible.isSelected(accountId)) {
                tile.classList.add('tile_selected');
            } else {
                tile.classList.remove('tile_selected');
            }
        });

        // Render hidden accounts
        this.hiddenTiles.forEach((tile) => {
            const accountId = parseInt(tile.dataset.id, 10);

            if (state.selected.hidden.isSelected(accountId)) {
                tile.classList.add('tile_selected');
            } else {
                tile.classList.remove('tile_selected');
            }
        });

        const selCount = state.selected.visible.count();
        const hiddenSelCount = state.selected.hidden.count();
        const totalSelCount = selCount + hiddenSelCount;
        this.toolbar.updateBtn.show(totalSelCount === 1);
        this.toolbar.exportBtn.show(totalSelCount > 0);
        this.toolbar.showBtn.show(hiddenSelCount > 0);
        this.toolbar.hideBtn.show(selCount > 0);
        this.toolbar.deleteBtn.show(totalSelCount > 0);

        const selArr = state.selected.visible.getIdArray();
        const hiddenSelArr = state.selected.hidden.getIdArray();
        const totalSelArr = selArr.concat(hiddenSelArr);
        this.showAccountsInp.value = totalSelArr.join();
        this.hideAccountsInp.value = totalSelArr.join();
        this.delAccountsInp.value = totalSelArr.join();

        const { baseURL } = window.app;
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
}

window.app = new Application(window.appProps);
window.app.createView(AccountListView);
