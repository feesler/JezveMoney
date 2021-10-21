import { AppComponent } from './AppComponent.js';
import { Tile } from './Tile.js';
import { DropDown } from './DropDown.js';

export class TileBlock extends AppComponent {
    async parseContent() {
        if (!this.elem) {
            throw new Error('Invalid tile block');
        }

        const res = {};

        const lbl = await this.query(this.elem, 'div > label');
        if (!lbl) {
            throw new Error('Tile block label not found');
        }
        res.label = await this.prop(lbl, 'textContent');

        res.tile = await Tile.create(this.parent, await this.query(this.elem, '.tile'));
        if (!res.tile) {
            throw new Error('Tile not found');
        }

        const ddElem = await this.query(this.elem, '.dd__container_attached');
        res.dropDown = await DropDown.create(this.parent, ddElem);

        return res;
    }

    async selectAccount(accountId) {
        if (this.content.dropDown) {
            await this.content.dropDown.setSelection(accountId);
        }
    }
}
