import { assert, query } from 'jezve-test';
import { Widget } from './Widget.js';
import { TilesList } from '../TilesList.js';
import { InfoTile } from '../InfoTile.js';

export class PersonsWidget extends Widget {
    async parseContent() {
        const res = await super.parseContent();
        assert(res.title === 'Persons', 'Invalid widget');

        const infoTiles = await TilesList.create(this, await query(this.elem, '.info-tiles'), InfoTile);
        assert(infoTiles, 'Invalid persons widget');

        res.infoTiles = infoTiles;

        return res;
    }
}
