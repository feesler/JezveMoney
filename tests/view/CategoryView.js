import {
    assert,
    query,
    prop,
    navigation,
    click,
    evaluate,
} from 'jezve-test';
import { DropDown, Button } from 'jezvejs-test';
import { AppView } from './AppView.js';
import { InputField } from './component/Fields/InputField.js';
import { DeleteCategoryDialog } from './component/Category/DeleteCategoryDialog.js';
import { App } from '../Application.js';
import { Category } from '../model/Category.js';

/** Create or update category test view */
export class CategoryView extends AppView {
    static getExpectedState(model, state = App.state) {
        const minParentItems = (model.isUpdate) ? 1 : 0;
        const showParent = App.state.categories.length > minParentItems;
        const topCategories = App.state.categories
            .findByParent(0)
            .filter((category) => category.id !== model.id)
            .map((category) => ({ id: category.id.toString() }));
        const availParentCategories = [{ id: '0' }, ...topCategories];

        const res = {
            header: this.getHeaderExpectedState(state),
            nameInput: {
                visible: true,
                value: model.name.toString(),
                isInvalid: model.invalidated ?? false,
            },
            colorInput: {
                visible: true,
                disabled: model.parent_id !== 0,
                value: model.color.toString(),
                isInvalid: model.colorInvalidated ?? false,
            },
            parentSelect: {
                visible: showParent,
                value: model.parent_id.toString(),
                items: availParentCategories,
            },
            typeSelect: {
                visible: true,
                disabled: model.parent_id !== 0,
                value: model.type.toString(),
            },
        };

        if (model.isUpdate) {
            res.id = model.id;
        }

        return res;
    }

    get isUpdate() {
        return this.model.isUpdate;
    }

    async parseContent() {
        const res = {};

        res.headingElem = await query('.heading > h1');
        assert(res.headingElem, 'Heading element not found');
        res.heading = await prop(res.headingElem, 'textContent');

        res.formElem = await query('form');
        assert(res.formElem, 'Form element not found');

        const categoryIdInp = await query('#categoryId');
        res.isUpdate = !!categoryIdInp;
        if (res.isUpdate) {
            const value = await prop(categoryIdInp, 'value');
            res.id = parseInt(value, 10);
            assert(res.id, 'Wrong category id');
        }

        res.deleteBtn = await Button.create(this, await query('#deleteBtn'));

        res.nameInput = await InputField.create(this, await query('#nameField'));
        assert(res.nameInput, 'Category name input not found');

        res.colorInput = await InputField.create(this, await query('#colorField'));
        assert(res.colorInput, 'Category color input not found');

        res.parentSelect = await DropDown.createFromChild(this, await query('#parent'));
        res.typeSelect = await DropDown.createFromChild(this, await query('#type'));

        res.submitBtn = await query('.form-controls .submit-btn');
        assert(res.submitBtn, 'Submit button not found');

        res.cancelBtn = await query('.form-controls .cancel-btn');
        assert(res.cancelBtn, 'Cancel button not found');

        res.delete_warning = await DeleteCategoryDialog.create(
            this,
            await query('#delete_warning'),
        );

        return res;
    }

    buildModel(cont) {
        const res = {
            locale: cont.locale,
            isUpdate: cont.isUpdate,
            name: cont.nameInput.value,
            color: cont.colorInput.value,
            parent_id: parseInt(cont.parentSelect.value, 10),
            type: parseInt(cont.typeSelect.value, 10),
            invalidated: cont.nameInput.isInvalid,
            colorInvalidated: cont.colorInput.isInvalid,
        };

        if (res.isUpdate) {
            res.id = cont.id;
        }

        return res;
    }

    getExpectedCategory(model = this.model) {
        const res = {
            name: model.name,
            color: model.color,
            parent_id: model.parent_id,
            type: model.type,
        };

        if (model.isUpdate) {
            res.id = model.id;
        }

        return res;
    }

    getExpectedState(model = this.model) {
        return CategoryView.getExpectedState(model);
    }

    isValid() {
        // Check empty name
        if (this.model.name.length === 0) {
            return false;
        }

        // Check no categories with the same name
        const category = App.state.categories.findByName(this.model.name);
        if (category && this.model.id !== category.id) {
            return false;
        }

        // Check color not used by other category
        const colorItems = App.state.categories.findByColor(this.model.color);
        if (colorItems?.length > 0 && this.model.id !== colorItems[0].id) {
            return false;
        }

        return true;
    }

    async clickDeleteButton() {
        assert(this.content.isUpdate && this.content.deleteBtn, 'Unexpected action clickDeleteButton');

        return this.performAction(() => this.content.deleteBtn.click());
    }

    /** Click on delete button and confirm wanring popup */
    async deleteSelfItem(removeChildren = true) {
        await this.clickDeleteButton();

        assert(this.content.delete_warning?.content?.visible, 'Delete category warning popup not appear');

        if (removeChildren !== this.content.delete_warning.removeChildren) {
            await this.content.delete_warning.toggleDeleteChilds();
        }

        await navigation(() => this.content.delete_warning.clickOk());
    }

    async inputName(val) {
        this.model.name = val.toString();
        this.model.invalidated = false;
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.nameInput.input(val));

        return this.checkState(expected);
    }

    async inputColor(val) {
        this.model.color = val.toString();
        this.model.colorInvalidated = false;
        const expected = this.getExpectedState();

        await this.performAction(() => (
            evaluate((el, value) => {
                const input = el;
                input.value = value.toString();
                const event = new InputEvent('input', {
                    bubbles: true,
                    cancelable: true,
                });

                input.dispatchEvent(event);
            }, this.content.colorInput.content.valueInput, val)
        ));

        return this.checkState(expected);
    }

    async selectParentCategory(val) {
        const categoryId = parseInt(val, 10);
        const category = App.state.categories.getItem(categoryId);
        if (categoryId !== 0) {
            assert(category, `Invalid category: ${val}`);
        }

        this.model.parent_id = categoryId;
        if (categoryId !== 0) {
            this.model.type = category.type;
            this.model.color = category.color;
        }
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.parentSelect.setSelection(val));

        return this.checkState(expected);
    }

    async selectType(val) {
        const type = parseInt(val, 10);
        assert(Category.availTypes.includes(type), `Invalid type: ${val}`);

        this.model.type = type;
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.typeSelect.setSelection(val));

        return this.checkState(expected);
    }

    async submit() {
        const action = () => click(this.content.submitBtn);

        if (this.isValid()) {
            await navigation(action);
        } else {
            await this.performAction(action);
        }
    }

    async cancel() {
        await navigation(() => click(this.content.cancelBtn));
    }
}
