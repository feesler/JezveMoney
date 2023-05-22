import { __, timeToDate } from '../../../../utils/utils.js';

import { Transaction } from '../../../../Models/Transaction.js';
import { ScheduledTransaction } from '../../../../Models/ScheduledTransaction.js';

import { Field } from '../../../../Components/Field/Field.js';
import { ItemDetails } from '../../../../Components/ItemDetails/ItemDetails.js';

/** CSS classes */
const SOURCE_FIELD_CLASS = 'source-field';
const DEST_FIELD_CLASS = 'destination-field';
const SRC_AMOUNT_FIELD_CLASS = 'src-amount-field';
const DEST_AMOUNT_FIELD_CLASS = 'dest-amount-field';
const START_DATE_FIELD_CLASS = 'start-date-field';
const END_DATE_FIELD_CLASS = 'end-date-field';
const INTERVAL_FIELD_CLASS = 'interval-field';
const OFFSET_FIELD_CLASS = 'offset-field';
const CATEGORY_FIELD_CLASS = 'category-field';
const COMMENT_FIELD_CLASS = 'comment-field';

/**
 * Scheduled transaction details component
 */
export class ScheduleItemDetails extends ItemDetails {
    constructor(props = {}) {
        super({
            ...props,
            item: ScheduledTransaction.create(props.item),
        });
    }

    setItem(item) {
        this.setState({
            ...this.state,
            item: ScheduledTransaction.create(item),
        });
    }

    /** Component initialization */
    getContent() {
        // Schedule
        this.startDateField = Field.create({
            title: __('SCHED_TR_START_DATE'),
            className: START_DATE_FIELD_CLASS,
        });

        this.endDateField = Field.create({
            title: __('SCHED_TR_END_DATE'),
            className: END_DATE_FIELD_CLASS,
        });

        this.intervalField = Field.create({
            title: __('SCHED_TR_INTERVAL'),
            className: INTERVAL_FIELD_CLASS,
        });

        this.offsetField = Field.create({
            title: __('SCHED_TR_OFFSET'),
            className: OFFSET_FIELD_CLASS,
        });

        // Main content
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

        this.categoryField = Field.create({
            title: __('TR_CATEGORY'),
            className: CATEGORY_FIELD_CLASS,
        });

        this.commentField = Field.create({
            title: __('TR_COMMENT'),
            className: COMMENT_FIELD_CLASS,
        });

        return [
            this.startDateField.elem,
            this.endDateField.elem,
            this.intervalField.elem,
            this.offsetField.elem,
            this.sourceField.elem,
            this.destinationField.elem,
            this.srcAmountField.elem,
            this.destAmountField.elem,
            this.categoryField.elem,
            this.commentField.elem,
        ];
    }

    getAccountOrPerson(accountId) {
        const { profile, accounts, persons } = window.app.model;
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

        const { categories } = window.app.model;
        const category = categories.getItem(item.category_id);
        if (!category) {
            throw new Error('Invalid category');
        }

        return category.name;
    }

    renderEndDate(item) {
        return (item.end_date)
            ? __('SCHEDULE_ITEM_END', window.app.formatDate(timeToDate(item.end_date)))
            : __('SCHED_TR_NO_END_DATE');
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

        const { currency } = window.app.model;
        const showSource = item.src_id !== 0;
        const showDest = item.dest_id !== 0;
        const isDiff = item.src_curr !== item.dest_curr;

        this.heading.setTitle(Transaction.getTypeTitle(item.type));

        // Schedule
        this.renderDateField(this.startDateField, item.start_date);
        this.endDateField.setContent(this.renderEndDate(item));
        this.intervalField.setContent(item.renderInterval());
        this.offsetField.setContent(item.renderIntervalOffset());

        // Transaction
        this.destinationField.show(showSource);
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

        const categoryTitle = this.getCategoryTitle(state);
        this.categoryField.setContent(categoryTitle);

        this.commentField.setContent(item.comment);

        this.renderDateField(this.createDateField, item.createdate);
        this.renderDateField(this.updateDateField, item.updatedate);
    }
}
