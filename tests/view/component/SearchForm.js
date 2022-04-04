import { AppComponent } from './AppComponent.js';

export class SearchForm extends AppComponent {
    async parseContent() {
        const res = {
            inputElem: await this.query(this.elem, '#search'),
            submitBtn: await this.query(this.elem, 'button.search_btn'),
            clearBtn: await this.query(this.elem, '#nosearchbtn'),
        };
        if (!res.inputElem || !res.submitBtn || !res.clearBtn) {
            throw new Error('Unexpected structure of search form');
        }

        res.value = await this.prop(res.inputElem, 'value');

        return res;
    }

    async input(val) {
        return this.environment.input(this.content.inputElem, val);
    }

    async submit() {
        return this.click(this.content.submitBtn);
    }

    async search(val) {
        await this.input(val);

        await this.submit();
    }

    async clear() {
        await this.click(this.content.clearBtn);
    }
}
