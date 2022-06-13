import {
    TestComponent,
    assert,
    query,
    prop,
} from 'jezve-test';
import { Tile } from './Tile.js';
import { DropDown } from './DropDown.js';

export class TileBlock extends TestComponent {
    async parseContent() {
        assert(this.elem, 'Invalid tile block');

        const res = {};

        const lbl = await query(this.elem, 'div > label');
        assert(lbl, 'Tile block label not found');
        res.label = await prop(lbl, 'textContent');

        res.tile = await Tile.create(this.parent, await query(this.elem, '.tile'));
        assert(res.tile, 'Tile not found');

        const ddElem = await query(this.elem, '.dd__container_attached');
        res.dropDown = await DropDown.create(this.parent, ddElem);

        return res;
    }

    async selectAccount(accountId) {
        if (this.content.dropDown) {
            await this.content.dropDown.setSelection(accountId);
        }
    }
}
