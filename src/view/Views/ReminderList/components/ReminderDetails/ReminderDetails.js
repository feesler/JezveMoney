import { __ } from '../../../../utils/utils.js';
import { App } from '../../../../Application/App.js';

import { Transaction } from '../../../../Models/Transaction.js';
import { Reminder } from '../../../../Models/Reminder.js';

import { Field } from '../../../../Components/Field/Field.js';
import { ItemDetails } from '../../../../Components/ItemDetails/ItemDetails.js';

/** CSS classes */
const SOURCE_FIELD_CLASS = 'source-field';
const DEST_FIELD_CLASS = 'destination-field';
const SRC_AMOUNT_FIELD_CLASS = 'src-amount-field';
const DEST_AMOUNT_FIELD_CLASS = 'dest-amount-field';
const DATE_FIELD_CLASS = 'date-field';
const CATEGORY_FIELD_CLASS = 'category-field';
const COMMENT_FIELD_CLASS = 'comment-field';

/**
 * Scheduled transaction reminder details component
 */
export class ReminderDetails extends ItemDetails {
    constructor(props = {}) {
        super({
            ...props,
            item: Reminder.createExtended(props.item),
        });
    }

    setItem(item) {
        this.setState({
            ...this.state,
            item: Reminder.createExtended(item),
        });
    }

    /** Component initialization */
    getContent() {
        this.sourceField = Field.create({
            title: __('TR_SOURCE'),
            className: SOURCE_FIELD_CLASS,
        });

        this.destinationField = Field.create({
            title: __('TR_DESTINATION'),
            className: DEST_FIELD_CLASS,
        });

        this.srcAmountField = Field.create({
            title: __('TR_SRC_AMOUNT'),
            className: SRC_AMOUNT_FIELD_CLASS,
        });

        this.destAmountField = Field.create({
            title: __('TR_DEST_AMOUNT'),
            className: DEST_AMOUNT_FIELD_CLASS,
        });

        this.dateField = Field.create({
            title: __('TR_DATE'),
            className: DATE_FIELD_CLASS,
        });

        this.categoryField = Field.create({
            title: __('TR_CATEGORY'),
            className: CATEGORY_FIELD_CLASS,
        });

        this.commentField = Field.create({
            title: __('TR_COMMENT'),
            className: COMMENT_FIELD_CLASS,
        });

        return [
            this.sourceField.elem,
            this.destinationField.elem,
            this.srcAmountField.elem,
            this.destAmountField.elem,
            this.dateField.elem,
            this.categoryField.elem,
            this.commentField.elem,
        ];
    }

    getAccountOrPerson(accountId) {
        const { profile, accounts, persons } = App.model;
        const account = accounts.getItem(accountId);
        if (!account) {
            return null;
        }
        if (account.owner_id === profile.owner_id) {
            return account.name;
        }

        const person = persons.getItem(account.owner_id);
        return person.name;
    }

    getCategoryTitle(state) {
        const { item } = state;
        if (item.category_id === 0) {
            return __('NO_CATEGORY');
        }

        const { categories } = App.model;
        const category = categories.getItem(item.category_id);
        if (!category) {
            throw new Error('Invalid category');
        }

        return category.name;
    }

    /**
     * Render specified state
     * @param {object} state - current state object
     */
    render(state) {
        const { item } = state;
        if (!item) {
            throw new Error('Invalid state');
        }

        const { currency } = App.model;
        const showSource = item.src_id !== 0;
        const showDest = item.dest_id !== 0;
        const isDiff = item.src_curr !== item.dest_curr;

        this.heading.setTitle(Transaction.getTypeTitle(item.type));

        this.sourceField.show(showSource);
        this.sourceField.setContent(this.getAccountOrPerson(item.src_id));

        this.destinationField.show(showDest);
        this.destinationField.setContent(this.getAccountOrPerson(item.dest_id));

        const srcAmount = currency.formatCurrency(item.src_amount, item.src_curr);
        this.srcAmountField.setContent(srcAmount);

        this.destAmountField.show(isDiff);
        const destAmount = (isDiff)
            ? currency.formatCurrency(item.dest_amount, item.dest_curr)
            : null;
        this.destAmountField.setContent(destAmount);

        this.renderDateField(this.dateField, item.date);

        const categoryTitle = this.getCategoryTitle(state);
        this.categoryField.setContent(categoryTitle);

        this.commentField.setContent(item.comment);

        this.renderDateField(this.createDateField, item.createdate);
        this.renderDateField(this.updateDateField, item.updatedate);
    }
}
