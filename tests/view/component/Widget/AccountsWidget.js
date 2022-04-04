import { Widget } from './Widget.js';
import { TilesList } from '../TilesList.js';
import { Tile } from '../Tile.js';

export class AccountsWidget extends Widget {
    async parseContent() {
        const res = await super.parseContent();

        if (res.title !== 'Accounts') {
            throw new Error('Invalid widget');
        }

        const tiles = await TilesList.create(this, await this.query(this.elem, '.tiles'), Tile);
        if (!tiles) {
            throw new Error('Invalid accounts widget');
        }

        res.tiles = tiles;

        return res;
    }

    async clickAccountByIndex(index) {
        if (!this.content.tiles || this.content.tiles.itemsCount() <= index) {
            throw new Error(`Tile ${index} not found`);
        }

        const tile = this.content.tiles.content.items[index];

        await this.navigation(() => tile.click());
    }
}
