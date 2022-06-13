import { assert, query, navigation } from 'jezve-test';
import { Widget } from './Widget.js';
import { TilesList } from '../TilesList.js';
import { Tile } from '../Tile.js';

export class AccountsWidget extends Widget {
    async parseContent() {
        const res = await super.parseContent();
        assert(res.title === 'Accounts', 'Invalid accounts widget');

        const tiles = await TilesList.create(this, await query(this.elem, '.tiles'), Tile);
        assert(tiles, 'Invalid accounts widget');

        res.tiles = tiles;

        return res;
    }

    get tiles() {
        return this.content.tiles;
    }

    async clickAccountByIndex(index) {
        assert.arrayIndex(this.tiles.content.items, index, `Tile ${index} not found`);

        const tile = this.tiles.content.items[index];

        await navigation(() => tile.click());
    }
}
