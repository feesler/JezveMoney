import { AppComponent } from './AppComponent.js';
import { Tile } from './Tile.js';
import { DropDown } from './DropDown.js';
import { query, prop } from '../../env.js';

export class TileBlock extends AppComponent {
    async parseContent() {
        if (!this.elem) {
            throw new Error('Invalid tile block');
        }

        const res = {};

        const lbl = await query(this.elem, 'div > label');
        if (!lbl) {
            throw new Error('Tile block label not found');
        }
        res.label = await prop(lbl, 'textContent');

        res.tile = await Tile.create(this.parent, await query(this.elem, '.tile'));
        if (!res.tile) {
            throw new Error('Tile not found');
        }

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
