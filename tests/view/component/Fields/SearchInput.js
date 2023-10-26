import { assert } from '@jezvejs/assert';
import {
    TestComponent,
    query,
    prop,
    input,
    click,
} from 'jezve-test';

export class SearchInput extends TestComponent {
    async parseContent() {
        const res = {
            inputElem: await query(this.elem, '.input-group__input'),
            clearBtn: await query(this.elem, '.clear-btn'),
        };
        assert(res.inputElem, 'Unexpected structure of search form');

        res.value = await prop(res.inputElem, 'value');

        return res;
    }

    get value() {
        return this.content.value;
    }

    async input(val) {
        return input(this.content.inputElem, val);
    }

    async clear() {
        assert(this.content.clearBtn, 'Clear button not available');

        await click(this.content.clearBtn);
    }
}
