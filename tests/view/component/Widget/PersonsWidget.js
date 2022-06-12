import { query } from 'jezve-test';
import { Widget } from './Widget.js';
import { TilesList } from '../TilesList.js';
import { InfoTile } from '../InfoTile.js';

export class PersonsWidget extends Widget {
    async parseContent() {
        const res = await super.parseContent();

        if (res.title !== 'Persons') {
            throw new Error('Invalid widget');
        }

        const infoTiles = await TilesList.create(this, await query(this.elem, '.info-tiles'), InfoTile);
        if (!infoTiles) {
            throw new Error('Invalid persons widget');
        }

        res.infoTiles = infoTiles;

        return res;
    }
}
