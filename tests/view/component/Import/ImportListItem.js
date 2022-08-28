import {
    TestComponent,
    query,
    queryAll,
    prop,
    click,
    input,
    isVisible,
    assert,
    isFunction,
    copyObject,
    formatDate,
} from 'jezve-test';
import { Checkbox, DropDown } from 'jezvejs/tests';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../../../model/Transaction.js';
import { ImportTransaction } from '../../../model/ImportTransaction.js';
import { ImportTemplate } from '../../../model/ImportTemplate.js';
import {
    normalize,
    asyncMap,
    fixFloat,
} from '../../../common.js';
import { App } from '../../../Application.js';

const sourceTransactionTypes = ['expense', 'transferfrom', 'debtfrom'];

export class ImportListItem extends TestComponent {
    constructor(parent, elem, mainAccount) {
        super(parent, elem);

        this.mainAccount = mainAccount;

        this.model = {};
    }

    mapField(field) {
        const fieldsMap = {
            typeField: 'Type',
            srcAmountField: (f) => f.name === 'src_amount[]',
            destAmountField: (f) => f.name === 'dest_amount[]',
            transferAccountField: [
                'Source account',
                'Destination account',
            ],
            personField: 'Person',
            dateField: 'Date',
            commentField: 'Comment',
        };

        assert(field?.title, 'Invalid field');

        let res = null;
        for (const fieldName of Object.keys(fieldsMap)) {
            const fieldLabel = fieldsMap[fieldName];
            if (
                (typeof fieldLabel === 'string' && fieldLabel === field.title)
                || (Array.isArray(fieldLabel) && fieldLabel.includes(field.title))
                || (isFunction(fieldLabel) && fieldLabel(field))
            ) {
                res = { name: fieldName, component: field };
                break;
            }
        }

        assert(res, `Unknown field '${field.title}'`);
        return res;
    }

    async parseField(elem) {
        const res = { elem };

        assert(res.elem, 'Invalid field element');

        res.labelElem = await query(elem, ':scope > label');
        assert(res.labelElem, 'Invalid structure of field');
        res.title = await prop(res.labelElem, 'textContent');

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
            assert(res.dropDown, 'Invalid structure of field');
        }

        if (!dropDownElem || inputGroup) {
            res.inputElem = await query(elem, 'input[type=text]');
            assert(res.inputElem, 'Invalid structure of field');
            res.name = await prop(res.inputElem, 'name');
            res.disabled = await prop(res.inputElem, 'disabled');
            res.value = await prop(res.inputElem, 'value');
        }

        return this.mapField(res);
    }

    async parseOriginalData(cont) {
        if (!cont.origDataTable) {
            return null;
        }

        const res = {};
        const labelsMap = {
            mainAccount: 'Main account',
            transactionAmount: 'Tr. amount',
            transactionCurrency: 'Tr. currency',
            accountAmount: 'Acc. amount',
            accountCurrency: 'Acc. currency',
            comment: 'Comment',
            date: 'Date',
        };

        const dataValues = await queryAll(cont.origDataTable, '.data-value');
        for (const dataValueElem of dataValues) {
            const labelElem = await query(dataValueElem, 'label');
            const valueElem = await query(dataValueElem, 'div');
            assert(labelElem && valueElem, 'Invalid structure of import item');

            const label = await prop(labelElem, 'textContent');
            const value = await prop(valueElem, 'textContent');
            const property = Object.keys(labelsMap).find((key) => label === labelsMap[key]);

            assert(property, `Invalid label: '${label}'`);

            res[property] = value;
        }

        const valid = Object.keys(labelsMap).every((key) => key in res);
        assert(valid, 'Invalid structure of import item');

        return res;
    }

    async parseContent() {
        const res = {
            enableCheck: await Checkbox.create(this, await query(this.elem, '.checkbox.enable-check')),
        };

        assert(res.enableCheck, 'Invalid structure of import item');
        res.enabled = res.enableCheck.checked;

        const fieldElems = await queryAll(this.elem, '.field');
        const fields = await asyncMap(fieldElems, (field) => this.parseField(field));
        fields.forEach((field) => { res[field.name] = field.component; });

        res.invFeedback = { elem: await query(this.elem, '.invalid-feedback') };
        res.deleteBtn = await query(this.elem, '.delete-btn');
        res.toggleBtn = await query(this.elem, '.toggle-btn');
        res.origDataTable = await query(this.elem, '.orig-data-table');

        assert(
            res.typeField
            && res.srcAmountField
            && res.destAmountField
            && res.transferAccountField
            && res.personField
            && res.dateField
            && res.commentField
            && res.invFeedback.elem
            && res.deleteBtn,
            'Invalid structure of import item',
        );

        res.originalData = await this.parseOriginalData(res);

        return res;
    }

    async updateModel() {
        await super.updateModel();

        this.data = this.getExpectedTransaction(this.model);
        if (this.data) {
            this.data.enabled = this.model.enabled;
            this.data.mainAccount = this.model.mainAccount;
        }
    }

    async buildModel(cont) {
        const res = {};

        res.mainAccount = App.state.accounts.getItem(this.mainAccount);
        assert(res.mainAccount, 'Main account not found');

        res.enabled = cont.enabled;
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
        } else if (res.type === 'transferfrom' || res.type === 'transferto') {
            const accId = cont.transferAccountField.value;
            res.transferAccount = App.state.accounts.getItem(accId);
            assert(res.transferAccount, 'Transfer account not found');

            if (res.type === 'transferfrom') {
                res.destId = res.transferAccount.id;
                res.destCurrId = res.transferAccount.curr_id;
            } else if (res.type === 'transferto') {
                res.sourceId = res.transferAccount.id;
                res.srcCurrId = res.transferAccount.curr_id;
            }
        } else if (res.type === 'debtfrom' || res.type === 'debtto') {
            res.personId = cont.personField.value;
            res.person = App.state.persons.getItem(res.personId);
            assert(res.person, 'Person not found');

            if (res.type === 'debtfrom') {
                res.destCurrId = res.srcCurrId;
            } else if (res.type === 'debtto') {
                res.srcCurrId = res.destCurrId;
            }
        }

        res.srcCurrency = App.currency.getItem(res.srcCurrId);
        res.destCurrency = App.currency.getItem(res.destCurrId);

        res.date = cont.dateField.value;
        res.comment = cont.commentField.value;

        res.isDifferent = (res.srcCurrId !== res.destCurrId);

        res.invalidated = await isVisible(cont.invFeedback.elem, true);
        res.imported = await isVisible(cont.toggleBtn, true);
        if (cont.originalData) {
            res.original = {
                ...cont.originalData,
                accountAmount: ImportTemplate.amountFix(cont.originalData.accountAmount),
                transactionAmount: ImportTemplate.amountFix(cont.originalData.transactionAmount),
                date: formatDate(
                    ImportTemplate.dateFromString(cont.originalData.date),
                ),
            };
        }

        return res;
    }

    getExpectedState(model) {
        const isExpense = (model.type === 'expense');
        const isIncome = (model.type === 'income');
        const isTransfer = (model.type === 'transferfrom' || model.type === 'transferto');
        const isDebt = (model.type === 'debtfrom' || model.type === 'debtto');

        const showSrcAmount = (isExpense && model.isDifferent) || !isExpense;
        const showDestAmount = isExpense || (!isExpense && model.isDifferent);

        const res = {
            enabled: model.enabled,
            typeField: {
                disabled: !model.enabled,
                visible: true,
            },
            srcAmountField: {
                disabled: !(model.enabled && showSrcAmount),
                visible: showSrcAmount,
                dropDown: {
                    disabled: !(model.enabled && isIncome),
                },
            },
            destAmountField: {
                disabled: !(model.enabled && showDestAmount),
                visible: showDestAmount,
                dropDown: {
                    disabled: !(model.enabled && isExpense),
                },
            },
            transferAccountField: {
                disabled: !(model.enabled && isTransfer),
                visible: isTransfer,
            },
            personField: {
                visible: isDebt,
                disabled: !(model.enabled && isDebt),
            },
            dateField: {
                value: model.date.toString(),
                disabled: !model.enabled,
                visible: true,
            },
            commentField: {
                value: model.comment.toString(),
                disabled: !model.enabled,
                visible: true,
            },
            invFeedback: { visible: model.invalidated },
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
            const transferAccountId = (model.type === 'transferfrom')
                ? model.destId
                : model.sourceId;
            res.transferAccountField.value = transferAccountId.toString();
        }
        if (!res.personField.disabled) {
            res.personField.value = model.personId.toString();
        }

        return res;
    }

    getExpectedTransaction(model) {
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

            const isFrom = (model.type === 'transferfrom');
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
            res.op = (model.type === 'debtto') ? 1 : 2;
            res.src_curr = model.mainAccount.curr_id;
            res.dest_curr = model.mainAccount.curr_id;
            res.src_amount = normalize(model.srcAmount);
            res.dest_amount = res.src_amount;
        }

        res.date = model.date;
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
            res.srcCurrId = mainAccountCurrency.id;
        } else if (res.type === 'income') {
            res.sourceId = 0;
            res.destId = res.mainAccount.id;
            res.srcAmount = Math.abs(trAmount);
            res.destCurrId = mainAccountCurrency.id;
        }

        res.transferAccount = null;
        if (res.original.accountCurrency === res.original.transactionCurrency) {
            if (res.type === 'expense') {
                res.destCurrId = mainAccountCurrency.id;
                res.srcAmount = '';
            } else if (res.type === 'income') {
                res.srcCurrId = mainAccountCurrency.id;
                res.destAmount = '';
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
        res.invalidated = false;

        return res;
    }

    async toggleEnable() {
        this.model.enabled = !this.model.enabled;
        this.expectedState = this.getExpectedState(this.model);

        await this.content.enableCheck.toggle();
        await this.parse();

        return this.checkState();
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
        if (res.type === 'transferfrom' || res.type === 'transferto') {
            if (res.transferAccount && res.transferAccount.id === res.mainAccount.id) {
                const accId = App.state.accounts.getNext(res.mainAccount.id);
                res.transferAccount = App.state.accounts.getItem(accId);

                if (res.type === 'transferfrom') {
                    res.destId = res.transferAccount.id;
                    res.destCurrId = res.transferAccount.curr_id;
                } else {
                    res.sourceId = res.transferAccount.id;
                    res.srcCurrId = res.transferAccount.curr_id;
                }
            }
        }
        if (res.type === 'debtfrom') {
            res.destCurrId = res.srcCurrId;
        }
        if (res.type === 'debtto') {
            res.srcCurrId = res.destCurrId;
        }

        res.srcCurrency = App.currency.getItem(res.srcCurrId);
        res.destCurrency = App.currency.getItem(res.destCurrId);
        res.isDifferent = (res.srcCurrId !== res.destCurrId);

        return res;
    }

    async changeType(value) {
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
        } else if (value === 'transferfrom') {
            if (typeBefore === 'expense') {
                this.model.srcAmount = this.model.destAmount;
            }

            let accId = before.destId;
            if (!accId) {
                const account = App.state.getFirstAccount();
                accId = account.id;
            }
            if (accId === this.model.mainAccount.id) {
                accId = App.state.accounts.getNext(accId);
            }
            this.model.transferAccount = App.state.accounts.getItem(accId);

            this.model.destId = this.model.transferAccount.id;
            this.model.destCurrId = this.model.transferAccount.curr_id;

            this.model.personId = 0;
            this.model.person = null;
        } else if (value === 'transferto') {
            if (typeBefore === 'expense') {
                this.model.srcAmount = this.model.destAmount;
            }

            let accId = before.sourceId;
            if (!accId) {
                const account = App.state.getFirstAccount();
                accId = account.id;
            }
            if (accId === this.model.mainAccount.id) {
                accId = App.state.accounts.getNext(accId);
            }
            this.model.transferAccount = App.state.accounts.getItem(accId);

            this.model.sourceId = this.model.transferAccount.id;
            this.model.srcCurrId = this.model.transferAccount.curr_id;

            this.model.personId = 0;
            this.model.person = null;
        } else if (value === 'debtfrom' || value === 'debtto') {
            if (typeBefore === 'expense') {
                this.model.srcAmount = this.model.destAmount;
            }

            if (value === 'debtfrom') {
                this.model.destId = 0;
            } else {
                this.model.sourceId = 0;
            }

            const person = App.state.getFirstPerson();
            this.model.personId = person.id;
            this.model.person = person;
            this.model.srcCurrId = this.model.mainAccount.curr_id;
            this.model.destCurrId = this.model.mainAccount.curr_id;
            this.model.transferAccount = null;
        }
        this.model.srcCurrency = App.currency.getItem(this.model.srcCurrId);
        this.model.destCurrency = App.currency.getItem(this.model.destCurrId);
        this.model.isDifferent = (this.model.srcCurrId !== this.model.destCurrId);
        this.model.invalidated = false;
        this.expectedState = this.getExpectedState(this.model);

        await this.content.typeField.dropDown.selectItem(value);
        await this.parse();

        return this.checkState();
    }

    async changeTransferAccount(value) {
        const transferTypes = ['transferfrom', 'transferto'];
        assert(transferTypes.includes(this.model.type), `Invalid transaction type: ${this.model.type}`);

        this.checkEnabled(this.content.transferAccountField);

        const accountId = parseInt(value, 10);
        assert(accountId, `Invalid account id: ${value}`);
        assert(this.model.mainAccount.id !== accountId, `Can't select same account as main: ${value}`);

        this.model.transferAccount = App.state.accounts.getItem(value);

        if (this.model.type === 'transferfrom') {
            this.model.destId = this.model.transferAccount.id;
            this.model.destCurrId = this.model.transferAccount.curr_id;
        } else {
            this.model.sourceId = this.model.transferAccount.id;
            this.model.srcCurrId = this.model.transferAccount.curr_id;
        }

        this.model.srcCurrency = App.currency.getItem(this.model.srcCurrId);
        this.model.destCurrency = App.currency.getItem(this.model.destCurrId);
        this.model.isDifferent = (this.model.srcCurrId !== this.model.destCurrId);
        this.model.invalidated = false;
        this.expectedState = this.getExpectedState(this.model);

        await this.content.transferAccountField.dropDown.selectItem(value);
        await this.parse();

        return this.checkState();
    }

    async changePerson(value) {
        this.checkEnabled(this.content.personField);

        this.model.personId = value;
        this.model.person = App.state.persons.getItem(value);
        this.model.invalidated = false;
        this.expectedState = this.getExpectedState(this.model);

        await this.content.personField.dropDown.selectItem(value);
        await this.parse();

        return this.checkState();
    }

    async inputSourceAmount(value) {
        this.checkEnabled(this.content.srcAmountField);

        this.model.srcAmount = value;
        this.model.invalidated = false;
        this.expectedState = this.getExpectedState(this.model);

        await input(this.content.srcAmountField.inputElem, value);
        await this.parse();

        return this.checkState();
    }

    async inputDestAmount(value) {
        this.checkEnabled(this.content.destAmountField);

        this.model.destAmount = value;
        this.model.invalidated = false;
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
        this.model.invalidated = false;
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
        this.model.invalidated = false;
        this.expectedState = this.getExpectedState(this.model);

        await dropDown.selectItem(value);
        await this.parse();

        return this.checkState();
    }

    async inputDate(value) {
        this.checkEnabled(this.content.dateField);

        this.model.date = value;
        this.model.invalidated = false;
        this.expectedState = this.getExpectedState(this.model);

        await input(this.content.dateField.inputElem, value);
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

    async clickDelete() {
        return click(this.content.deleteBtn);
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

        const isExpense = (item.type === 'expense');
        const isIncome = (item.type === 'income');
        const isTransfer = (item.type === 'transferfrom' || item.type === 'transferto');
        const isDebt = (item.type === 'debtfrom' || item.type === 'debtto');
        const isDiff = (item.src_curr !== item.dest_curr);

        const showSrcAmount = (isExpense && isDiff) || !isExpense;
        const showDestAmount = isExpense || (!isExpense && isDiff);

        const res = {
            enabled: item.enabled,
            typeField: { disabled: !item.enabled },
            srcAmountField: {
                disabled: !(item.enabled && showSrcAmount),
                visible: showSrcAmount,
                dropDown: {
                    disabled: !(item.enabled && isIncome),
                },
            },
            destAmountField: {
                disabled: !(item.enabled && showDestAmount),
                visible: showDestAmount,
                dropDown: {
                    disabled: !(item.enabled && isExpense),
                },
            },
            transferAccountField: {
                disabled: !(item.enabled && isTransfer),
                visible: isTransfer,
            },
            personField: {
                visible: isDebt,
                disabled: !(item.enabled && isDebt),
            },
            dateField: {
                value: item.date,
                disabled: !item.enabled,
            },
            commentField: {
                value: item.comment,
                disabled: !item.enabled,
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
            const transferAccountId = (item.type === 'transferfrom')
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
