import { assert, query, navigation } from 'jezve-test';
import { Widget } from './Widget.js';
import { TilesList } from '../Tiles/TilesList.js';

export class TilesWidget extends Widget {
    async parseContent() {
        const res = await super.parseContent();

        res.tiles = await TilesList.create(this, await query(this.elem, '.tiles'));

        return res;
    }

    get tiles() {
        return this.content.tiles;
    }

    async clickTileByIndex(index) {
        assert.arrayIndex(this.tiles.items, index, `Tile ${index} not found`);

        const tile = this.tiles.items[index];

        await navigation(() => tile.click());
    }
}
