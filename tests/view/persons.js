import { TestView } from './testview.js';
import { TilesList } from './component/tileslist.js';
import { Tile } from './component/tile.js';
import { IconLink } from './component/iconlink.js';
import { WarningPopup } from './component/warningpopup.js';
import { Toolbar } from './component/toolbar.js';
import { Component } from './component/component.js';

/** List of persons view class */
export class PersonsView extends TestView {
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
            || !res.toolbar.editBtn
            || !res.toolbar.delBtn
        ) {
            throw new Error('Invalid structure of persons view');
        }

        res.title = this.prop(res.titleEl, 'textContent');
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

    /** Click on add button */
    async goToCreatePerson() {
        await this.navigation(() => this.content.addBtn.click());
    }

    async selectPersons(data) {
        if (typeof data === 'undefined') {
            throw new Error('No persons specified');
        }

        const persons = Array.isArray(data) ? data : [data];

        const visibleTiles = this.content.tiles.items.length;
        const hiddenTiles = this.content.hiddenTiles.items.length;
        const totalTiles = visibleTiles + hiddenTiles;
        const activeTiles = this.content.tiles.getActive();
        const activeHiddenTiles = this.content.hiddenTiles.getActive();
        let selectedCount = activeTiles.length;
        let selectedHiddenCount = activeHiddenTiles.length;
        for (const num of persons) {
            if (num < 0 || num >= totalTiles) {
                throw new Error('Invalid person number');
            }

            if (num < visibleTiles) {
                const item = this.content.tiles.items[num];
                const isSelected = item.isActive;
                await this.performAction(() => item.click());
                selectedCount += (isSelected ? -1 : 1);
            } else {
                const item = this.content.hiddenTiles.items[num - visibleTiles];
                const isSelected = item.isActive;
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

            const delIsVisible = await this.content.toolbar.isButtonVisible('del');
            if ((totalSelected > 0) !== delIsVisible) {
                throw new Error(`Unexpected visibility (${delIsVisible}) of Delete button while ${totalSelected} items selected`);
            }
        }
    }

    /** Select specified person, click on edit button */
    async goToUpdatePerson(num) {
        await this.selectPersons(num);

        await this.navigation(() => this.content.toolbar.clickButton('update'));
    }

    async deletePersons(persons) {
        await this.selectPersons(persons);

        await this.performAction(() => this.content.toolbar.clickButton('del'));

        if (!await Component.isVisible(this.content.delete_warning)) {
            throw new Error('Delete person(s) warning popup not appear');
        }

        await this.navigation(() => this.click(this.content.delete_warning.okBtn));
    }

    /** Show secified accounts */
    async showPersons(persons, val = true) {
        await this.selectPersons(persons);

        await this.navigation(() => this.content.toolbar.clickButton(val ? 'show' : 'hide'));
    }

    /** Hide secified accounts */
    async hidePersons(persons) {
        await this.showPersons(persons, false);
    }

    static render(state) {
        const res = {
            values: {
                tiles: TilesList.renderPersons(state.persons),
                hiddenTiles: TilesList.renderHiddenPersons(state.persons),
            },
        };

        return res;
    }
}
