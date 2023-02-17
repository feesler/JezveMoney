import {
    TestComponent,
    assert,
    query,
    prop,
} from 'jezve-test';
import { DropDown } from 'jezvejs-test';
import { Tile } from './Tile.js';

export class TileBlock extends TestComponent {
    get dropDown() {
        return this.content.dropDown;
    }

    get tile() {
        return this.content.tile;
    }

    async parseContent() {
        const res = {};

        const lbl = await query(this.elem, '.field__title span');
        assert(lbl, 'Tile block label not found');
        res.label = await prop(lbl, 'textContent');

        res.tile = await Tile.create(this.parent, await query(this.elem, '.tile'));
        assert(res.tile, 'Tile not found');

        const ddElem = await query(this.elem, '.dd__container_attached');
        res.dropDown = await DropDown.create(this.parent, ddElem);

        return res;
    }

    async selectAccount(accountId) {
        if (!this.dropDown) {
            return;
        }

        await this.dropDown.setSelection(accountId);
    }
}
