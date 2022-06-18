import {
    assert,
    query,
    prop,
    navigation,
    click,
} from 'jezve-test';
import { AppView } from './AppView.js';
import { TilesList } from './component/TilesList.js';
import { Tile } from './component/Tile.js';
import { IconLink } from './component/IconLink.js';
import { WarningPopup } from './component/WarningPopup.js';
import { Toolbar } from './component/Toolbar.js';

/** List of persons view class */
export class PersonsView extends AppView {
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
            && res.toolbar.content.delBtn,
            'Invalid structure of persons view',
        );

        res.title = prop(res.titleEl, 'textContent');
        res.tiles = await TilesList.create(this, await query('#tilesContainer'), Tile);
        res.hiddenTiles = await TilesList.create(this, await query('#hiddenTilesContainer'), Tile);

        res.delete_warning = await WarningPopup.create(this, await query('#delete_warning'));

        return res;
    }

    getItems() {
        const visibleItems = this.content.tiles.getItems();
        const hiddenItems = this.content.hiddenTiles.getItems();

        return visibleItems.concat(hiddenItems);
    }

    /** Click on add button */
    async goToCreatePerson() {
        await navigation(() => this.content.addBtn.click());
    }

    async selectPersons(data) {
        assert(typeof data !== 'undefined', 'No persons specified');

        const persons = Array.isArray(data) ? data : [data];

        const visibleTiles = this.content.tiles.itemsCount();
        const hiddenTiles = this.content.hiddenTiles.itemsCount();
        const totalTiles = visibleTiles + hiddenTiles;
        const activeTiles = this.content.tiles.getActive();
        const activeHiddenTiles = this.content.hiddenTiles.getActive();
        let selectedCount = activeTiles.length;
        let selectedHiddenCount = activeHiddenTiles.length;
        for (const num of persons) {
            assert(num >= 0 && num < totalTiles, 'Invalid person number');

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

            const showIsVisible = this.content.toolbar.isButtonVisible('show');
            assert(
                (selectedHiddenCount > 0) === showIsVisible,
                `Unexpected visibility (${showIsVisible}) of Show button while ${selectedHiddenCount} hidden items selected`,
            );

            const hideIsVisible = this.content.toolbar.isButtonVisible('hide');
            assert(
                (selectedCount > 0) === hideIsVisible,
                `Unexpected visibility (${hideIsVisible}) of Hide button while ${selectedCount} visible items selected`,
            );

            const totalSelected = selectedCount + selectedHiddenCount;
            const updIsVisible = this.content.toolbar.isButtonVisible('update');
            assert(
                (totalSelected === 1) === updIsVisible,
                `Unexpected visibility (${updIsVisible}) of Update button while ${totalSelected} items selected`,
            );

            const delIsVisible = this.content.toolbar.isButtonVisible('del');
            assert(
                (totalSelected > 0) === delIsVisible,
                `Unexpected visibility (${delIsVisible}) of Delete button while ${totalSelected} items selected`,
            );
        }
    }

    /** Select specified person, click on edit button */
    async goToUpdatePerson(num) {
        await this.selectPersons(num);

        await navigation(() => this.content.toolbar.clickButton('update'));
    }

    async deletePersons(persons) {
        await this.selectPersons(persons);

        await this.performAction(() => this.content.toolbar.clickButton('del'));

        assert(this.content.delete_warning?.content?.visible, 'Delete person(s) warning popup not appear');

        await navigation(() => click(this.content.delete_warning.content.okBtn));
    }

    /** Show secified accounts */
    async showPersons(persons, val = true) {
        await this.selectPersons(persons);

        await navigation(() => this.content.toolbar.clickButton(val ? 'show' : 'hide'));
    }

    /** Hide secified accounts */
    async hidePersons(persons) {
        await this.showPersons(persons, false);
    }

    static render(state) {
        const res = {
            tiles: TilesList.renderPersons(state.persons, false),
            hiddenTiles: TilesList.renderHiddenPersons(state.persons),
        };

        return res;
    }
}
