import { assert } from '@jezvejs/assert';
import {
    TestComponent,
    query,
    click,
    evaluate,
} from 'jezve-test';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../../../model/Transaction.js';
import { ImportTransaction } from '../../../model/ImportTransaction.js';
import {
    normalize,
    fixFloat,
    dateStringToSeconds,
} from '../../../common.js';
import { App } from '../../../Application.js';
import { OriginalImportData } from './OriginalImportData.js';
import { __ } from '../../../model/locale.js';

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
 * Import transactions list item test component
 */
export class ImportTransactionItem extends TestComponent {
    static getExpectedState(model, state = App.state) {
        assert(model, 'Invalid data');

        const isTransfer = (model.type === 'transfer_out' || model.type === 'transfer_in');
        const isDebt = (model.type === 'debt_out' || model.type === 'debt_in');

        const transactionType = ImportTransaction.getTypeById(model.type);
        assert(transactionType, `Invalid transaction type: '${model.type}'`);

        const category = state.categories.getItem(model.categoryId);
        const categoryName = (model.categoryId === 0) ? '' : category.name;

        const res = {
            selectMode: model.selectMode,
            selected: model.selected,
            enabled: model.enabled,
            typeField: {
                visible: true,
                value: __(transactionType.titleToken),
            },
            srcAmountField: {
                visible: true,
                value: model.srcCurrency.format(model.srcAmount),
            },
            destAmountField: {
                visible: model.isDifferent,
                value: '',
            },
            transferAccountField: {
                visible: isTransfer,
            },
            personField: {
                visible: isDebt,
            },
            dateField: {
                value: model.date.toString(),
                visible: true,
            },
            categoryField: {
                value: categoryName,
                visible: (model.categoryId !== 0),
            },
            commentField: {
                value: model.comment,
                visible: model.comment.length > 0,
            },
        };

        if (res.destAmountField.visible) {
            res.destAmountField.value = model.destCurrency.format(model.destAmount);
        }
        if (res.transferAccountField.visible) {
            const transferAccountId = (model.type === 'transfer_out')
                ? model.destId
                : model.sourceId;
            const account = state.accounts.getItem(transferAccountId);
            res.transferAccountField.value = account.name;
        }
        if (res.personField.visible) {
            const personTok = (model.type === 'debt_in')
                ? 'transactions.sourcePerson'
                : 'transactions.destPerson';
            res.personField.title = __(personTok);

            const person = state.persons.getItem(model.personId);
            res.personField.value = person.name;
        }

        return res;
    }

    static render(item, state = App.state) {
        assert(item, 'Invalid import transaction');

        const model = {
            selectMode: item.selectMode ?? false,
            selected: item.selected ?? false,
            enabled: item.enabled,
            type: item.type,
            sourceId: item.src_id,
            destId: item.dest_id,
            personId: item.person_id,
            srcAmount: item.src_amount,
            destAmount: item.dest_amount,
            srcCurrency: App.currency.getItem(item.src_curr),
            destCurrency: App.currency.getItem(item.dest_curr),
            categoryId: item.category_id,
            date: App.secondsToDateString(item.date),
            comment: item.comment,
            isDifferent: item.src_curr !== item.dest_curr,
        };

        return this.getExpectedState(model, state);
    }

    constructor(parent, elem, mainAccount) {
        super(parent, elem);

        this.mainAccount = mainAccount;

        this.model = {};
    }

    async parseContent() {
        const res = await evaluate((el, selectors) => {
            const selectControls = el.querySelector('.list-item__select');
            const item = {
                selected: el.classList.contains('list-item_selected'),
                enabled: !el.hasAttribute('disabled'),
                selectMode: (
                    !!selectControls
                    && !selectControls.hidden
                    && selectControls.offsetWidth > 0
                ),
            };

            [
                item.typeField,
                item.transferAccountField,
                item.personField,
                item.srcAmountField,
                item.destAmountField,
                item.dateField,
                item.categoryField,
                item.commentField,
            ] = selectors.map((selector) => {
                const fieldEl = el.querySelector(selector);
                const field = {
                    title: fieldEl.querySelector('.field__title')?.textContent,
                    value: fieldEl.querySelector('.field__content')?.textContent,
                    visible: !fieldEl.hidden,
                };

                if (fieldEl.classList.contains('type-field')) {
                    field.type = fieldEl.dataset.type;
                }
                if (fieldEl.classList.contains('amount-field')) {
                    field.amount = fieldEl.dataset.amount;
                    field.currencyId = fieldEl.dataset.curr;
                }

                return field;
            });

            return item;
        }, this.elem, fieldSelectors);

        res.menuBtn = { elem: await query(this.elem, '.menu-btn') };
        res.contextMenuElem = await query(this.elem, '.popup-menu-list');
        res.toggleBtn = { elem: await query(this.elem, '.toggle-btn') };
        res.origDataTable = await query(this.elem, '.orig-data-table');

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
            this.data.selectMode = this.model.selectMode;
            this.data.selected = this.model.selected;
            this.data.enabled = this.model.enabled;
            this.data.mainAccount = this.model.mainAccount;
            this.data.importType = this.model.type;
            if (this.model.original) {
                this.data.original = { ...this.model.original };
            }
        }
    }

    buildModel(cont) {
        const mainAccountId = this.model?.mainAccount?.id ?? this.mainAccount;

        const res = {
            mainAccount: App.state.accounts.getItem(mainAccountId),
        };
        assert(res.mainAccount, 'Main account not found');

        res.isContextMenu = !!cont.contextMenuElem;
        res.selectMode = cont.selectMode;
        res.selected = cont.selected;
        res.enabled = cont.enabled;

        const transactionType = ImportTransaction.getTypeById(cont.typeField.type);
        assert(transactionType, `Invalid transaction type: '${cont.typeField.type}'`);

        res.type = cont.typeField.type;
        res.srcAmount = parseFloat(cont.srcAmountField.amount);
        res.destAmount = parseFloat(cont.destAmountField.amount);

        if (sourceTransactionTypes.includes(res.type)) {
            res.sourceId = res.mainAccount.id;
            res.srcCurrId = res.mainAccount.curr_id;
        } else {
            res.destId = res.mainAccount.id;
            res.destCurrId = res.mainAccount.curr_id;
        }

        if (res.type === 'expense') {
            res.destCurrId = parseInt(cont.destAmountField.currencyId, 10);
        } else if (res.type === 'income') {
            res.srcCurrId = parseInt(cont.srcAmountField.currencyId, 10);
        } else if (res.type === 'transfer_out' || res.type === 'transfer_in') {
            const accName = cont.transferAccountField.value;
            res.transferAccount = App.state.accounts.findByName(accName);
            assert(res.transferAccount, 'Transfer account not found');

            if (res.type === 'transfer_out') {
                res.destId = res.transferAccount.id;
                res.destCurrId = res.transferAccount.curr_id;
            } else if (res.type === 'transfer_in') {
                res.sourceId = res.transferAccount.id;
                res.srcCurrId = res.transferAccount.curr_id;
            }
        } else if (res.type === 'debt_out' || res.type === 'debt_in') {
            const personName = cont.personField.value;
            res.person = App.state.persons.findByName(personName);
            assert(res.person, 'Person not found');
            res.personId = res.person.id;

            if (res.type === 'debt_out') {
                res.destCurrId = res.srcCurrId;
            } else if (res.type === 'debt_in') {
                res.srcCurrId = res.destCurrId;
            }
        } else if (res.type === 'limit') {
            res.srcCurrId = res.destCurrId;
        }

        res.srcCurrency = App.currency.getItem(res.srcCurrId);
        res.destCurrency = App.currency.getItem(res.destCurrId);

        res.date = cont.dateField.value;

        const categoryName = cont.categoryField.value;
        const category = (categoryName.length === 0)
            ? { id: 0 }
            : App.state.categories.findByName(categoryName);
        assert(category, 'Category not found');
        res.categoryId = category.id;

        res.comment = cont.commentField.value;

        res.isDifferent = (res.srcCurrId !== res.destCurrId);

        res.imported = cont.toggleBtn.visible;
        if (cont.originalData && res.imported) {
            res.original = {
                ...cont.originalData.model,
            };
        }

        return res;
    }

    getExpectedState(model = this.model) {
        return ImportTransactionItem.getExpectedState(model);
    }

    getExpectedTransaction(model = this.model) {
        const res = {
            type: ImportTransaction.typeFromString(model.type),
        };

        const srcPrecision = model.srcCurrency.precision;
        const destPrecision = model.destCurrency.precision;

        if (res.type === EXPENSE) {
            res.src_id = model.mainAccount.id;
            res.dest_id = 0;
            res.src_curr = model.mainAccount.curr_id;
            res.dest_curr = model.destCurrency.id;
            res.dest_amount = normalize(model.destAmount, destPrecision);
            if (model.isDifferent) {
                res.src_amount = normalize(model.srcAmount, srcPrecision);
            } else {
                res.src_amount = res.dest_amount;
            }
        } else if (res.type === INCOME) {
            res.src_id = 0;
            res.dest_id = model.mainAccount.id;
            res.src_curr = model.srcCurrency.id;
            res.dest_curr = model.mainAccount.curr_id;
            res.src_amount = normalize(model.srcAmount, srcPrecision);
            if (model.isDifferent) {
                res.dest_amount = normalize(model.destAmount, destPrecision);
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
            res.src_amount = normalize(model.srcAmount, srcPrecision);
            res.dest_amount = (model.isDifferent)
                ? normalize(model.destAmount, destPrecision)
                : res.src_amount;
        } else if (res.type === DEBT) {
            assert(model.person, 'Person not found');

            res.acc_id = model.mainAccount.id;
            res.person_id = model.person.id;
            res.op = (model.type === 'debt_in') ? 1 : 2;
            res.src_curr = model.mainAccount.curr_id;
            res.dest_curr = model.mainAccount.curr_id;
            res.src_amount = normalize(model.srcAmount, srcPrecision);
            res.dest_amount = res.src_amount;
        }

        res.date = dateStringToSeconds(model.date, {
            locales: App.state.getDateFormatLocale(),
            options: App.dateFormatOptions,
        });
        res.category_id = model.categoryId;
        res.comment = model.comment;

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
            } else if (res.type === 'income') {
                res.srcCurrId = currency.id;
            }
        }

        res.srcCurrency = App.currency.getItem(res.srcCurrId);
        res.destCurrency = App.currency.getItem(res.destCurrId);
        res.personId = 0;
        res.person = null;
        res.date = res.original.date;
        res.comment = res.original.comment;
        res.isDifferent = (res.srcCurrId !== res.destCurrId);
        res.invalidated = false;

        return res;
    }

    onToggleEnable(model = this.model) {
        const res = structuredClone(model);

        res.enabled = !res.enabled;
        res.srcCurrency = App.currency.getItem(res.srcCurrId);
        res.destCurrency = App.currency.getItem(res.destCurrId);

        return res;
    }

    async clickMenu() {
        assert(this.content.menuBtn.visible, 'Menu button not visible');
        return click(this.content.menuBtn.elem);
    }

    async toggleSelect() {
        assert(this.model.selectMode, 'Invalid state: item not in select mode');
        await click(this.elem);
    }
}
