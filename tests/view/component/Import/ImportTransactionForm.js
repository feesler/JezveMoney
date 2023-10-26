import { assert } from '@jezvejs/assert';
import {
    TestComponent,
    query,
    click,
    input,
    asyncMap,
    evaluate,
    waitForFunction,
} from 'jezve-test';
import { Collapsible, DropDown } from 'jezvejs-test';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    LIMIT_CHANGE,
} from '../../../model/Transaction.js';
import { ImportTransaction } from '../../../model/ImportTransaction.js';
import {
    normalize,
    fixFloat,
    dateStringToSeconds,
    trimToDigitsLimit,
} from '../../../common.js';
import { App } from '../../../Application.js';
import { OriginalImportData } from './OriginalImportData.js';
import { ACCOUNT_TYPE_CREDIT_CARD } from '../../../model/AccountsList.js';
import { __ } from '../../../model/locale.js';
import { ReminderField } from '../Fields/ReminderField.js';
import { SelectReminderDialog } from '../Reminder/SelectReminderDialog.js';
import { REMINDER_SCHEDULED } from '../../../model/Reminder.js';

const sourceTransactionTypes = ['expense', 'transfer_out', 'debt_out'];

const fieldSelectors = [
    '.type-field',
    '.account-field',
    '.person-field',
    '.src-amount-field',
    '.dest-amount-field',
    '.date-field',
    '.category-field',
    '.comment-field',
];

/**
 * Import transaction form test component
 */
export class ImportTransactionForm extends TestComponent {
    static getExpectedState(model) {
        const isExpense = (model.type === 'expense');
        const isIncome = (model.type === 'income');
        const isTransfer = (model.type === 'transfer_out' || model.type === 'transfer_in');
        const isDebt = (model.type === 'debt_out' || model.type === 'debt_in');
        const isLimit = (model.type === 'limit');
        const isCreditCard = (model.mainAccount.type === ACCOUNT_TYPE_CREDIT_CARD);

        const visibleTypes = ImportTransaction.availTypes.filter((item) => (
            item.id !== 'limit' || isCreditCard
        )).map((item) => ({ id: item.id.toString() }));

        const showSrcAmount = (!isExpense && !isLimit) || model.isDifferent;
        const showDestAmount = isExpense || isLimit || model.isDifferent;

        const realType = ImportTransaction.typeFromString(model.type);
        const visibleCategories = App.state
            .getCategoriesForType(realType)
            .map((item) => ({ id: item.id.toString() }));

        const res = {
            typeField: {
                disabled: false,
                visible: true,
                dropDown: { items: visibleTypes },
            },
            srcAmountField: {
                disabled: !showSrcAmount,
                visible: showSrcAmount,
                invFeedback: {
                    visible: showSrcAmount && !model.validation.srcAmount,
                },
            },
            destAmountField: {
                disabled: !showDestAmount,
                visible: showDestAmount,
                invFeedback: {
                    visible: showDestAmount && !model.validation.destAmount,
                },
            },
            transferAccountField: {
                disabled: !isTransfer,
                visible: isTransfer,
            },
            personField: {
                visible: isDebt,
                disabled: !isDebt,
            },
            dateField: {
                value: App.reformatDate(model.date),
                disabled: false,
                visible: true,
                button: {
                    visible: true,
                    disabled: false,
                },
                invFeedback: {
                    visible: !model.validation.date,
                },
            },
            categoryField: {
                value: model.categoryId.toString(),
                disabled: false,
                visible: true,
                dropDown: { items: visibleCategories },
            },
            commentField: {
                value: model.comment.toString(),
                disabled: false,
                visible: true,
            },
            reminderField: null,
            reminderDialog: {},
        };

        if (!res.typeField.disabled) {
            res.typeField.value = model.type.toString();
        }
        if (!res.srcAmountField.disabled) {
            res.srcAmountField.value = model.srcAmount.toString();

            if (isIncome) {
                res.srcAmountField.dropDown = { value: model.srcCurrId.toString() };
            }
        }

        if (!res.destAmountField.disabled) {
            res.destAmountField.value = model.destAmount.toString();

            if (isExpense) {
                res.destAmountField.dropDown = { value: model.destCurrId.toString() };
            }
        }

        if (!res.transferAccountField.disabled) {
            const transferAccountId = (model.type === 'transfer_out')
                ? model.destId
                : model.sourceId;

            res.transferAccountField.value = transferAccountId.toString();
        }
        if (!res.personField.disabled) {
            const personTok = (model.type === 'debt_in')
                ? 'transactions.sourcePerson'
                : 'transactions.destPerson';
            res.personField.title = __(personTok);
            res.personField.value = model.personId.toString();
        }

        // Reminder field
        const remindersAvailable = App.state.schedule.length > 0;
        const reminderId = parseInt(model.reminderId, 10);
        const scheduleId = parseInt(model.scheduleId, 10);

        if (remindersAvailable) {
            res.reminderField = {
                visible: true,
                closeBtn: {
                    visible: !!(reminderId || scheduleId),
                },
                selectBtn: {
                    visible: true,
                },
                value: {
                    reminder_id: (model.reminderId ?? 0).toString(),
                    schedule_id: (model.scheduleId ?? 0).toString(),
                    reminder_date: (model.reminderDate ?? 0).toString(),
                },
            };
        }

        if (model.imported) {
            res.toggleBtn = { visible: true };
            res.origDataCollapsible = {
                visible: true,
                collapsed: model.origDataCollapsed,
            };
        }

        return res;
    }

    static getInitialState(item, state = App.state) {
        const model = {
            mainAccount: item.mainAccount,
            type: item.type,
            sourceId: item.src_id,
            destId: item.dest_id,
            srcAmount: item.src_amount,
            destAmount: item.dest_amount,
            srcCurrId: item.src_curr,
            destCurrId: item.dest_curr,
            personId: item.person_id,
            categoryId: item.category_id,
            date: item.date,
            comment: item.comment,
            isDifferent: item.src_curr !== item.dest_curr,
            validation: {
                srcAmount: true,
                destAmount: true,
                date: true,
            },
        };

        return this.getExpectedState(model, state);
    }

    constructor(parent, elem, mainAccount) {
        super(parent, elem);

        this.mainAccount = mainAccount;

        this.model = {};
    }

    get reminderDialog() {
        return this.content.reminderDialog;
    }

    async parseField(elem) {
        assert(elem, 'Invalid field element');

        const res = await evaluate((el) => {
            const field = {
                title: el.querySelector('.field__title')?.textContent,
            };

            if (el.classList.contains('validation-block')) {
                const feedbackEl = el.querySelector('.invalid-feedback');
                field.invalidated = el.classList.contains('invalid-block');
                field.invFeedback = {
                    visible: feedbackEl && field.invalidated,
                };
            }

            const inputGroup = el.querySelector('.input-group');
            const dropDownSelector = (inputGroup) ? '.dd__container_attached' : '.dd__container';
            const dropDownEl = el.querySelector(dropDownSelector);

            field.dropDownSelector = (dropDownEl) ? dropDownSelector : null;

            if (inputGroup && !dropDownEl) {
                const button = el.querySelector('.input-group__btn');
                field.button = {
                    visible: !!button && !button.hidden,
                    disabled: button?.disabled,
                };
            }

            if (!dropDownEl || inputGroup) {
                const inputEl = el.querySelector('input[type=text]');
                field.inputSelector = (inputEl) ? 'input[type=text]' : null;
                field.name = inputEl?.name;
                field.disabled = inputEl?.disabled;
                field.value = inputEl?.value;
            }

            return field;
        }, elem);
        res.elem = elem;

        if (res.dropDownSelector) {
            res.dropDown = await DropDown.create(this, await query(elem, res.dropDownSelector));
            assert(res.dropDown, 'Invalid structure of field');

            // If field is select only, then save values from DropDown
            if (!res.inputSelector) {
                res.disabled = res.dropDown.disabled;
                res.value = res.dropDown.value;
            }
        }

        if (res.inputSelector) {
            res.inputElem = await query(elem, res.inputSelector);
            assert(res.inputElem, 'Invalid structure of field');
        }

        return res;
    }

    async parseContent() {
        const res = {
            reminderDialog: { elem: await query('.popup.select-reminder-dialog') },
        };

        [
            res.reminderDialog.visible,
        ] = await evaluate((reminderDialogEl) => ([
            reminderDialogEl && !reminderDialogEl.hidden,
        ]), res.reminderDialog.elem);

        [
            res.typeField,
            res.transferAccountField,
            res.personField,
            res.srcAmountField,
            res.destAmountField,
            res.dateField,
            res.categoryField,
            res.commentField,
        ] = await asyncMap(fieldSelectors, async (selector) => (
            this.parseField(await query(this.elem, selector))
        ));

        res.reminderField = await ReminderField.create(this, await query('.reminder-field'));
        if (res.reminderDialog.visible) {
            res.reminderDialog = await SelectReminderDialog.create(this, res.reminderDialog.elem);
        }

        res.toggleBtn = { elem: await query(this.elem, '.toggle-btn') };
        res.saveBtn = await query(this.elem, '.submit-btn');
        res.cancelBtn = await query(this.elem, '.cancel-btn');
        res.origDataCollapsible = await Collapsible.create(this, await query(this.elem, '.collapsible'));
        res.origDataTable = await query(this.elem, '.orig-data-table');

        assert(
            res.typeField
            && res.srcAmountField
            && res.destAmountField
            && res.transferAccountField
            && res.personField
            && res.dateField
            && res.categoryField
            && res.commentField
            && res.saveBtn
            && res.cancelBtn,
            'Invalid structure of import item',
        );

        res.originalData = null;
        if (res.origDataTable) {
            res.originalData = await OriginalImportData.create(this, res.origDataTable);
        }

        return res;
    }

    updateModel() {
        super.updateModel();

        this.data = this.getExpectedTransaction();
        if (this.data) {
            this.data.enabled = true;
            this.data.mainAccount = this.model.mainAccount;
            this.data.importType = this.model.type;
            if (this.model.original) {
                this.data.original = { ...this.model.original };
            }
        }
    }

    buildModel(cont) {
        const res = {
            mainAccount: App.state.accounts.getItem(this.mainAccount),
        };

        assert(res.mainAccount, 'Main account not found');

        res.type = cont.typeField.value;
        res.srcAmount = cont.srcAmountField.value;
        res.destAmount = cont.destAmountField.value;

        if (sourceTransactionTypes.includes(res.type)) {
            res.sourceId = res.mainAccount.id;
            res.srcCurrId = res.mainAccount.curr_id;
        } else {
            res.destId = res.mainAccount.id;
            res.destCurrId = res.mainAccount.curr_id;
        }

        if (res.type === 'expense') {
            res.destCurrId = parseInt(cont.destAmountField.dropDown.value, 10);
        } else if (res.type === 'income') {
            res.srcCurrId = parseInt(cont.srcAmountField.dropDown.value, 10);
        } else if (res.type === 'transfer_out' || res.type === 'transfer_in') {
            const accId = cont.transferAccountField.value;
            res.transferAccount = App.state.accounts.getItem(accId);
            assert(res.transferAccount, 'Transfer account not found');

            if (res.type === 'transfer_out') {
                res.destId = res.transferAccount.id;
                res.destCurrId = res.transferAccount.curr_id;
            } else if (res.type === 'transfer_in') {
                res.sourceId = res.transferAccount.id;
                res.srcCurrId = res.transferAccount.curr_id;
            }
        } else if (res.type === 'debt_out' || res.type === 'debt_in') {
            res.personId = cont.personField.value;
            res.person = App.state.persons.getItem(res.personId);
            assert(res.person, 'Person not found');

            if (res.type === 'debt_out') {
                res.destCurrId = res.srcCurrId;
            } else if (res.type === 'debt_in') {
                res.srcCurrId = res.destCurrId;
            }
        } else if (res.type === 'limit') {
            res.sourceId = 0;
            res.srcCurrId = res.destCurrId;
        }

        res.srcCurrency = App.currency.getItem(res.srcCurrId);
        res.destCurrency = App.currency.getItem(res.destCurrId);

        res.date = cont.dateField.value;
        res.categoryId = parseInt(cont.categoryField.value, 10);
        res.comment = cont.commentField.value;

        // Reminder
        const reminder = cont.reminderField?.value;
        res.reminderId = reminder?.reminder_id ?? 0;
        res.scheduleId = reminder?.schedule_id ?? 0;
        res.reminderDate = reminder?.reminder_date ?? 0;
        res.reminderDialogVisible = cont.reminderDialog.visible;

        res.isDifferent = (res.srcCurrId !== res.destCurrId);

        const srcAmount = !cont.srcAmountField.invalidated;
        const destAmount = !cont.destAmountField.invalidated;
        const date = !cont.dateField.invalidated;
        res.validation = {
            srcAmount,
            destAmount,
            date,
        };
        res.invalidated = !(srcAmount && destAmount && date);

        res.imported = cont.toggleBtn.visible;
        res.origDataCollapsed = !!cont.origDataCollapsible?.collapsed;
        res.origDataAnimation = !!cont.origDataCollapsible?.animationInProgress;
        if (cont.originalData && res.imported) {
            res.original = {
                ...cont.originalData.model,
            };
        }

        return res;
    }

    cleanValidation(model = this.model) {
        const res = model;
        res.validation = {
            srcAmount: true,
            destAmount: true,
            date: true,
        };
        res.invalidated = false;
        return res;
    }

    trimAmounts(model = this.model) {
        const res = model;

        res.srcAmount = trimToDigitsLimit(res.srcAmount, res.srcCurrency.precision);
        res.destAmount = trimToDigitsLimit(res.destAmount, res.destCurrency.precision);

        return res;
    }

    getExpectedState(model = this.model) {
        return ImportTransactionForm.getExpectedState(model);
    }

    getAmountValue(value, currency) {
        return (value === '') ? value : normalize(value, currency.precision);
    }

    getExpectedTransaction(model = this.model) {
        const res = {
            type: ImportTransaction.typeFromString(model.type),
        };

        if (res.type === EXPENSE) {
            res.src_id = model.mainAccount.id;
            res.dest_id = 0;
            res.src_curr = model.mainAccount.curr_id;
            res.dest_curr = model.destCurrency.id;
            res.dest_amount = this.getAmountValue(model.destAmount, model.destCurrency);
            if (model.isDifferent) {
                res.src_amount = this.getAmountValue(model.srcAmount, model.srcCurrency);
            } else {
                res.src_amount = res.dest_amount;
            }
        } else if (res.type === INCOME) {
            res.src_id = 0;
            res.dest_id = model.mainAccount.id;
            res.src_curr = model.srcCurrency.id;
            res.dest_curr = model.mainAccount.curr_id;
            res.src_amount = this.getAmountValue(model.srcAmount, model.srcCurrency);
            if (model.isDifferent) {
                res.dest_amount = this.getAmountValue(model.destAmount, model.destCurrency);
            } else {
                res.dest_amount = res.src_amount;
            }
        } else if (res.type === TRANSFER) {
            assert(model.transferAccount, 'Account not found');

            const isFrom = (model.type === 'transfer_out');
            const srcAccount = (isFrom) ? model.mainAccount : model.transferAccount;
            const destAccount = (isFrom) ? model.transferAccount : model.mainAccount;

            res.src_id = srcAccount.id;
            res.dest_id = destAccount.id;
            res.src_curr = srcAccount.curr_id;
            res.dest_curr = destAccount.curr_id;
            res.src_amount = this.getAmountValue(model.srcAmount, model.srcCurrency);
            res.dest_amount = (model.isDifferent)
                ? this.getAmountValue(model.destAmount, model.destCurrency)
                : res.src_amount;
        } else if (res.type === DEBT) {
            assert(model.person, 'Person not found');

            res.acc_id = model.mainAccount.id;
            res.person_id = model.person.id;
            res.op = (model.type === 'debt_in') ? 1 : 2;
            res.src_curr = model.mainAccount.curr_id;
            res.dest_curr = model.mainAccount.curr_id;
            res.src_amount = this.getAmountValue(model.srcAmount, model.srcCurrency);
            res.dest_amount = res.src_amount;
        } else if (res.type === LIMIT_CHANGE) {
            const decrease = (model.destAmount < 0);
            res.src_id = (decrease) ? model.mainAccount.id : 0;
            res.dest_id = (decrease) ? 0 : model.mainAccount.id;
            res.src_amount = Math.abs(this.getAmountValue(model.srcAmount, model.srcCurrency));
            res.dest_amount = Math.abs(this.getAmountValue(model.destAmount, model.destCurrency));
        }

        const locales = App.state.getDateFormatLocale();
        res.date = (App.isValidDateString(model.date))
            ? dateStringToSeconds(model.date, { locales, options: App.dateFormatOptions })
            : null;
        res.category_id = model.categoryId;
        res.comment = model.comment;

        const reminderId = (model.reminderId) ? parseInt(model.reminderId, 10) : 0;
        const scheduleId = (model.scheduleId) ? parseInt(model.scheduleId, 10) : 0;
        if (reminderId !== 0) {
            res.reminder_id = reminderId;
            res.schedule_id = 0;
            res.reminder_date = 0;
        } else if (scheduleId !== 0) {
            res.schedule_id = scheduleId;
            res.reminder_date = parseInt(model.reminderDate, 10);
        }

        return res;
    }

    restoreOriginal() {
        assert(this.model.original, 'Original data not found');

        const res = structuredClone(this.model);

        res.mainAccount = App.state.accounts.findByName(res.original.mainAccount);
        assert(res.mainAccount, `Account ${res.original.mainAccount} not found`);
        const mainAccountCurrency = App.currency.getItem(res.mainAccount.curr_id);
        assert(mainAccountCurrency, `Currency ${res.mainAccount.curr_id} not found`);

        const accAmount = parseFloat(fixFloat(res.original.accountAmount));
        const trAmount = parseFloat(fixFloat(res.original.transactionAmount));
        res.type = (accAmount > 0) ? 'income' : 'expense';
        if (res.type === 'expense') {
            res.sourceId = res.mainAccount.id;
            res.destId = 0;
            res.destAmount = Math.abs(trAmount);
            res.srcAmount = Math.abs(accAmount);
            res.srcCurrId = mainAccountCurrency.id;
        } else if (res.type === 'income') {
            res.sourceId = 0;
            res.destId = res.mainAccount.id;
            res.srcAmount = Math.abs(trAmount);
            res.destAmount = Math.abs(accAmount);
            res.destCurrId = mainAccountCurrency.id;
        }

        res.transferAccount = null;
        if (res.original.accountCurrency === res.original.transactionCurrency) {
            if (res.type === 'expense') {
                res.destCurrId = mainAccountCurrency.id;
            } else if (res.type === 'income') {
                res.srcCurrId = mainAccountCurrency.id;
            }
        } else {
            const currency = App.currency.findByCode(res.original.transactionCurrency);
            assert(currency, `Currency ${res.original.transactionCurrency} not found`);
            if (res.type === 'expense') {
                res.destCurrId = currency.id;
                res.srcAmount = Math.abs(accAmount);
            } else if (res.type === 'income') {
                res.srcCurrId = currency.id;
                res.destAmount = Math.abs(accAmount);
            }
        }

        res.srcCurrency = App.currency.getItem(res.srcCurrId);
        res.destCurrency = App.currency.getItem(res.destCurrId);
        res.personId = 0;
        res.person = null;
        res.date = res.original.date;
        res.comment = res.original.comment;
        res.isDifferent = (res.srcCurrId !== res.destCurrId);
        this.cleanValidation(res);

        return res;
    }

    checkEnabled(field) {
        assert(field, 'Invalid field');
        assert(!field.disabled, `'${field.title}' field is disabled`);
    }

    async changeType(value) {
        assert(this.model.type !== value, `Transaction type is already ${value}`);
        this.checkEnabled(this.content.typeField);

        const typeBefore = this.model.type;
        const isDiffBefore = this.model.isDifferent;
        const before = {
            sourceId: this.model.sourceId,
            destId: this.model.destId,
            srcCurrId: this.model.srcCurrId,
            destCurrId: this.model.destCurrId,
        };
        this.model.type = value;

        if (sourceTransactionTypes.includes(value)) {
            this.model.sourceId = this.model.mainAccount.id;
            this.model.srcCurrId = this.model.mainAccount.curr_id;
        } else {
            this.model.destId = this.model.mainAccount.id;
            this.model.destCurrId = this.model.mainAccount.curr_id;
        }

        if (value === 'expense') {
            this.model.destId = 0;
            this.model.transferAccount = null;

            if (!(typeBefore === 'income' && isDiffBefore)) {
                this.model.destAmount = this.model.srcAmount;
                this.model.destCurrId = this.model.mainAccount.curr_id;
            }
            if (typeBefore === 'income') {
                this.model.destCurrId = before.srcCurrId;
            }

            this.model.personId = 0;
            this.model.person = null;
        } else if (value === 'income') {
            this.model.sourceId = 0;
            this.model.transferAccount = null;

            if (typeBefore === 'expense' && !isDiffBefore) {
                this.model.srcAmount = this.model.destAmount;
            }
            if (typeBefore === 'expense') {
                this.model.srcCurrId = before.destCurrId;
            }
            if (typeBefore !== 'expense' || !isDiffBefore) {
                this.model.srcCurrId = this.model.mainAccount.curr_id;
            }

            this.model.personId = 0;
            this.model.person = null;
        } else if (value === 'transfer_out') {
            if (typeBefore === 'expense') {
                this.model.srcAmount = this.model.destAmount;
            }

            if (typeBefore !== 'transfer_in') {
                let accId = before.destId;
                if (!accId) {
                    const account = App.state.getFirstAccount();
                    accId = account.id;
                }
                if (accId === this.model.mainAccount.id) {
                    accId = App.state.getNextAccount(accId);
                }
                this.model.transferAccount = App.state.accounts.getItem(accId);
            }

            this.model.destId = this.model.transferAccount.id;
            this.model.destCurrId = this.model.transferAccount.curr_id;

            this.model.personId = 0;
            this.model.person = null;
        } else if (value === 'transfer_in') {
            if (typeBefore === 'expense') {
                this.model.srcAmount = this.model.destAmount;
            }

            if (typeBefore !== 'transfer_out') {
                let accId = before.sourceId;
                if (!accId) {
                    const account = App.state.getFirstAccount();
                    accId = account.id;
                }
                if (accId === this.model.mainAccount.id) {
                    accId = App.state.getNextAccount(accId);
                }
                this.model.transferAccount = App.state.accounts.getItem(accId);
            }

            this.model.sourceId = this.model.transferAccount.id;
            this.model.srcCurrId = this.model.transferAccount.curr_id;

            this.model.personId = 0;
            this.model.person = null;
        } else if (value === 'debt_out' || value === 'debt_in') {
            if (typeBefore === 'expense') {
                this.model.srcAmount = this.model.destAmount;
            }

            if (value === 'debt_out') {
                this.model.destId = 0;
            } else {
                this.model.sourceId = 0;
            }

            if (typeBefore !== 'debt_out' && typeBefore !== 'debt_in') {
                const person = App.state.getFirstPerson();
                this.model.personId = person.id;
                this.model.person = person;
            }
            this.model.srcCurrId = this.model.mainAccount.curr_id;
            this.model.destCurrId = this.model.mainAccount.curr_id;
            this.model.transferAccount = null;
        } else if (value === 'limit') {
            this.model.sourceId = 0;
            this.model.srcCurrId = this.model.destCurrId;
            if (typeBefore === 'income') {
                this.model.destAmount = this.model.srcAmount;
            }
            this.model.srcAmount = this.model.destAmount;
        }

        this.model.srcCurrency = App.currency.getItem(this.model.srcCurrId);
        this.model.destCurrency = App.currency.getItem(this.model.destCurrId);
        this.model.isDifferent = (this.model.srcCurrId !== this.model.destCurrId);

        if (this.model.categoryId !== 0) {
            const category = App.state.categories.getItem(this.model.categoryId);
            assert(category, `Category not found: '${this.model.categoryId}'`);

            const realType = ImportTransaction.typeFromString(this.model.type);
            if (category.type !== 0 && category.type !== realType) {
                this.model.categoryId = 0;
            }
        }

        this.trimAmounts();
        this.cleanValidation();
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.typeField.dropDown.selectItem(value));

        return this.checkState(expected);
    }

    async changeTransferAccount(value) {
        const transferTypes = ['transfer_out', 'transfer_in'];
        assert(transferTypes.includes(this.model.type), `Invalid transaction type: ${this.model.type}`);

        this.checkEnabled(this.content.transferAccountField);

        const accountId = parseInt(value, 10);
        assert(accountId, `Invalid account id: ${value}`);
        assert(this.model.mainAccount.id !== accountId, `Can't select same account as main: ${value}`);

        this.model.transferAccount = App.state.accounts.getItem(value);

        if (this.model.type === 'transfer_out') {
            this.model.destId = this.model.transferAccount.id;
            this.model.destCurrId = this.model.transferAccount.curr_id;
        } else {
            this.model.sourceId = this.model.transferAccount.id;
            this.model.srcCurrId = this.model.transferAccount.curr_id;
        }

        this.model.srcCurrency = App.currency.getItem(this.model.srcCurrId);
        this.model.destCurrency = App.currency.getItem(this.model.destCurrId);
        this.model.isDifferent = (this.model.srcCurrId !== this.model.destCurrId);
        this.trimAmounts();
        this.cleanValidation();
        const expected = this.getExpectedState();

        await this.performAction(() => (
            this.content.transferAccountField.dropDown.selectItem(value)
        ));

        return this.checkState(expected);
    }

    async changePerson(value) {
        this.checkEnabled(this.content.personField);

        this.model.personId = value;
        this.model.person = App.state.persons.getItem(value);
        this.cleanValidation();
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.personField.dropDown.selectItem(value));

        return this.checkState(expected);
    }

    async inputSourceAmount(value) {
        this.checkEnabled(this.content.srcAmountField);

        const cutValue = trimToDigitsLimit(value, this.model.srcCurrency.precision);
        this.model.srcAmount = cutValue;
        if (!this.model.isDifferent) {
            this.model.destAmount = cutValue;
        }
        this.cleanValidation();
        const expected = this.getExpectedState();

        await this.performAction(() => input(this.content.srcAmountField.inputElem, value));

        return this.checkState(expected);
    }

    async inputDestAmount(value) {
        this.checkEnabled(this.content.destAmountField);

        const cutValue = trimToDigitsLimit(value, this.model.destCurrency.precision);
        this.model.destAmount = cutValue;
        if (!this.model.isDifferent) {
            this.model.srcAmount = cutValue;
        }
        this.cleanValidation();
        const expected = this.getExpectedState();

        await this.performAction(() => input(this.content.destAmountField.inputElem, value));

        return this.checkState(expected);
    }

    async changeSourceCurrency(value) {
        assert(this.model.type === 'income', `Invalid transaction type: ${this.model.type}`);

        const { dropDown } = this.content.srcAmountField;
        this.checkEnabled(dropDown);

        this.model.srcCurrId = parseInt(value, 10);
        this.model.srcCurrency = App.currency.getItem(value);
        this.model.isDifferent = (this.model.srcCurrId !== this.model.destCurrId);
        this.trimAmounts();
        this.cleanValidation();
        const expected = this.getExpectedState();

        await this.performAction(() => dropDown.selectItem(value));

        return this.checkState(expected);
    }

    async changeDestCurrency(value) {
        assert(this.model.type === 'expense', `Invalid transaction type: ${this.model.type}`);

        const { dropDown } = this.content.destAmountField;
        this.checkEnabled(dropDown);

        this.model.destCurrId = parseInt(value, 10);
        this.model.destCurrency = App.currency.getItem(value);
        this.model.isDifferent = (this.model.srcCurrId !== this.model.destCurrId);
        this.trimAmounts();
        this.cleanValidation();
        const expected = this.getExpectedState();

        await this.performAction(() => dropDown.selectItem(value));

        return this.checkState(expected);
    }

    async inputDate(value) {
        this.checkEnabled(this.content.dateField);

        this.model.date = value;
        this.cleanValidation();
        const expected = this.getExpectedState();

        await this.performAction(() => input(this.content.dateField.inputElem, value));

        return this.checkState(expected);
    }

    async changeCategory(value) {
        const { dropDown } = this.content.categoryField;
        this.checkEnabled(dropDown);

        this.model.categoryId = parseInt(value, 10);
        this.cleanValidation();
        const expected = this.getExpectedState();

        await this.performAction(() => dropDown.selectItem(value));

        return this.checkState(expected);
    }

    async inputComment(value) {
        this.checkEnabled(this.content.commentField);

        this.model.comment = value;
        const expected = this.getExpectedState();

        await this.performAction(() => input(this.content.commentField.inputElem, value));

        return this.checkState(expected);
    }

    async openReminderDialog() {
        assert(this.content.reminderField?.content?.visible, 'Reminder field not available');

        this.model.reminderDialogVisible = true;

        const dialogModel = {
            filter: {
                state: REMINDER_SCHEDULED,
                startDate: null,
                endDate: null,
            },
            list: {
                page: 1,
                range: 1,
                pages: 0,
                items: [],
            },
            filtersVisible: false,
        };

        const filteredItems = SelectReminderDialog.getFilteredItems(dialogModel);
        const reminders = SelectReminderDialog.getExpectedList(dialogModel);
        dialogModel.list.items = reminders.items;
        dialogModel.list.page = (reminders.items.length > 0) ? 1 : 0;
        dialogModel.list.pages = filteredItems.expectedPages();
        this.model.reminderDialog = dialogModel;
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.reminderField.selectReminder());
        await this.reminderDialog.waitForLoad();

        return this.checkState(expected);
    }

    async closeReminderDialog() {
        assert(this.reminderDialog?.content?.visible, 'Reminder dialog not visible');

        this.model.reminderDialogVisible = false;
        const expected = this.getExpectedState();

        await this.performAction(() => this.reminderDialog.close());

        return this.checkState(expected);
    }

    async selectReminderByIndex(index) {
        const item = this.reminderDialog.getItemByIndex(index);

        this.model.reminderDialogVisible = false;
        this.model.reminderId = item?.id ?? 0;
        this.model.scheduleId = item?.schedule_id ?? 0;
        this.model.reminderDate = item?.date ?? 0;
        this.model.isReminder = true;

        const expected = this.getExpectedState();

        await this.performAction(() => this.reminderDialog.selectItemByIndex(index));

        return this.checkState(expected);
    }

    async removeReminder() {
        assert(this.content.reminderField?.content?.visible, 'Reminder field not available');

        this.model.reminderId = 0;
        this.model.scheduleId = 0;
        this.model.reminderDate = 0;
        this.model.isReminder = false;
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.reminderField.removeReminder());

        return this.checkState(expected);
    }

    async filterRemindersByState(state) {
        assert(this.reminderDialog?.content?.visible, 'Reminder field not available');

        const expected = this.getExpectedState();

        await this.performAction(() => this.reminderDialog.filterByState(state));

        return this.checkState(expected);
    }

    async selectRemindersStartDateFilter(value) {
        const expected = this.getExpectedState();

        await this.performAction(() => this.reminderDialog.selectStartDateFilter(value));

        return this.checkState(expected);
    }

    async selectRemindersEndDateFilter(value) {
        const expected = this.getExpectedState();

        await this.performAction(() => this.reminderDialog.selectEndDateFilter(value));

        return this.checkState(expected);
    }

    async clearRemindersStartDateFilter() {
        const expected = this.getExpectedState();

        await this.performAction(() => this.reminderDialog.clearStartDateFilter());

        return this.checkState(expected);
    }

    async clearRemindersEndDateFilter() {
        const expected = this.getExpectedState();

        await this.performAction(() => this.reminderDialog.clearEndDateFilter());

        return this.checkState(expected);
    }

    async clearAllRemindersFilters() {
        const expected = this.getExpectedState();

        await this.performAction(() => this.reminderDialog.clearAllFilters());

        return this.checkState(expected);
    }

    async goToRemindersFirstPage() {
        const expected = this.getExpectedState();

        await this.performAction(() => this.reminderDialog.goToFirstPage());

        return this.checkState(expected);
    }

    async goToRemindersLastPage() {
        const expected = this.getExpectedState();

        await this.performAction(() => this.reminderDialog.goToLastPage());

        return this.checkState(expected);
    }

    async goToRemindersPrevPage() {
        const expected = this.getExpectedState();

        await this.performAction(() => this.reminderDialog.goToPrevPage());

        return this.checkState(expected);
    }

    async goToRemindersNextPage() {
        const expected = this.getExpectedState();

        await this.performAction(() => this.reminderDialog.goToNextPage());

        return this.checkState(expected);
    }

    async showMoreReminders() {
        const expected = this.getExpectedState();

        await this.performAction(() => this.reminderDialog.showMore());

        return this.checkState(expected);
    }

    async setRemindersClassicMode() {
        const expected = this.getExpectedState();

        await this.performAction(() => this.reminderDialog.setClassicMode());

        return this.checkState(expected);
    }

    async setRemindersDetailsMode() {
        const expected = this.getExpectedState();

        await this.performAction(() => this.reminderDialog.setDetailsMode());

        return this.checkState(expected);
    }

    async clickSave() {
        return click(this.content.saveBtn);
    }

    async clickCancel() {
        return click(this.content.cancelBtn);
    }

    async waitForAnimation(action) {
        const expectedCollapsed = this.model.origDataCollapsed;

        await this.parse();

        await action();

        await waitForFunction(async () => {
            await this.parse();
            return (
                !this.model.origDataAnimation
                && this.model.origDataCollapsed === expectedCollapsed
            );
        });

        await this.parse();
    }

    async toggleOriginalData() {
        assert(this.content.toggleBtn.visible, 'Toggle button not visible');

        this.model.origDataCollapsed = !this.model.origDataCollapsed;
        const expected = this.getExpectedState();

        await this.waitForAnimation(() => click(this.content.toggleBtn.elem));

        return this.checkState(expected);
    }
}
