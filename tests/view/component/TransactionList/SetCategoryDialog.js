import { assert } from '@jezvejs/assert';
import {
    TestComponent,
    click,
    query,
} from 'jezve-test';
import { DropDown } from 'jezvejs-test';

export class SetCategoryDialog extends TestComponent {
    async parseContent() {
        const res = {
            titleElem: await query(this.elem, '.popup__title'),
            submitBtn: { elem: await query(this.elem, '.popup__footer .submit-btn') },
            cancelBtn: { elem: await query(this.elem, '.popup__footer .cancel-btn') },
            categorySelect: await DropDown.create(this, await query(this.elem, '.dd__container')),
        };

        return res;
    }

    get categorySelect() {
        return this.content.categorySelect;
    }

    get value() {
        return this.categorySelect?.value;
    }

    get items() {
        return this.categorySelect?.model.items;
    }

    get submitBtn() {
        return this.content.submitBtn;
    }

    get cancelBtn() {
        return this.content.cancelBtn;
    }

    async selectCategory(categoryId) {
        assert(this.categorySelect, 'Category select not found');
        return this.categorySelect.setSelection(categoryId);
    }

    async selectCategoryAndSubmit(categoryId) {
        await this.selectCategory(categoryId);
        return this.submit();
    }

    async submit() {
        assert(this.submitBtn.elem, 'Submit button not found');
        return click(this.submitBtn.elem);
    }

    async cancel() {
        assert(this.cancelBtn.elem, 'Cancel button not found');
        return click(this.cancelBtn.elem);
    }
}
