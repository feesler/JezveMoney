import { Category } from '../../js/model/Category.js';
import { __ } from '../../js/utils.js';
import { Field } from '../Field/Field.js';
import { ItemDetails } from '../ItemDetails/ItemDetails.js';

/** CSS classes */
const PARENT_FIELD_CLASS = 'parent-field';
const TYPE_FIELD_CLASS = 'type-field';

/**
 * Category details component
 */
export class CategoryDetails extends ItemDetails {
    /** Component initialization */
    getContent() {
        this.parentField = Field.create({
            title: __('CATEGORY_PARENT'),
            className: PARENT_FIELD_CLASS,
        });

        this.typeField = Field.create({
            title: __('CATEGORY_TR_TYPE'),
            className: TYPE_FIELD_CLASS,
        });

        return [
            this.parentField.elem,
            this.typeField.elem,
        ];
    }

    /**
     * Render specified state
     * @param {object} state - current state object
     */
    render(state) {
        if (!state?.item) {
            throw new Error('Invalid state');
        }

        const { item } = state;

        this.heading.setTitle(item.name);

        const { categories } = window.app.model;
        const parent = categories.getItem(item.parent_id);
        const parentTitle = (parent) ? parent.name : __('CATEGORY_NO_PARENT');
        this.parentField.setContent(parentTitle);

        this.typeField.setContent(Category.getTypeTitle(item.type));

        this.renderDateField(this.createDateField, item.createdate);
        this.renderDateField(this.updateDateField, item.updatedate);
    }
}
