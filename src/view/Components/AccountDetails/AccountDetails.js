import { __ } from '../../js/utils.js';
import { Field } from '../Field/Field.js';
import { ItemDetails } from '../ItemDetails/ItemDetails.js';

/** CSS classes */
const BALANCE_FIELD_CLASS = 'balance-field';
const INITIAL_BALANCE_FIELD_CLASS = 'initbalance-field';
const VISIBILITY_FIELD_CLASS = 'visibility-field';

/**
 * Account details component
 */
export class AccountDetails extends ItemDetails {
    /** Component initialization */
    getContent() {
        this.initBalanceField = Field.create({
            title: __('ACCOUNT_INITIAL_BALANCE'),
            className: INITIAL_BALANCE_FIELD_CLASS,
        });

        this.balanceField = Field.create({
            title: __('ACCOUNT_CURRENT_BALANCE'),
            className: BALANCE_FIELD_CLASS,
        });

        this.visibilityField = Field.create({
            title: __('ITEM_VISIBILITY'),
            className: VISIBILITY_FIELD_CLASS,
        });

        return [
            this.balanceField.elem,
            this.initBalanceField.elem,
            this.visibilityField.elem,
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
        const { currency } = window.app.model;

        this.heading.setTitle(item.name);

        this.initBalanceField.setContent(
            currency.formatCurrency(item.initbalance, item.curr_id),
        );
        this.balanceField.setContent(
            currency.formatCurrency(item.balance, item.curr_id),
        );

        const visibililty = item.isVisible() ? __('ITEM_VISIBLE') : __('ITEM_HIDDEN');
        this.visibilityField.setContent(visibililty);

        this.renderDateField(this.createDateField, item.createdate);
        this.renderDateField(this.updateDateField, item.updatedate);
    }
}
