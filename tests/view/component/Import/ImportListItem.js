import {
    TestComponent,
    query,
    queryAll,
    prop,
    click,
    input,
    check,
    isVisible,
    assert,
} from 'jezve-test';
import { copyObject } from 'jezvejs';
import { formatDate } from 'jezvejs/DateUtils';
import { DropDown } from '../DropDown.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../../../model/Transaction.js';
import { ImportTransaction } from '../../../model/ImportTransaction.js';
import { ImportTemplate } from '../../../model/ImportTemplate.js';
import { Currency } from '../../../model/Currency.js';
import {
    normalize,
    asyncMap,
    fixFloat,
} from '../../../common.js';
import { App } from '../../../Application.js';

export class ImportListItem extends TestComponent {
    constructor(parent, elem, mainAccount) {
        super(parent, elem);

        this.mainAccount = mainAccount;

        this.model = {};
    }

    mapField(field) {
        const fieldsMap = {
            typeField: 'Type',
            amountField: 'Amount',
            destAmountField: [
                'Source amount',
                'Destination amount',
            ],
            destAccountField: [
                'Source account',
                'Destination account',
            ],
            personField: 'Person',
            currencyField: 'Currency',
            dateField: 'Date',
            commentField: 'Comment',
        };

        assert(field?.title, 'Invalid field');

        let res = null;
        for (const fieldName of Object.keys(fieldsMap)) {
            const fieldLabel = fieldsMap[fieldName];
            if (
                (typeof fieldLabel === 'string' && fieldLabel === field.title)
                || (fieldLabel.includes(field.title))
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
        assert(res.labelElem, 'Invalid structure of field element');
        res.title = await prop(res.labelElem, 'textContent');

        const dropDownElem = await query(elem, '.dd__container');
        if (dropDownElem) {
            res.dropDown = await DropDown.create(this, dropDownElem);
            assert(res.dropDown, 'Invalid structure of field element');
            res.disabled = res.dropDown.content.disabled;
            res.value = res.dropDown.content.value;
        } else {
            res.inputElem = await query(elem, ':scope > div > *');
            assert(res.inputElem, 'Invalid structure of field element');
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
            enableCheck: await query(this.elem, '.enable-check input[type="checkbox"]'),
        };
        assert(res.enableCheck, 'Invalid structure of import item');
        res.enabled = await prop(res.enableCheck, 'checked');

        const fieldElems = await queryAll(this.elem, '.field');
        const fields = await asyncMap(fieldElems, (field) => this.parseField(field));
        fields.forEach((field) => { res[field.name] = field.component; });

        res.invFeedback = { elem: await query(this.elem, '.invalid-feedback') };
        res.deleteBtn = await query(this.elem, '.delete-btn');
        res.toggleBtn = await query(this.elem, '.toggle-btn');
        res.origDataTable = await query(this.elem, '.orig-data-table');

        assert(
            res.typeField
            && res.amountField
            && res.destAmountField
            && res.destAccountField
            && res.personField
            && res.currencyField
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

    isDifferentCurrencies(model) {
        assert(ImportTransaction.getTypeById(model.type), 'Invalid transaction type');

        if (model.type === 'expense' || model.type === 'income') {
            if (!model.currency) {
                return false;
            }

            return (model.mainAccount.curr_id !== model.currency.id);
        }

        if (model.type === 'transferfrom' || model.type === 'transferto') {
            return (model.mainAccount.curr_id !== model.destAccount.curr_id);
        }

        // 'debtfrom' or 'debtto'
        return false;
    }

    async buildModel(cont) {
        const res = {};

        res.mainAccount = App.state.accounts.getItem(this.mainAccount);
        assert(res.mainAccount, 'Main account not found');

        res.enabled = cont.enabled;
        res.type = cont.typeField.value;
        res.amount = cont.amountField.value;
        res.destAmount = cont.destAmountField.value;

        res.destId = cont.destAccountField.value;
        res.destAccount = App.state.accounts.getItem(res.destId);

        res.personId = cont.personField.value;
        res.person = App.state.persons.getItem(res.personId);

        res.currId = cont.currencyField.value;
        res.currency = Currency.getById(res.currId);

        res.date = cont.dateField.value;
        res.comment = cont.commentField.value;

        res.isDifferent = this.isDifferentCurrencies(res);

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
        const res = {
            enabled: model.enabled,
            typeField: {
                value: model.type.toString(),
                disabled: !model.enabled,
                visible: true,
            },
            amountField: {
                value: model.amount.toString(),
                disabled: !model.enabled,
                visible: true,
            },
            destAmountField: {
                value: model.destAmount.toString(),
                disabled: !model.enabled,
            },
            destAccountField: {
                value: model.destId.toString(),
                disabled: !model.enabled,
            },
            currencyField: {
                value: model.currId.toString(),
                disabled: !model.enabled,
                visible: true,
            },
            personField: {
                value: model.personId.toString(),
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

        if (model.type === 'expense') {
            res.destAmountField.visible = model.isDifferent;
            res.destAccountField.visible = false;
            res.personField.visible = false;

            res.destAccountField.disabled = true;
            res.personField.disabled = true;
        } else if (model.type === 'income') {
            res.destAmountField.visible = model.isDifferent;
            res.destAccountField.visible = false;
            res.personField.visible = false;

            res.destAccountField.disabled = true;
            res.personField.disabled = true;
        } else if (model.type === 'transferfrom' || model.type === 'transferto') {
            res.destAmountField.visible = model.isDifferent;
            res.destAccountField.visible = true;
            res.personField.visible = false;

            if (model.enabled) {
                res.destAccountField.disabled = false;
            }
            res.currencyField.disabled = true;
            res.personField.disabled = true;
        } else if (model.type === 'debtfrom' || model.type === 'debtto') {
            res.destAmountField.visible = false;
            res.destAccountField.visible = false;
            res.personField.visible = true;

            res.destAccountField.disabled = true;
            res.currencyField.disabled = true;
        }

        if (model.enabled) {
            if (!model.isDifferent) {
                res.destAmountField = { value: '', disabled: true };
            } else {
                res.destAmountField.disabled = !model.isDifferent;
            }
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
            res.dest_curr = model.currency.id;
            res.src_amount = normalize(model.amount);
            if (model.isDifferent) {
                res.dest_amount = normalize(model.destAmount);
            } else {
                res.dest_amount = res.src_amount;
            }
        } else if (res.type === INCOME) {
            res.src_id = 0;
            res.dest_id = model.mainAccount.id;
            res.src_curr = model.currency.id;
            res.dest_curr = model.mainAccount.curr_id;
            res.dest_amount = normalize(model.amount);
            if (model.isDifferent) {
                res.src_amount = normalize(model.destAmount);
            } else {
                res.src_amount = res.dest_amount;
            }
        } else if (res.type === TRANSFER) {
            assert(model.destAccount, 'Account not found');

            const isFrom = (model.type === 'transferfrom');
            const srcAccount = (isFrom) ? model.mainAccount : model.destAccount;
            const destAccount = (isFrom) ? model.destAccount : model.mainAccount;

            res.src_id = srcAccount.id;
            res.dest_id = destAccount.id;
            res.src_curr = srcAccount.curr_id;
            res.dest_curr = destAccount.curr_id;
            if (isFrom) {
                res.src_amount = normalize(model.amount);
                res.dest_amount = (model.isDifferent)
                    ? normalize(model.destAmount)
                    : res.src_amount;
            } else {
                res.dest_amount = normalize(model.amount);
                res.src_amount = (model.isDifferent)
                    ? normalize(model.destAmount)
                    : res.dest_amount;
            }
        } else if (res.type === DEBT) {
            assert(model.person, 'Person not found');

            res.acc_id = model.mainAccount.id;
            res.person_id = model.person.id;
            res.op = (model.type === 'debtto') ? 1 : 2;
            res.src_curr = model.mainAccount.curr_id;
            res.dest_curr = model.mainAccount.curr_id;
            res.src_amount = normalize(model.amount);
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

        const amount = parseFloat(fixFloat(res.original.accountAmount));
        const destAmount = parseFloat(fixFloat(res.original.transactionAmount));
        res.type = (amount > 0) ? 'income' : 'expense';
        res.amount = Math.abs(amount);
        res.destId = 0;
        res.destAccount = null;
        if (res.original.accountCurrency === res.original.transactionCurrency) {
            res.currId = res.mainAccount.curr_id;
            res.destAmount = '';
        } else {
            const currency = Currency.findByName(res.original.transactionCurrency);
            assert(currency, `Currency ${res.original.transactionCurrency} not found`);
            res.currId = currency.id;
            res.destAmount = Math.abs(destAmount);
        }

        res.currency = Currency.getById(res.currId);
        res.personId = 0;
        res.person = null;
        res.date = res.original.date;
        res.comment = res.original.comment;
        res.isDifferent = this.isDifferentCurrencies(res);
        res.invalidated = false;

        return res;
    }

    async toggleEnable() {
        this.model.enabled = !this.model.enabled;
        this.expectedState = this.getExpectedState(this.model);

        await check(this.content.enableCheck);
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

        if (((res.type === 'expense' || res.type === 'income')
            && !res.isDifferent)
            || (res.type === 'debtfrom' || res.type === 'debtto')
        ) {
            res.currId = res.mainAccount.curr_id;
        } else if (res.type === 'transferfrom' || res.type === 'transferto') {
            if (res.destAccount && res.destAccount.id === res.mainAccount.id) {
                res.destId = App.state.accounts.getNext(res.destId);
            }
            res.destAccount = App.state.accounts.getItem(res.destId);
            res.currId = res.destAccount.curr_id;
        }
        res.currency = Currency.getById(res.currId);
        res.isDifferent = this.isDifferentCurrencies(res);

        return res;
    }

    async changeType(value) {
        this.checkEnabled(this.content.typeField);

        const typeBefore = this.model.type;
        const isDiffBefore = this.model.isDifferent;
        this.model.type = value;
        if (value === 'expense' || value === 'income') {
            this.model.destId = 0;
            this.model.destAccount = null;
            this.model.destAmount = '';
            if (!isDiffBefore || (typeBefore !== 'expense' && typeBefore !== 'income')) {
                this.model.currId = this.model.mainAccount.curr_id;
            }
            this.model.personId = 0;
        } else if (value === 'transferfrom' || value === 'transferto') {
            // Get first available account if was not previously selected
            if (!this.model.destAccount) {
                this.model.destId = App.state.accounts.getNext();
                this.model.destAccount = App.state.accounts.getItem(this.model.destId);
            }
            // Get next available account if selected same as main account
            if (this.model.destAccount
                && this.model.destAccount.id === this.model.mainAccount.id) {
                this.model.destId = App.state.accounts.getNext(this.model.destId);
            }
            this.model.destAccount = App.state.accounts.getItem(this.model.destId);
            this.model.currId = this.model.destAccount.curr_id;
            this.model.personId = 0;
        } else if (value === 'debtfrom' || value === 'debtto') {
            const person = App.state.persons.getItemByIndex(0);
            this.model.personId = person.id;
            this.model.destId = 0;
            this.model.destAccount = null;
            this.model.destAmount = '';
            this.model.currId = this.model.mainAccount.curr_id;
        }
        this.model.currency = Currency.getById(this.model.currId);
        this.model.person = App.state.persons.getItem(this.model.personId);
        this.model.isDifferent = this.isDifferentCurrencies(this.model);
        this.model.invalidated = false;
        this.expectedState = this.getExpectedState(this.model);

        await this.content.typeField.dropDown.selectItem(value);
        await this.parse();

        return this.checkState();
    }

    async changeDestAccount(value) {
        this.checkEnabled(this.content.destAccountField);

        const accountId = parseInt(value, 10);
        assert(accountId, `Invalid account id: ${value}`);
        assert(this.model.mainAccount.id !== accountId, `Can't select same account as main: ${value}`);

        this.model.destId = value;
        this.model.destAccount = App.state.accounts.getItem(value);
        this.model.currId = this.model.destAccount.curr_id;
        this.model.currency = Currency.getById(this.model.currId);
        this.model.isDifferent = this.isDifferentCurrencies(this.model);
        this.model.invalidated = false;
        this.expectedState = this.getExpectedState(this.model);

        await this.content.destAccountField.dropDown.selectItem(value);
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

    async inputAmount(value) {
        this.checkEnabled(this.content.amountField);

        this.model.amount = value;
        this.model.invalidated = false;
        this.expectedState = this.getExpectedState(this.model);

        await input(this.content.amountField.inputElem, value);
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

    async changeCurrency(value) {
        this.checkEnabled(this.content.currencyField);

        this.model.currId = value;
        this.model.currency = Currency.getById(value);
        this.model.isDifferent = this.isDifferentCurrencies(this.model);
        this.model.invalidated = false;
        this.expectedState = this.getExpectedState(this.model);

        await this.content.currencyField.dropDown.selectItem(value);
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

        const isDifferent = (item.src_curr !== item.dest_curr);
        const res = {
            enabled: item.enabled,
            typeField: { disabled: !item.enabled },
            amountField: { disabled: !item.enabled },
            dateField: {
                value: item.date,
                disabled: !item.enabled,
            },
            commentField: {
                value: item.comment,
                disabled: !item.enabled,
            },
        };

        res.typeField.value = item.type;
        if (item.type === 'expense') {
            res.amountField.value = item.src_amount.toString();
            res.destAmountField = {
                value: (isDifferent) ? item.dest_amount.toString() : '',
                disabled: (item.enabled) ? !isDifferent : true,
            };
            res.destAccountField = {
                value: item.dest_id.toString(),
                disabled: true,
            };
            res.currencyField = {
                value: item.dest_curr.toString(),
                disabled: !item.enabled,
            };
            res.personField = {
                value: '0',
                disabled: true,
            };
        } else if (item.type === 'income') {
            res.amountField.value = item.dest_amount.toString();
            // Use destination account and amount fields as source for income
            res.destAmountField = {
                value: (isDifferent) ? item.src_amount.toString() : '',
                disabled: (item.enabled) ? !isDifferent : true,
            };
            res.destAccountField = {
                value: item.src_id.toString(),
                disabled: true,
            };
            res.currencyField = {
                value: item.src_curr.toString(),
                disabled: !item.enabled,
            };
            res.personField = {
                value: '0',
                disabled: true,
            };
        } else if (item.type === 'transferfrom' || item.type === 'transferto') {
            const isFrom = (item.type === 'transferfrom');

            res.amountField.value = ((isFrom) ? item.src_amount : item.dest_amount).toString();
            res.destAmountField = {
                value: (isDifferent)
                    ? ((isFrom) ? item.dest_amount : item.src_amount).toString()
                    : '',
                disabled: (item.enabled) ? !isDifferent : true,
            };
            res.destAccountField = {
                value: ((isFrom) ? item.dest_id : item.src_id).toString(),
                disabled: !item.enabled,
            };
            res.currencyField = {
                value: ((isFrom) ? item.dest_curr : item.src_curr).toString(),
                disabled: true,
            };
            res.personField = {
                value: '0',
                disabled: true,
            };
        } else if (item.type === 'debtfrom' || item.type === 'debtto') {
            res.amountField.value = item.src_amount.toString();
            res.destAmountField = {
                value: '',
                disabled: true,
            };
            res.destAccountField = {
                value: '0',
                disabled: true,
            };
            res.currencyField = {
                value: item.dest_curr.toString(),
                disabled: true,
            };
            res.personField = {
                value: item.person_id.toString(),
                disabled: !item.enabled,
            };
        }

        return res;
    }
}
