import { createElement } from 'jezvejs';
import { __, formatPersonDebts } from '../../js/utils.js';
import { Field } from '../Field/Field.js';
import { ItemDetails } from '../ItemDetails/ItemDetails.js';

/** CSS classes */
const DEBTS_FIELD_CLASS = 'debts-field';
const VISIBILITY_FIELD_CLASS = 'visibility-field';

/**
 * Person details component
 */
export class PersonDetails extends ItemDetails {
    /** Component initialization */
    getContent() {
        this.debtsField = Field.create({
            title: __('PERSON_DEBTS'),
            className: DEBTS_FIELD_CLASS,
        });

        this.visibilityField = Field.create({
            title: __('ITEM_VISIBILITY'),
            className: VISIBILITY_FIELD_CLASS,
        });

        return [
            this.debtsField.elem,
            this.visibilityField.elem,
        ];
    }

    renderDebts(person) {
        const debts = formatPersonDebts(person);
        const content = Array.isArray(debts)
            ? debts.map((item) => createElement('div', { props: { textContent: item } }))
            : debts;

        this.debtsField.setContent(content);
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

        this.renderDebts(item);

        const visibililty = item.isVisible() ? __('ITEM_VISIBLE') : __('ITEM_HIDDEN');
        this.visibilityField.setContent(visibililty);

        this.renderDateField(this.createDateField, item.createdate);
        this.renderDateField(this.updateDateField, item.updatedate);
    }
}
