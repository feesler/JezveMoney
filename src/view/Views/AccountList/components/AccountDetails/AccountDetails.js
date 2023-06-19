import { createElement } from 'jezvejs';

import { __, getApplicationURL } from '../../../../utils/utils.js';
import { App } from '../../../../Application/App.js';

import { accountTypes, ACCOUNT_TYPE_CREDIT_CARD } from '../../../../Models/Account.js';

import { Field } from '../../../../Components/Fields/Field/Field.js';
import { ItemDetails } from '../../../../Components/ItemDetails/ItemDetails.js';

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
            title: __('accounts.type'),
            className: TYPE_FIELD_CLASS,
        });

        this.initBalanceField = Field.create({
            title: __('accounts.initialBalance'),
            className: INITIAL_BALANCE_FIELD_CLASS,
        });

        this.balanceField = Field.create({
            title: __('accounts.currentBalance'),
            className: BALANCE_FIELD_CLASS,
        });

        this.initLimitField = Field.create({
            title: __('accounts.initialCreditLimit'),
            className: INITIAL_LIMIT_FIELD_CLASS,
        });

        this.limitField = Field.create({
            title: __('accounts.creditLimit'),
            className: LIMIT_FIELD_CLASS,
        });

        this.visibilityField = Field.create({
            title: __('item.visibility'),
            className: VISIBILITY_FIELD_CLASS,
        });

        this.transactionsField = Field.create({
            title: __('item.transactionsCount'),
            className: TR_COUNT_FIELD_CLASS,
        });

        this.transactionsLink = createElement('a', {
            props: {
                className: 'transactions-link',
                textContent: __('item.goToTransactions'),
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
        return getApplicationURL('transactions/', { accounts: [item.id] });
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
        const { currency } = App.model;

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
        const visibililty = item.isVisible() ? __('item.visible') : __('item.hidden');
        this.visibilityField.setContent(visibililty);

        // Transactions count
        const trCountLoaded = (typeof item.transactionsCount === 'number');
        const trCount = (trCountLoaded) ? item.transactionsCount.toString() : __('loading');
        this.transactionsField.setContent(trCount);

        // Navigate to transactions list link
        this.transactionsLink.href = this.getTransactionsListURL(item);
        this.transactionsLink.classList.toggle(VHIDDEN_CLASS, !trCountLoaded);

        // Create and update dates
        this.renderDateField(this.createDateField, item.createdate);
        this.renderDateField(this.updateDateField, item.updatedate);
    }
}
