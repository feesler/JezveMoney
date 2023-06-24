import {
    assert,
    query,
    navigation,
    click,
    TestComponent,
} from 'jezve-test';
import { TilesList } from '../Tiles/TilesList.js';

export class SummaryList extends TestComponent {
    async parseContent() {
        const res = await super.parseContent();

        res.tiles = await TilesList.create(this, await query(this.elem, '.tiles'));
        res.hiddenTiles = await TilesList.create(this, await query(this.elem, '.tiles + .tiles'));

        res.toggleHiddenBtn = { elem: await query(this.elem, '.tiles + .link-btn') };

        return res;
    }

    get tiles() {
        return this.content.tiles;
    }

    get hiddenTiles() {
        return this.content.hiddenTiles;
    }

    get toggleHiddenBtn() {
        return this.content.toggleHiddenBtn;
    }

    async toggleHidden() {
        assert(this.toggleHiddenBtn.visible, 'Toggle hidden tile button not visible');
        await click(this.toggleHiddenBtn.elem);
    }

    async clickTileByIndex(index) {
        assert.arrayIndex(this.tiles.items, index, `Tile ${index} not found`);

        const tile = this.tiles.items[index];

        await navigation(() => tile.click());
    }
}
