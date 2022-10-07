import {
    assert,
    query,
    prop,
    navigation,
    waitForFunction,
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
            && res.toolbar.content.showBtn
            && res.toolbar.content.hideBtn
            && res.toolbar.content.delBtn,
            'Invalid structure of persons view',
        );

        res.title = prop(res.titleEl, 'textContent');
        res.tiles = await TilesList.create(this, await query('#tilesContainer'), Tile);
        res.hiddenTiles = await TilesList.create(this, await query('#hiddenTilesContainer'), Tile);
        res.loadingIndicator = { elem: await query('.loading-indicator') };
        res.delete_warning = await WarningPopup.create(this, await query('#delete_warning'));

        res.renderTime = await prop(res.tiles.elem, 'dataset.time');

        return res;
    }

    async buildModel(cont) {
        const res = {
            tiles: cont.tiles.getItems(),
            hiddenTiles: cont.hiddenTiles.getItems(),
            loading: cont.loadingIndicator.visible,
            renderTime: cont.renderTime,
        };

        return res;
    }

    getExpectedState(model = this.model) {
        const visibleSelected = this.getSelectedItems(model);
        const hiddenSelected = this.getHiddenSelectedItems(model);
        const totalSelected = visibleSelected.length + hiddenSelected.length;

        const res = {
            loadingIndicator: { visible: model.loading },
            toolbar: {
                editBtn: { visible: (totalSelected === 1) },
                delBtn: { visible: (totalSelected > 0) },
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

    /** Click on add button */
    async goToCreatePerson() {
        await navigation(() => this.content.addBtn.click());
    }

    async waitForList(action) {
        await this.parse();

        const prevTime = this.model.renderTime;
        await action();

        await waitForFunction(async () => {
            await this.parse();
            return (
                !this.model.loading
                && prevTime !== this.model.renderTime
            );
        });

        await this.parse();
    }

    async selectPersons(data) {
        assert(typeof data !== 'undefined', 'No persons specified');

        const persons = Array.isArray(data) ? data : [data];

        const visibleTiles = this.model.tiles.length;
        const hiddenTiles = this.model.hiddenTiles.length;
        const totalTiles = visibleTiles + hiddenTiles;
        for (const num of persons) {
            assert(num >= 0 && num < totalTiles, 'Invalid person number');

            const item = (num < visibleTiles)
                ? this.model.tiles[num]
                : this.model.hiddenTiles[num - visibleTiles];

            item.isActive = !item.isActive;

            const expected = this.getExpectedState();

            const tile = (num < visibleTiles)
                ? this.content.tiles.content.items[num]
                : this.content.hiddenTiles.content.items[num - visibleTiles];

            await this.waitForList(() => tile.click());

            this.checkState(expected);
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

        await this.waitForList(() => click(this.content.delete_warning.content.okBtn));
    }

    /** Show secified accounts */
    async showPersons(persons, val = true) {
        await this.selectPersons(persons);

        await this.waitForList(() => this.content.toolbar.clickButton(val ? 'show' : 'hide'));
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
