import { enable, getClassName } from '@jezvejs/dom';

import { __ } from '../../../../utils/utils.js';
import { App } from '../../../../Application/App.js';

import { ImportTransaction, typeNames } from '../../../../Models/ImportTransaction.js';

import { CollapsibleListItem } from '../../../../Components/List/CollapsibleListItem/CollapsibleListItem.js';
import { Field } from '../../../../Components/Common/Field/Field.js';
import { ReminderField } from '../../../../Components/Reminder/ReminderField/ReminderField.js';
import { OriginalImportData } from '../OriginalData/OriginalImportData.js';
import { SimilarTransactionInfo } from '../SimilarTransactionInfo/SimilarTransactionInfo.js';

import './ImportTransactionItem.scss';

/** CSS classes */
const CONTAINER_CLASS = 'import-item';
const COLUMN_CLASS = 'item-column';
const AMOUNT_COLUMN_CLASS = 'amount-col';
const DATE_COLUMN_CLASS = 'date-col';
const TYPE_COLUMN_CLASS = 'type-col';
const COMMENT_COLUMN_CLASS = 'comment-col';
/* Fields */
const TYPE_FIELD_CLASS = 'type-field';
const ACCOUNT_FIELD_CLASS = 'account-field';
const PERSON_FIELD_CLASS = 'person-field';
const SRC_AMOUNT_FIELD_CLASS = 'amount-field src-amount-field';
const DEST_AMOUNT_FIELD_CLASS = 'amount-field dest-amount-field';
const DATE_FIELD_CLASS = 'date-field';
const CATEGORY_FIELD_CLASS = 'category-field';
const COMMENT_FIELD_CLASS = 'comment-field';

/**
 * Import transaction form component
 */
export class ImportTransactionItem extends CollapsibleListItem {
    constructor(props) {
        if (!props?.item?.mainAccount) {
            throw new Error('Invalid props');
        }

        super({
            ...props,
            item: new ImportTransaction(props.item),
            className: getClassName(CONTAINER_CLASS, props.className),
            toggleOnClick: false,
            animated: true,
        });
    }

    init() {
        super.init();
        const { createContainer } = App;

        const fields = [
            [__('transactions.type'), TYPE_FIELD_CLASS],
            [__('transactions.sourceAccount'), ACCOUNT_FIELD_CLASS],
            [__('transactions.sourcePerson'), PERSON_FIELD_CLASS],
            [__('transactions.amount'), SRC_AMOUNT_FIELD_CLASS],
            [__('transactions.destAmount'), DEST_AMOUNT_FIELD_CLASS],
            [__('transactions.date'), DATE_FIELD_CLASS],
            [__('transactions.category'), CATEGORY_FIELD_CLASS],
            [__('transactions.comment'), COMMENT_FIELD_CLASS],
        ];

        [
            this.trTypeField,
            this.accountField,
            this.personField,
            this.srcAmountField,
            this.destAmountField,
            this.dateField,
            this.categoryField,
            this.commentField,
        ] = fields.map(([title, className]) => Field.create({ title, className }));

        this.contentElem.append(
            createContainer([COLUMN_CLASS, TYPE_COLUMN_CLASS], [
                this.trTypeField.elem,
                this.accountField.elem,
                this.personField.elem,
            ]),
            createContainer([COLUMN_CLASS, AMOUNT_COLUMN_CLASS], [
                this.srcAmountField.elem,
                this.destAmountField.elem,
            ]),
            createContainer([COLUMN_CLASS, DATE_COLUMN_CLASS], [
                this.dateField.elem,
                this.categoryField.elem,
            ]),
            createContainer([COLUMN_CLASS, COMMENT_COLUMN_CLASS], [
                this.commentField.elem,
            ]),
        );
    }

    renderReminder(state, prevState) {
        const { item } = state;

        if (
            (App.model.schedule.length === 0)
            || (!item.reminderId && !item.scheduleId)
        ) {
            this.reminderField = null;
            return null;
        }

        const prevItem = prevState?.item;
        if (
            item.reminderId === prevItem?.reminderId
            && item.scheduleId === prevItem?.scheduleId
            && item.reminderDate === prevItem?.reminderDate
        ) {
            return this.reminderField;
        }

        if (!this.reminderField) {
            this.reminderField = ReminderField.create({
                title: __('transactions.reminder'),
                selectButton: false,
                closeButton: false,
            });
        }

        this.reminderField.setState((fieldState) => ({
            ...fieldState,
            reminder_id: item.reminderId,
            schedule_id: item.scheduleId,
            reminder_date: item.reminderDate,
        }));
        this.reminderField.show();

        return this.reminderField;
    }

    renderContainer(state, prevState) {
        const { item } = state;
        const prevItem = prevState?.item ?? null;

        const originalData = state.item.originalData ?? null;
        if (
            item.reminderId === prevItem?.reminderId
            && item.reminderDate === prevItem?.reminderDate
            && item.scheduleId === prevItem?.scheduleId
            && originalData === prevItem?.originalData
        ) {
            return;
        }

        const hasReminder = !!(item.reminderId || item.scheduleId);
        if (!originalData && !hasReminder) {
            this.setCollapsibleContent(null);
            return;
        }

        const content = [];

        // Original imported data
        if (originalData) {
            const origData = OriginalImportData.create(originalData);
            content.push(origData.elem);
        }

        // Similar transaction
        const { similarTransaction } = state.item;
        if (originalData && similarTransaction) {
            const info = SimilarTransactionInfo.create(similarTransaction);
            content.push(info.elem);
        }

        // Reminder
        const reminder = this.renderReminder(state, prevState);
        if (reminder) {
            content.push(reminder.elem);
        }

        this.setCollapsibleContent(content);
    }

    renderContent(state) {
        const { item } = state;
        const isDiff = item.isDiff();
        const { userAccounts, persons, currency } = App.model;
        const isTransfer = ['transfer_out', 'transfer_in'].includes(item.type);
        const isDebt = ['debt_out', 'debt_in'].includes(item.type);

        enable(this.elem, item.enabled);

        // Type field
        if (!(item.type in typeNames)) {
            throw new Error('Invalid transaction type');
        }
        this.trTypeField.setContent(typeNames[item.type]);
        this.trTypeField.elem.dataset.type = item.type;

        // Account field
        this.accountField.show(isTransfer);
        if (isTransfer) {
            const isTransferOut = item.type === 'transfer_out';
            const accountId = (isTransferOut)
                ? item.destAccountId
                : item.sourceAccountId;
            const account = userAccounts.getItem(accountId);
            this.accountField.setContent(account.name);

            const accountTitle = (isTransferOut)
                ? __('transactions.destAccount')
                : __('transactions.sourceAccount');
            this.accountField.setTitle(accountTitle);
        }
        // Person field
        this.personField.show(isDebt);
        if (isDebt) {
            const personTitle = (item.type === 'debt_in')
                ? __('transactions.sourcePerson')
                : __('transactions.destPerson');
            this.personField.setTitle(personTitle);

            const person = persons.getItem(item.personId);
            this.personField.setContent(person.name);
        }

        // Amount fields
        const srcAmountLabel = (isDiff)
            ? __('transactions.sourceAmount')
            : __('transactions.amount');
        this.srcAmountField.setTitle(srcAmountLabel);
        const srcAmount = currency.formatCurrency(item.sourceAmount, item.srcCurrId);
        this.srcAmountField.setContent(srcAmount);

        this.srcAmountField.elem.dataset.amount = item.sourceAmount;
        this.srcAmountField.elem.dataset.curr = item.srcCurrId;

        this.destAmountField.show(isDiff);
        const destAmount = (isDiff)
            ? currency.formatCurrency(item.destAmount, item.destCurrId)
            : '';
        this.destAmountField.setContent(destAmount);

        this.destAmountField.elem.dataset.amount = item.destAmount;
        this.destAmountField.elem.dataset.curr = item.destCurrId;

        // Date field
        this.dateField.setContent(item.date);

        // Category field
        if (item.categoryId === 0) {
            this.categoryField.setContent('');
        } else {
            const { categories } = App.model;
            const category = categories.getItem(item.categoryId);
            if (!category) {
                throw new Error('invalid category');
            }

            this.categoryField.setContent(category.name);
        }
        this.categoryField.show(item.categoryId !== 0);

        // Comment field
        const hasComment = item.comment.length > 0;
        this.commentField.show(hasComment);
        this.commentField.setContent(item.comment);
    }

    /** Render component */
    render(state, prevState = {}) {
        super.render(state, prevState);

        const type = ImportTransaction.getTargetType(state.item.type);
        this.elem.setAttribute('data-type', type);
        this.elem.setAttribute('data-group', state.item.date);

        this.renderContainer(state, prevState);
    }
}
