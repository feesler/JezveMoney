import { TestComponent } from 'jezve-test';

export class SearchForm extends TestComponent {
    async parse() {
        this.inputElem = await this.query(this.elem, '#search');
        this.submitBtn = await this.query(this.elem, 'button.search_btn');
        this.clearBtn = await this.query(this.elem, '#nosearchbtn');
        if (!this.inputElem || !this.submitBtn || !this.clearBtn) {
            throw new Error('Unexpected structure of search form');
        }

        this.value = await this.prop(this.inputElem, 'value');
    }

    async input(val) {
        return this.environment.input(this.inputElem, val);
    }

    async submit() {
        return this.click(this.submitBtn);
    }

    async search(val) {
        await this.input(val);

        await this.submit();
    }

    async clear() {
        await this.click(this.clearBtn);
    }
}
