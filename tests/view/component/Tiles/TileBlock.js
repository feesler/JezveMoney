import {
    TestComponent,
    assert,
    query,
    evaluate,
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
        const res = await evaluate((el) => ({
            label: el?.querySelector('.field__title span')?.textContent,
        }), this.elem);
        assert(res.label, 'Tile block label not found');

        res.tile = await Tile.create(this.parent, await query(this.elem, '.tile'));
        assert(res.tile, 'Tile not found');

        const ddElem = await query(this.elem, '.dd__container_attached');
        res.dropDown = await DropDown.create(this.parent, ddElem);

        return res;
    }

    async selectAccount(accountId) {
        assert(this.dropDown, 'DropDown is not available');
        return this.dropDown.setSelection(accountId);
    }
}
