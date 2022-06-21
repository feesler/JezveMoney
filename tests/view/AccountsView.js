import {
    assert,
    query,
    prop,
    navigation,
    click,
    httpReq,
} from 'jezve-test';
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
            titleEl: await query('.content_wrap > .heading > h1'),
            addBtn: await IconLink.create(this, await query('#add_btn')),
            toolbar: await Toolbar.create(this, await query('#toolbar')),
        };

        assert(
            res.titleEl
            && res.addBtn
            && res.toolbar
            && res.toolbar.content.editBtn
            && res.toolbar.content.exportBtn
            && res.toolbar.content.delBtn,
            'Invalid structure of accounts view',
        );

        res.title = await prop(res.titleEl, 'textContent');
        res.tiles = await TilesList.create(this, await query('#tilesContainer'), Tile);
        res.hiddenTiles = await TilesList.create(this, await query('#hiddenTilesContainer'), Tile);

        res.delete_warning = await WarningPopup.create(this, await query('#delete_warning'));

        return res;
    }

    async buildModel(cont) {
        const res = {};

        res.tiles = cont.tiles.getItems();
        res.hiddenTiles = cont.hiddenTiles.getItems();

        return res;
    }

    getExpectedState(model = this.model) {
        const visibleSelected = this.getSelectedItems(model);
        const hiddenSelected = this.getHiddenSelectedItems(model);
        const totalSelected = visibleSelected.length + hiddenSelected.length;

        const res = {
            toolbar: {
                editBtn: { visible: (totalSelected === 1) },
                delBtn: { visible: (totalSelected > 0) },
                exportBtn: { visible: (totalSelected > 0) },
                showBtn: { visible: (hiddenSelected.length > 0) },
                hideBtn: { visible: (visibleSelected.length > 0) },
                visible: totalSelected > 0,
            },
        };

        return res;
    }

    getSelectedItems(model = this.model) {
        return model.tiles.filter((item) => item.isActive);
    }

    getHiddenSelectedItems(model = this.model) {
        return model.hiddenTiles.filter((item) => item.isActive);
    }

    getItems() {
        const visibleItems = this.content.tiles.getItems();
        const hiddenItems = this.content.hiddenTiles.getItems();

        return visibleItems.concat(hiddenItems);
    }

    /** Click on add button and return navigation promise */
    goToCreateAccount() {
        return navigation(() => this.content.addBtn.click());
    }

    /** Select specified account, click on edit button and return navigation promise */
    async goToUpdateAccount(num) {
        await this.selectAccounts(num);

        await navigation(() => this.content.toolbar.clickButton('update'));
    }

    async selectAccounts(data) {
        assert.isDefined(data, 'No accounts specified');

        const accounts = Array.isArray(data) ? data : [data];

        const visibleTiles = this.model.tiles.length;
        const hiddenTiles = this.model.hiddenTiles.length;
        const totalTiles = visibleTiles + hiddenTiles;
        for (const num of accounts) {
            assert(num >= 0 && num < totalTiles, 'Invalid account number');

            const item = (num < visibleTiles)
                ? this.model.tiles[num]
                : this.model.hiddenTiles[num - visibleTiles];

            item.isActive = !item.isActive;

            const expected = this.getExpectedState();

            const tile = (num < visibleTiles)
                ? this.content.tiles.content.items[num]
                : this.content.hiddenTiles.content.items[num - visibleTiles];

            await this.performAction(() => tile.click());

            this.checkState(expected);
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
        assert(this.content.delete_warning?.content?.visible, 'Delete account warning popup not appear');

        assert(this.content.delete_warning.content.okBtn, 'OK button not found');

        await navigation(() => click(this.content.delete_warning.content.okBtn));
    }

    /** Show secified accounts */
    async showAccounts(acc, val = true) {
        await this.selectAccounts(acc);

        await navigation(() => this.content.toolbar.clickButton(val ? 'show' : 'hide'));
    }

    /** Hide secified accounts and return navigation promise */
    async hideAccounts(acc) {
        await this.showAccounts(acc, false);
    }

    /** Export transactions of specified accounts */
    async exportAccounts(acc) {
        await this.selectAccounts(acc);

        const downloadURL = this.content.toolbar.getButtonLink('export');
        assert(downloadURL, 'Invalid export URL');

        const exportResp = await httpReq('GET', downloadURL);
        assert(exportResp?.status === 200, 'Invalid response');

        await this.deselectAccounts();

        return exportResp.body;
    }

    static render(state) {
        const userAccounts = state.accounts.getUserAccounts();

        const res = {
            tiles: TilesList.renderAccounts(userAccounts),
            hiddenTiles: TilesList.renderHiddenAccounts(userAccounts),
        };

        return res;
    }
}
