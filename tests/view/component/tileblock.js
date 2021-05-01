import { TestComponent } from 'jezve-test';
import { Tile } from './tile.js';
import { DropDown } from './dropdown.js';

export class TileBlock extends TestComponent {
    async parse() {
        const lbl = await this.query(this.elem, 'div > label');
        if (!lbl) {
            throw new Error('Tile block label not found');
        }
        this.label = await this.prop(lbl, 'textContent');

        this.tile = await Tile.create(this.parent, await this.query(this.elem, '.tile'));
        if (!this.tile) {
            throw new Error('Tile not found');
        }

        const ddElem = await this.query(this.elem, '.dd__container_attached');
        this.dropDown = await DropDown.create(this.parent, ddElem);
    }

    async selectAccount(accountId) {
        if (this.dropDown) {
            await this.dropDown.setSelection(accountId);
        }
    }
}
