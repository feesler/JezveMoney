import { createElement } from 'jezvejs';
import { __ } from '../../../../js/utils.js';
import { Field } from '../../../../Components/Field/Field.js';
import { ItemDetails } from '../../../../Components/ItemDetails/ItemDetails.js';
import { accountTypes, ACCOUNT_TYPE_CREDIT_CARD } from '../../../../js/model/Account.js';

/** CSS classes */
const TYPE_FIELD_CLASS = 'type-field';
const BALANCE_FIELD_CLASS = 'balance-field';
const INITIAL_BALANCE_FIELD_CLASS = 'initbalance-field';
const INITIAL_LIMIT_FIELD_CLASS = 'initlimit-field';
const LIMIT_FIELD_CLASS = 'limit-field';
const VISIBILITY_FIELD_CLASS = 'visibility-field';
const TR_COUNT_FIELD_CLASS = 'trans-count-field inline-field';
const VHIDDEN_CLASS = 'vhidden';

/**
 * Account details component
 */
export class AccountDetails extends ItemDetails {
    /** Component initialization */
    getContent() {
        this.typeField = Field.create({
            title: __('ACCOUNT_TYPE'),
            className: TYPE_FIELD_CLASS,
        });

        this.initBalanceField = Field.create({
            title: __('ACCOUNT_INITIAL_BALANCE'),
            className: INITIAL_BALANCE_FIELD_CLASS,
        });

        this.balanceField = Field.create({
            title: __('ACCOUNT_CURRENT_BALANCE'),
            className: BALANCE_FIELD_CLASS,
        });

        this.initLimitField = Field.create({
            title: __('ACCOUNT_INITIAL_CREDIT_LIMIT'),
            className: INITIAL_LIMIT_FIELD_CLASS,
        });

        this.limitField = Field.create({
            title: __('ACCOUNT_CREDIT_LIMIT'),
            className: LIMIT_FIELD_CLASS,
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
            this.typeField.elem,
            this.balanceField.elem,
            this.initBalanceField.elem,
            this.limitField.elem,
            this.initLimitField.elem,
            this.visibilityField.elem,
            this.transactionsField.elem,
            this.transactionsLink,
        ];
    }

    /** Returns URL to Transactions list view with filter by account */
    getTransactionsListURL(item) {
        const { baseURL } = window.app;
        const res = new URL(`${baseURL}transactions/`);
        res.searchParams.set('acc_id', item.id);
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
        const { currency } = window.app.model;

        // Title
        this.heading.setTitle(item.name);

        // Type
        if (typeof accountTypes[item.type] !== 'string') {
            throw new Error('Invalid account type');
        }
        this.typeField.setContent(accountTypes[item.type]);

        // Initial balance
        this.initBalanceField.setContent(
            currency.formatCurrency(item.initbalance, item.curr_id),
        );

        // Current balance
        this.balanceField.setContent(
            currency.formatCurrency(item.balance, item.curr_id),
        );

        // Credit limit
        const isCreditCard = item.type === ACCOUNT_TYPE_CREDIT_CARD;
        this.limitField.show(isCreditCard);
        this.initLimitField.show(isCreditCard);
        if (isCreditCard) {
            this.limitField.setContent(
                currency.formatCurrency(item.limit, item.curr_id),
            );
            this.initLimitField.setContent(
                currency.formatCurrency(item.initlimit, item.curr_id),
            );
        }

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
