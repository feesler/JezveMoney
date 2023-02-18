import {
    TestComponent,
    query,
    click,
    isVisible,
    assert,
    copyObject,
    evaluate,
    hasClass,
    asyncMap,
    prop,
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
    secondsToDateString,
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

export class ImportTransactionItem extends TestComponent {
    constructor(parent, elem, mainAccount) {
        super(parent, elem);

        this.mainAccount = mainAccount;

        this.model = {};
    }

    async parseContent() {
        const res = await evaluate((elem) => ({
            selected: elem.classList.contains('import-item_selected'),
            enabled: !elem.hasAttribute('disabled'),
        }), this.elem);

        const selectedControls = await query(this.elem, '.select-controls');
        res.selectMode = await isVisible(selectedControls);

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

        res.typeField.type = await prop(res.typeField.elem, 'dataset.type');

        res.menuBtn = await query(this.elem, '.menu-btn');
        res.contextMenuElem = await query(this.elem, '.popup-menu-list');
        res.toggleBtn = { elem: await query(this.elem, '.toggle-btn') };
        res.origDataTable = await query(this.elem, '.orig-data-table');

        assert(
            res.menuBtn,
            'Invalid structure of import item',
        );

        res.originalData = null;
        if (res.origDataTable) {
            res.originalData = await OriginalImportData.create(this, res.origDataTable);
        }

        return res;
    }

    async parseField(elem) {
        assert(elem, 'Invalid field element');

        const titleElem = await query(elem, '.field__title');
        const contentElem = await query(elem, '.field__content');
        assert(titleElem && contentElem, 'Invalid structure of field');

        const res = await evaluate((titleEl, contEl) => ({
            title: titleEl.textContent,
            value: contEl.textContent,
        }), titleElem, contentElem);
        res.elem = elem;

        const isAmountField = await hasClass(elem, 'amount-field');
        if (isAmountField) {
            const props = await evaluate((el) => ({
                amount: el.dataset.amount,
                currencyId: el.dataset.curr,
            }), elem);
            Object.assign(res, props);
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
        const res = {
            mainAccount: App.state.accounts.getItem(this.mainAccount),
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
        if (cont.originalData) {
            res.original = {
                ...cont.originalData.model,
            };
        }

        return res;
    }

    static getExpectedState(model) {
        const isTransfer = (model.type === 'transfer_out' || model.type === 'transfer_in');
        const isDebt = (model.type === 'debt_out' || model.type === 'debt_in');

        const transactionType = ImportTransaction.getTypeById(model.type);
        assert(transactionType, `Invalid transaction type: '${model.type}'`);

        const category = App.state.categories.getItem(model.categoryId);
        const categoryName = (model.categoryId === 0) ? '' : category.name;

        const res = {
            selectMode: model.selectMode,
            selected: model.selected,
            enabled: model.enabled,
            typeField: {
                visible: true,
                value: transactionType.title,
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
                visible: true,
            },
            commentField: {
                value: model.comment.toString(),
                visible: true,
            },
        };

        if (res.destAmountField.visible) {
            res.destAmountField.value = model.destCurrency.format(model.destAmount);
        }
        if (res.transferAccountField.visible) {
            const transferAccountId = (model.type === 'transfer_out')
                ? model.destId
                : model.sourceId;
            const account = App.state.accounts.getItem(transferAccountId);
            res.transferAccountField.value = account.name;
        }
        if (res.personField.visible) {
            const person = App.state.persons.getItem(model.personId);
            res.personField.value = person.name;
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

        if (res.type === EXPENSE) {
            res.src_id = model.mainAccount.id;
            res.dest_id = 0;
            res.src_curr = model.mainAccount.curr_id;
            res.dest_curr = model.destCurrency.id;
            res.dest_amount = normalize(model.destAmount);
            if (model.isDifferent) {
                res.src_amount = normalize(model.srcAmount);
            } else {
                res.src_amount = res.dest_amount;
            }
        } else if (res.type === INCOME) {
            res.src_id = 0;
            res.dest_id = model.mainAccount.id;
            res.src_curr = model.srcCurrency.id;
            res.dest_curr = model.mainAccount.curr_id;
            res.src_amount = normalize(model.srcAmount);
            if (model.isDifferent) {
                res.dest_amount = normalize(model.destAmount);
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
            res.src_amount = normalize(model.srcAmount);
            res.dest_amount = (model.isDifferent)
                ? normalize(model.destAmount)
                : res.src_amount;
        } else if (res.type === DEBT) {
            assert(model.person, 'Person not found');

            res.acc_id = model.mainAccount.id;
            res.person_id = model.person.id;
            res.op = (model.type === 'debt_in') ? 1 : 2;
            res.src_curr = model.mainAccount.curr_id;
            res.dest_curr = model.mainAccount.curr_id;
            res.src_amount = normalize(model.srcAmount);
            res.dest_amount = res.src_amount;
        }

        res.date = dateStringToSeconds(model.date);
        res.category_id = model.categoryId;
        res.comment = model.comment;

        return res;
    }

    restoreOriginal() {
        assert(this.model.original, 'Original data not found');

        const res = copyObject(this.model);

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
            const currency = App.currency.findByName(res.original.transactionCurrency);
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
        const res = copyObject(model);

        res.enabled = !res.enabled;
        res.srcCurrency = App.currency.getItem(res.srcCurrId);
        res.destCurrency = App.currency.getItem(res.destCurrId);

        return res;
    }

    onChangeMainAccount(model, value) {
        assert(model, 'Invalid model specified');

        const res = copyObject(model);

        res.mainAccount = App.state.accounts.getItem(value);
        assert(res.mainAccount, `Invalid account ${value}`);
        const mainAccountCurrency = App.currency.getItem(res.mainAccount.curr_id);
        assert(mainAccountCurrency, `Currency ${res.mainAccount.curr_id} not found`);

        if (sourceTransactionTypes.includes(res.type)) {
            res.sourceId = res.mainAccount.id;
            res.srcCurrId = res.mainAccount.curr_id;
        } else {
            res.destId = res.mainAccount.id;
            res.destCurrId = res.mainAccount.curr_id;
        }

        if (res.type === 'expense') {
            if (!res.isDifferent) {
                res.destCurrId = res.srcCurrId;
            } else if (res.destCurrId === res.srcCurrId) {
                res.srcAmount = res.destAmount;
            }
        }
        if (res.type === 'income') {
            if (!res.isDifferent) {
                res.srcCurrId = res.destCurrId;
            } else if (res.destCurrId === res.srcCurrId) {
                res.destAmount = res.srcAmount;
            }
        }
        if (res.type === 'transfer_out' || res.type === 'transfer_in') {
            if (res.transferAccount && res.transferAccount.id === res.mainAccount.id) {
                const accId = App.state.getNextAccount(res.mainAccount.id);
                res.transferAccount = App.state.accounts.getItem(accId);

                if (res.type === 'transfer_out') {
                    res.destId = res.transferAccount.id;
                    res.destCurrId = res.transferAccount.curr_id;
                } else {
                    res.sourceId = res.transferAccount.id;
                    res.srcCurrId = res.transferAccount.curr_id;
                }
            }
        }
        if (res.type === 'debt_out') {
            res.destCurrId = res.srcCurrId;
        }
        if (res.type === 'debt_in') {
            res.srcCurrId = res.destCurrId;
        }

        res.srcCurrency = App.currency.getItem(res.srcCurrId);
        res.destCurrency = App.currency.getItem(res.destCurrId);
        res.isDifferent = (res.srcCurrId !== res.destCurrId);

        return res;
    }

    async clickMenu() {
        return click(this.content.menuBtn);
    }

    async toggleSelect() {
        assert(this.model.selectMode, 'Invalid state: item not in select mode');
        await click(this.elem);
    }

    /**
     * Convert transaction object to expected state of component
     * Transaction object: { mainAccount, enabled, ...fields of transaction }
     * @param {ImportTransaction} item - transaction item object
     * @param {AppState} state - application state
     */
    static render(item, state) {
        assert(item && state, 'Invalid parameters');
        assert(item.mainAccount, 'Main account not defined');
        const trType = ImportTransaction.getTypeById(item.type);
        assert(trType, `Unknown import transaction type: ${item.type}`);

        const isTransfer = (item.type === 'transfer_out' || item.type === 'transfer_in');
        const isDebt = (item.type === 'debt_out' || item.type === 'debt_in');
        const isDiff = (item.src_curr !== item.dest_curr);

        const showDestAmount = isDiff;

        const srcCurrency = App.currency.getItem(item.src_curr);
        const destCurrency = App.currency.getItem(item.dest_curr);

        const res = {
            enabled: item.enabled,
            typeField: {
                visible: true,
                value: __(trType.titleToken, App.view.locale),
            },
            srcAmountField: {
                visible: true,
                value: srcCurrency.format(item.src_amount),
            },
            destAmountField: {
                visible: showDestAmount,
            },
            transferAccountField: {
                visible: isTransfer,
            },
            personField: {
                visible: isDebt,
            },
            dateField: {
                value: secondsToDateString(item.date),
                visible: true,
            },
            commentField: {
                value: item.comment,
                visible: true,
            },
        };

        if (res.destAmountField.visible) {
            res.destAmountField.value = destCurrency.format(item.dest_amount);
        }
        if (res.transferAccountField.visible) {
            const transferAccountId = (item.type === 'transfer_out')
                ? item.dest_id
                : item.src_id;
            const account = App.state.accounts.getItem(transferAccountId);
            res.transferAccountField.value = account?.name;
        }
        if (res.personField.visible) {
            const person = App.state.persons.getItem(item.person_id);
            res.personField.value = person.name;
        }

        return res;
    }
}
