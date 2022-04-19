import { AppComponent } from './AppComponent.js';
import {
    query,
    prop,
    input,
    click,
} from '../../env.js';

export class SearchForm extends AppComponent {
    async parseContent() {
        const res = {
            inputElem: await query(this.elem, '#search'),
            submitBtn: await query(this.elem, 'button.search_btn'),
            clearBtn: await query(this.elem, '#nosearchbtn'),
        };
        if (!res.inputElem || !res.submitBtn || !res.clearBtn) {
            throw new Error('Unexpected structure of search form');
        }

        res.value = await prop(res.inputElem, 'value');

        return res;
    }

    async input(val) {
        return input(this.content.inputElem, val);
    }

    async submit() {
        return click(this.content.submitBtn);
    }

    async search(val) {
        await this.input(val);

        await this.submit();
    }

    async clear() {
        await click(this.content.clearBtn);
    }
}
