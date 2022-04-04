import { AppComponent } from './component/AppComponent.js';
import { AppView } from './AppView.js';
import { TilesList } from './component/TilesList.js';
import { Tile } from './component/Tile.js';
import { IconLink } from './component/IconLink.js';
import { WarningPopup } from './component/WarningPopup.js';
import { Toolbar } from './component/Toolbar.js';

/** List of accounts view class */
export class AccountsView extends AppView {
    async parseContent() {
        const res = {
            titleEl: await this.query('.content_wrap > .heading > h1'),
            addBtn: await IconLink.create(this, await this.query('#add_btn')),
            toolbar: await Toolbar.create(this, await this.query('#toolbar')),
        };

        if (
            !res.titleEl
            || !res.addBtn
            || !res.toolbar
            || !res.toolbar.content.editBtn
            || !res.toolbar.content.exportBtn
            || !res.toolbar.content.delBtn
        ) {
            throw new Error('Invalid structure of accounts view');
        }

        res.title = await this.prop(res.titleEl, 'textContent');
        res.tiles = await TilesList.create(this, await this.query('#tilesContainer'), Tile);
        res.hiddenTiles = await TilesList.create(this, await this.query('#hiddenTilesContainer'), Tile);

        res.delete_warning = await WarningPopup.create(this, await this.query('#delete_warning'));

        return res;
    }

    getItems() {
        const visibleItems = this.content.tiles.getItems();
        const hiddenItems = this.content.hiddenTiles.getItems();

        return visibleItems.concat(hiddenItems);
    }

    /** Click on add button and return navigation promise */
    goToCreateAccount() {
        return this.navigation(() => this.content.addBtn.click());
    }

    /** Select specified account, click on edit button and return navigation promise */
    async goToUpdateAccount(num) {
        await this.selectAccounts(num);

        await this.navigation(() => this.content.toolbar.clickButton('update'));
    }

    async selectAccounts(data) {
        if (typeof data === 'undefined') {
            throw new Error('No accounts specified');
        }

        const accounts = Array.isArray(data) ? data : [data];

        const visibleTiles = this.content.tiles.itemsCount();
        const hiddenTiles = this.content.hiddenTiles.itemsCount();
        const totalTiles = visibleTiles + hiddenTiles;
        const activeTiles = this.content.tiles.getActive();
        const activeHiddenTiles = this.content.hiddenTiles.getActive();
        let selectedCount = activeTiles.length;
        let selectedHiddenCount = activeHiddenTiles.length;
        for (const num of accounts) {
            if (num < 0 || num >= totalTiles) {
                throw new Error('Invalid account number');
            }

            if (num < visibleTiles) {
                const item = this.content.tiles.content.items[num];
                const isSelected = item.content.isActive;
                await this.performAction(() => item.click());
                selectedCount += (isSelected ? -1 : 1);
            } else {
                const item = this.content.hiddenTiles.content.items[num - visibleTiles];
                const isSelected = item.content.isActive;
                await this.performAction(() => item.click());
                selectedHiddenCount += (isSelected ? -1 : 1);
            }

            const showIsVisible = await this.content.toolbar.isButtonVisible('show');
            if ((selectedHiddenCount > 0) !== showIsVisible) {
                throw new Error(`Unexpected visibility (${showIsVisible}) of Show button while ${selectedHiddenCount} hidden items selected`);
            }

            const hideIsVisible = await this.content.toolbar.isButtonVisible('hide');
            if ((selectedCount > 0) !== hideIsVisible) {
                throw new Error(`Unexpected visibility (${hideIsVisible}) of Hide button while ${selectedCount} visible items selected`);
            }

            const totalSelected = selectedCount + selectedHiddenCount;
            const updIsVisible = await this.content.toolbar.isButtonVisible('update');
            if ((totalSelected === 1) !== updIsVisible) {
                throw new Error(`Unexpected visibility (${updIsVisible}) of Update button while ${totalSelected} items selected`);
            }

            const exportIsVisible = await this.content.toolbar.isButtonVisible('export');
            if ((totalSelected > 0) !== exportIsVisible) {
                throw new Error(`Unexpected visibility (${exportIsVisible}) of Export button while ${totalSelected} items selected`);
            }

            const delIsVisible = await this.content.toolbar.isButtonVisible('del');
            if ((totalSelected > 0) !== delIsVisible) {
                throw new Error(`Unexpected visibility (${delIsVisible}) of Delete button while ${totalSelected} items selected`);
            }
        }
    }

    async deselectAccounts() {
        const visibleActive = this.content.tiles.getSelectedIndexes();
        const hiddenActive = this.content.hiddenTiles.getSelectedIndexes()
            .map((ind) => ind + this.content.tiles.length);

        const selected = visibleActive.concat(hiddenActive);
        if (selected.length > 0) {
            await this.performAction(() => this.selectAccounts(selected));
        }
    }

    /** Delete secified accounts and return navigation promise */
    async deleteAccounts(data) {
        await this.selectAccounts(data);

        await this.performAction(() => this.content.toolbar.clickButton('del'));
        if (!await AppComponent.isVisible(this.content.delete_warning)) {
            throw new Error('Delete account warning popup not appear');
        }

        if (!this.content.delete_warning.content.okBtn) {
            throw new Error('OK button not found');
        }

        await this.navigation(() => this.click(this.content.delete_warning.content.okBtn));
    }

    /** Show secified accounts */
    async showAccounts(acc, val = true) {
        await this.selectAccounts(acc);

        await this.navigation(() => this.content.toolbar.clickButton(val ? 'show' : 'hide'));
    }

    /** Hide secified accounts and return navigation promise */
    async hideAccounts(acc) {
        await this.showAccounts(acc, false);
    }

    /** Export transactions of specified accounts */
    async exportAccounts(acc) {
        await this.selectAccounts(acc);

        const downloadURL = this.content.toolbar.getButtonLink('export');
        if (!downloadURL) {
            throw new Error('Invalid export URL');
        }

        const exportResp = await this.httpReq('GET', downloadURL);
        if (!exportResp || exportResp.status !== 200) {
            throw new Error('Invalid response');
        }

        await this.deselectAccounts();

        return exportResp.body;
    }

    static render(state) {
        const userAccounts = state.accounts.getUserAccounts();

        const res = {
            values: {
                tiles: TilesList.renderAccounts(userAccounts),
                hiddenTiles: TilesList.renderHiddenAccounts(userAccounts),
            },
        };

        return res;
    }
}
