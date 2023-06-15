import { createElement } from 'jezvejs';
import { __, formatPersonDebts } from '../../../../utils/utils.js';
import { App } from '../../../../Application/App.js';
import { Field } from '../../../../Components/Field/Field.js';
import { ItemDetails } from '../../../../Components/ItemDetails/ItemDetails.js';

/** CSS classes */
const DEBTS_FIELD_CLASS = 'debts-field';
const VISIBILITY_FIELD_CLASS = 'visibility-field';
const TR_COUNT_FIELD_CLASS = 'trans-count-field inline-field';
const VHIDDEN_CLASS = 'vhidden';

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

        this.transactionsField = Field.create({
            title: __('ITEM_TRANSACTIONS_COUNT'),
            className: TR_COUNT_FIELD_CLASS,
        });

        this.transactionsLink = createElement('a', {
            props: {
                className: 'transactions-link',
                textContent: __('ITEM_GO_TO_TRANSACTIONS'),
            },
        });

        return [
            this.debtsField.elem,
            this.visibilityField.elem,
            this.transactionsField.elem,
            this.transactionsLink,
        ];
    }

    renderDebts(person) {
        const debts = formatPersonDebts(person);
        const content = Array.isArray(debts)
            ? debts.map((item) => createElement('div', { props: { textContent: item } }))
            : debts;

        this.debtsField.setContent(content);
    }

    /** Returns URL to Transactions list view with filter by person */
    getTransactionsListURL(item) {
        const { baseURL } = App;
        const res = new URL(`${baseURL}transactions/`);
        res.searchParams.set('person_id', item.id);
        return res;
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

        // Title
        this.heading.setTitle(item.name);

        // List of debts
        this.renderDebts(item);

        // Visibility
        const visibililty = item.isVisible() ? __('ITEM_VISIBLE') : __('ITEM_HIDDEN');
        this.visibilityField.setContent(visibililty);

        // Transactions count
        const trCountLoaded = (typeof item.transactionsCount === 'number');
        const trCount = (trCountLoaded) ? item.transactionsCount.toString() : __('LOADING');
        this.transactionsField.setContent(trCount);

        // Navigate to transactions list link
        this.transactionsLink.href = this.getTransactionsListURL(item);
        this.transactionsLink.classList.toggle(VHIDDEN_CLASS, !trCountLoaded);

        // Create and update dates
        this.renderDateField(this.createDateField, item.createdate);
        this.renderDateField(this.updateDateField, item.updatedate);
    }
}
