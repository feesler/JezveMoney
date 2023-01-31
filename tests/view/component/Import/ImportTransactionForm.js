import {
    TestComponent,
    query,
    prop,
    click,
    input,
    isVisible,
    assert,
    copyObject,
    asyncMap,
    evaluate,
    hasClass,
} from 'jezve-test';
import { DropDown } from 'jezvejs-test';
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
    convDate,
} from '../../../common.js';
import { App } from '../../../Application.js';
import { OriginalImportData } from './OriginalImportData.js';

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

export class ImportTransactionForm extends TestComponent {
    constructor(parent, elem, mainAccount) {
        super(parent, elem);

        this.mainAccount = mainAccount;

        this.model = {};
    }

    async parseField(elem) {
        const res = { elem };

        assert(res.elem, 'Invalid field element');

        res.labelElem = await query(elem, '.field__title');
        assert(res.labelElem, 'Invalid structure of field');
        res.title = await prop(res.labelElem, 'textContent');

        const isValidation = await hasClass(elem, 'validation-block');
        if (isValidation) {
            res.invFeedback = { elem: await query(elem, '.invalid-feedback') };
            res.invFeedback.visible = await isVisible(res.invFeedback.elem);
            res.invalidated = await hasClass(elem, 'invalid-block');
        }

        const inputGroup = await query(elem, '.input-group');
        const dropDownSelector = (inputGroup) ? '.dd__container_attached' : '.dd__container';
        const dropDownElem = await query(elem, dropDownSelector);
        if (dropDownElem) {
            res.dropDown = await DropDown.create(this, dropDownElem);
            assert(res.dropDown, 'Invalid structure of field');

            // If field is select only, then save values from DropDown
            if (!inputGroup) {
                res.disabled = res.dropDown.disabled;
                res.value = res.dropDown.value;
            }
        }
        if (inputGroup) {
            if (!res.dropDown) {
                res.button = { elem: await query(inputGroup, '.input-group__btn') };
                res.button.visible = await isVisible(res.button.elem);
                if (res.button.elem) {
                    res.button.disabled = await prop(res.button.elem, 'disabled');
                }
            }
        }

        if (!dropDownElem || inputGroup) {
            res.inputElem = await query(elem, 'input[type=text]');
            assert(res.inputElem, 'Invalid structure of field');

            [
                res.name,
                res.disabled,
                res.value,
            ] = await evaluate((inputEl) => ([
                inputEl.name,
                inputEl.disabled,
                inputEl.value,
            ]), res.inputElem);
        }

        return res;
    }

    async parseContent() {
        const res = {};

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

        res.toggleBtn = { elem: await query(this.elem, '.toggle-btn') };
        res.saveBtn = await query(this.elem, '.submit-btn');
        res.cancelBtn = await query(this.elem, '.cancel-btn');
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
        }

        res.srcCurrency = App.currency.getItem(res.srcCurrId);
        res.destCurrency = App.currency.getItem(res.destCurrId);

        res.date = cont.dateField.value;
        res.categoryId = parseInt(cont.categoryField.value, 10);
        res.comment = cont.commentField.value;

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
        if (cont.originalData) {
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

    static getExpectedState(model) {
        const isExpense = (model.type === 'expense');
        const isIncome = (model.type === 'income');
        const isTransfer = (model.type === 'transfer_out' || model.type === 'transfer_in');
        const isDebt = (model.type === 'debt_out' || model.type === 'debt_in');

        const showSrcAmount = (isExpense && model.isDifferent) || !isExpense;
        const showDestAmount = isExpense || (!isExpense && model.isDifferent);

        const realType = ImportTransaction.typeFromString(model.type);
        const visibleCategories = App.state
            .getCategoriesForType(realType)
            .map((item) => ({ id: item.id.toString() }));

        const res = {
            typeField: {
                disabled: false,
                visible: true,
            },
            srcAmountField: {
                disabled: !showSrcAmount,
                visible: showSrcAmount,
                dropDown: {
                    disabled: !isIncome,
                },
                invFeedback: {
                    visible: showSrcAmount && !model.validation.srcAmount,
                },
            },
            destAmountField: {
                disabled: !showDestAmount,
                visible: showDestAmount,
                dropDown: {
                    disabled: !isExpense,
                },
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
                value: model.date.toString(),
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
        };

        if (!res.typeField.disabled) {
            res.typeField.value = model.type.toString();
        }
        if (!res.srcAmountField.disabled) {
            res.srcAmountField.value = model.srcAmount.toString();
        }
        if (!res.srcAmountField.dropDown.disabled) {
            res.srcAmountField.dropDown.value = model.srcCurrId.toString();
        }
        if (!res.destAmountField.disabled) {
            res.destAmountField.value = model.destAmount.toString();
        }
        if (!res.destAmountField.dropDown.disabled) {
            res.destAmountField.dropDown.value = model.destCurrId.toString();
        }
        if (!res.transferAccountField.disabled) {
            const transferAccountId = (model.type === 'transfer_out')
                ? model.destId
                : model.sourceId;
            res.transferAccountField.value = transferAccountId.toString();
        }
        if (!res.personField.disabled) {
            res.personField.value = model.personId.toString();
        }

        return res;
    }

    getExpectedState(model) {
        return ImportTransactionForm.getExpectedState(model);
    }

    getAmountValue(value) {
        return (value === '') ? value : normalize(value);
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
            res.dest_amount = this.getAmountValue(model.destAmount);
            if (model.isDifferent) {
                res.src_amount = this.getAmountValue(model.srcAmount);
            } else {
                res.src_amount = res.dest_amount;
            }
        } else if (res.type === INCOME) {
            res.src_id = 0;
            res.dest_id = model.mainAccount.id;
            res.src_curr = model.srcCurrency.id;
            res.dest_curr = model.mainAccount.curr_id;
            res.src_amount = this.getAmountValue(model.srcAmount);
            if (model.isDifferent) {
                res.dest_amount = this.getAmountValue(model.destAmount);
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
            res.src_amount = this.getAmountValue(model.srcAmount);
            res.dest_amount = (model.isDifferent)
                ? this.getAmountValue(model.destAmount)
                : res.src_amount;
        } else if (res.type === DEBT) {
            assert(model.person, 'Person not found');

            res.acc_id = model.mainAccount.id;
            res.person_id = model.person.id;
            res.op = (model.type === 'debt_in') ? 1 : 2;
            res.src_curr = model.mainAccount.curr_id;
            res.dest_curr = model.mainAccount.curr_id;
            res.src_amount = this.getAmountValue(model.srcAmount);
            res.dest_amount = res.src_amount;
        }

        const isValidDate = convDate(model.date) !== null;
        res.date = (isValidDate) ? dateStringToSeconds(model.date) : null;
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

        if (res.type === 'expense' && !res.isDifferent) {
            res.destCurrId = res.srcCurrId;
        }
        if (res.type === 'income' && !res.isDifferent) {
            res.srcCurrId = res.destCurrId;
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

        this.cleanValidation();
        this.expectedState = this.getExpectedState(this.model);

        await this.content.typeField.dropDown.selectItem(value);
        await this.parse();

        return this.checkState();
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
        this.cleanValidation();
        this.expectedState = this.getExpectedState(this.model);

        await this.content.transferAccountField.dropDown.selectItem(value);
        await this.parse();

        return this.checkState();
    }

    async changePerson(value) {
        this.checkEnabled(this.content.personField);

        this.model.personId = value;
        this.model.person = App.state.persons.getItem(value);
        this.cleanValidation();
        this.expectedState = this.getExpectedState(this.model);

        await this.content.personField.dropDown.selectItem(value);
        await this.parse();

        return this.checkState();
    }

    async inputSourceAmount(value) {
        this.checkEnabled(this.content.srcAmountField);

        this.model.srcAmount = value;
        if (!this.model.isDifferent) {
            this.model.destAmount = value;
        }
        this.cleanValidation();
        this.expectedState = this.getExpectedState(this.model);

        await input(this.content.srcAmountField.inputElem, value);
        await this.parse();

        return this.checkState();
    }

    async inputDestAmount(value) {
        this.checkEnabled(this.content.destAmountField);

        this.model.destAmount = value;
        if (!this.model.isDifferent) {
            this.model.srcAmount = value;
        }
        this.cleanValidation();
        this.expectedState = this.getExpectedState(this.model);

        await input(this.content.destAmountField.inputElem, value);
        await this.parse();

        return this.checkState();
    }

    async changeSourceCurrency(value) {
        assert(this.model.type === 'income', `Invalid transaction type: ${this.model.type}`);

        const { dropDown } = this.content.srcAmountField;
        this.checkEnabled(dropDown);

        this.model.srcCurrId = parseInt(value, 10);
        this.model.srcCurrency = App.currency.getItem(value);
        this.model.isDifferent = (this.model.srcCurrId !== this.model.destCurrId);
        this.cleanValidation();
        this.expectedState = this.getExpectedState(this.model);

        await dropDown.selectItem(value);
        await this.parse();

        return this.checkState();
    }

    async changeDestCurrency(value) {
        assert(this.model.type === 'expense', `Invalid transaction type: ${this.model.type}`);

        const { dropDown } = this.content.destAmountField;
        this.checkEnabled(dropDown);

        this.model.destCurrId = parseInt(value, 10);
        this.model.destCurrency = App.currency.getItem(value);
        this.model.isDifferent = (this.model.srcCurrId !== this.model.destCurrId);
        this.cleanValidation();
        this.expectedState = this.getExpectedState(this.model);

        await dropDown.selectItem(value);
        await this.parse();

        return this.checkState();
    }

    async inputDate(value) {
        this.checkEnabled(this.content.dateField);

        this.model.date = value;
        this.cleanValidation();
        this.expectedState = this.getExpectedState(this.model);

        await input(this.content.dateField.inputElem, value);
        await this.parse();

        return this.checkState();
    }

    async changeCategory(value) {
        const { dropDown } = this.content.categoryField;
        this.checkEnabled(dropDown);

        this.model.categoryId = parseInt(value, 10);
        this.cleanValidation();
        this.expectedState = this.getExpectedState(this.model);

        await dropDown.selectItem(value);
        await this.parse();

        return this.checkState();
    }

    async inputComment(value) {
        this.checkEnabled(this.content.commentField);

        this.model.comment = value;
        this.expectedState = this.getExpectedState(this.model);

        await input(this.content.commentField.inputElem, value);
        await this.parse();

        return this.checkState();
    }

    async clickSave() {
        return click(this.content.saveBtn);
    }

    async clickCancel() {
        return click(this.content.cancelBtn);
    }

    /**
     * Convert transaction object to expected state of component
     * Transaction object: { mainAccount, ...fields of transaction }
     * @param {ImportTransaction} item - transaction item object
     * @param {AppState} state - application state
     */
    static render(item, state) {
        assert(item && state, 'Invalid parameters');
        assert(item.mainAccount, 'Main account not defined');
        const trType = ImportTransaction.getTypeById(item.type);
        assert(trType, `Unknown import transaction type: ${item.type}`);

        const isExpense = (item.type === 'expense');
        const isIncome = (item.type === 'income');
        const isTransfer = (item.type === 'transfer_out' || item.type === 'transfer_in');
        const isDebt = (item.type === 'debt_out' || item.type === 'debt_in');
        const isDiff = (item.src_curr !== item.dest_curr);

        const showSrcAmount = (isExpense && isDiff) || !isExpense;
        const showDestAmount = isExpense || (!isExpense && isDiff);

        const res = {
            typeField: { disabled: false },
            srcAmountField: {
                disabled: !showSrcAmount,
                visible: showSrcAmount,
                dropDown: {
                    disabled: !isIncome,
                },
                invFeedback: {
                    visible: false,
                },
            },
            destAmountField: {
                disabled: !showDestAmount,
                visible: showDestAmount,
                dropDown: {
                    disabled: !isExpense,
                },
                invFeedback: {
                    visible: false,
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
                value: (
                    (typeof item.date === 'string') ? item.date : secondsToDateString(item.date)
                ),
                disabled: false,
                invFeedback: {
                    visible: false,
                },
            },
            commentField: {
                value: item.comment,
                disabled: false,
            },
        };

        if (!res.typeField.disabled) {
            res.typeField.value = item.type.toString();
        }
        if (!res.srcAmountField.disabled) {
            res.srcAmountField.value = item.src_amount.toString();
        }
        if (!res.srcAmountField.dropDown.disabled) {
            res.srcAmountField.dropDown.value = item.src_curr.toString();
        }
        if (!res.destAmountField.disabled) {
            res.destAmountField.value = item.dest_amount.toString();
        }
        if (!res.destAmountField.dropDown.disabled) {
            res.destAmountField.dropDown.value = item.dest_curr.toString();
        }
        if (!res.transferAccountField.disabled) {
            const transferAccountId = (item.type === 'transfer_out')
                ? item.dest_id
                : item.src_id;

            res.transferAccountField.value = transferAccountId.toString();
        }
        if (!res.personField.disabled) {
            res.personField.value = item.person_id.toString();
        }

        return res;
    }
}
