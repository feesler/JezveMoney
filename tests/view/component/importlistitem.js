import { Component } from './component.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    availTransTypes,
} from '../../model/transaction.js';
import { Currency } from '../../model/currency.js';
import {
    normalize,
    setParam,
    copyObject,
    asyncMap,
} from '../../common.js';
import { App } from '../../app.js';

export class ImportListItem extends Component {
    constructor(parent, elem, mainAccount) {
        super(parent, elem);

        this.mainAccount = mainAccount;

        this.model = {};
    }

    mapField(field) {
        const fieldsMap = {
            typeField: 'Type',
            amountField: 'Amount',
            destAmountField: 'Destination amount',
            destAccountField: 'Destination account',
            personField: 'Person',
            currencyField: 'Currency',
            dateField: 'Date',
            commentField: 'Comment',
        };

        if (!field || !field.title) {
            throw new Error('Invalid field');
        }

        for (const fieldName in fieldsMap) {
            if (fieldsMap[fieldName] === field.title) {
                this[fieldName] = field;
                return;
            }
        }

        throw new Error(`Unknown field '${field.title}'`);
    }

    async parseField(elem) {
        const res = { elem };

        if (!res.elem) {
            throw new Error('Invalid field element');
        }

        res.labelElem = await this.query(elem, ':scope > label');
        res.inputElem = await this.query(elem, ':scope > div > *');
        if (!res.labelElem || !res.inputElem) {
            throw new Error('Invalid structure of field element');
        }

        res.title = await this.prop(res.labelElem, 'textContent');

        res.disabled = await this.prop(res.inputElem, 'disabled');
        res.value = await this.prop(res.inputElem, 'value');

        res.environment = this.environment;
        if (res.environment) {
            res.environment.inject(res);
        }

        this.mapField(res);

        return res;
    }

    async parse() {
        this.enableCheck = await this.query(this.elem, '.enable-check input[type="checkbox"]');
        if (!this.enableCheck) {
            throw new Error('Invalid structure of import item');
        }
        this.enabled = await this.prop(this.enableCheck, 'checked');

        const fieldElems = await this.queryAll(this.elem, '.field');
        await asyncMap(fieldElems, (field) => this.parseField(field));

        this.deleteBtn = await this.query(this.elem, '.delete-btn');
        this.toggleBtn = await this.query(this.elem, '.toggle-btn');

        if (
            !this.typeField
            || !this.amountField
            || !this.destAmountField
            || !this.destAccountField
            || !this.personField
            || !this.currencyField
            || !this.dateField
            || !this.commentField
            || !this.deleteBtn
        ) {
            throw new Error('Invalid structure of import item');
        }

        this.model = await this.buildModel();
        this.data = this.getExpectedTransaction(this.model);
        this.data.enabled = this.model.enabled;
        this.data.mainAccount = this.model.mainAccount;
    }

    isDifferentCurrencies(model) {
        if (model.type === 'expense' || model.type === 'income') {
            if (!model.currency) {
                return false;
            }

            return (model.mainAccount.curr_id !== model.currency.id);
        }

        if (model.type === 'transferfrom' || model.type === 'transferto') {
            return (model.mainAccount.curr_id !== model.destAccount.curr_id);
        }

        if (model.type === 'debtfrom' || model.type === 'debtto') {
            return false;
        }

        throw new Error('Invalid transaction type');
    }

    async buildModel() {
        const res = {};

        res.mainAccount = App.state.accounts.getItem(this.mainAccount);
        if (!res.mainAccount) {
            throw new Error('Main account not found');
        }

        res.enabled = this.enabled;
        res.type = this.typeField.value;
        res.amount = this.amountField.value;
        res.destAmount = this.destAmountField.value;

        res.destId = this.destAccountField.value;
        res.destAccount = App.state.accounts.getItem(res.destId);

        res.personId = this.personField.value;
        res.person = App.state.persons.getItem(res.personId);

        res.currId = this.currencyField.value;
        res.currency = Currency.getById(res.currId);

        res.date = this.dateField.value;
        res.comment = this.commentField.value;

        res.isDifferent = this.isDifferentCurrencies(res);

        return res;
    }

    getExpectedState(model) {
        const res = {
            visibility: {
                typeField: true,
                amountField: true,
                currencyField: true,
                dateField: true,
                commentField: true,
            },
            values: {
                enabled: model.enabled,
                typeField: {
                    value: model.type.toString(),
                    disabled: !model.enabled,
                },
                amountField: {
                    value: model.amount.toString(),
                    disabled: !model.enabled,
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
                },
                personField: {
                    value: model.personId.toString(),
                },
                dateField: {
                    value: model.date.toString(),
                    disabled: !model.enabled,
                },
                commentField: {
                    value: model.comment.toString(),
                    disabled: !model.enabled,
                },
            },
        };

        if (model.type === 'expense') {
            setParam(res.visibility, {
                destAmountField: model.isDifferent,
                destAccountField: false,
                personField: false,
            });

            res.values.destAccountField.disabled = true;
            res.values.personField.disabled = true;
        } else if (model.type === 'income') {
            setParam(res.visibility, {
                destAmountField: model.isDifferent,
                destAccountField: false,
                personField: false,
            });

            res.values.destAccountField.disabled = true;
            res.values.personField.disabled = true;
        } else if (model.type === 'transferfrom' || model.type === 'transferto') {
            setParam(res.visibility, {
                destAmountField: model.isDifferent,
                destAccountField: true,
                personField: false,
            });

            if (model.enabled) {
                res.values.destAccountField.disabled = false;
            }
            res.values.currencyField.disabled = true;
            res.values.personField.disabled = true;
        } else if (model.type === 'debtfrom' || model.type === 'debtto') {
            setParam(res.visibility, {
                destAmountField: false,
                destAccountField: false,
                personField: true,
            });

            res.values.destAccountField.disabled = true;
            res.values.currencyField.disabled = true;
        }

        if (model.enabled) {
            if (!model.isDifferent) {
                res.values.destAmountField = { value: '', disabled: true };
            } else {
                res.values.destAmountField.disabled = !model.isDifferent;
            }
        }

        return res;
    }

    getExpectedTransaction(model) {
        const res = {
            type: ImportListItem.typeFromString(model.type),
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
            if (!model.destAccount) {
                throw new Error('Account not found');
            }

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
            if (!model.person) {
                throw new Error('Person not found');
            }

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

    async toggleEnable() {
        this.model.enabled = !this.model.enabled;
        this.expectedState = this.getExpectedState(this.model);

        await this.click(this.enableCheck);
        await this.onChange(this.enableCheck);
        await this.parse();

        return this.checkState();
    }

    checkEnabled(field) {
        if (!field) {
            throw new Error('Invalid field');
        }

        if (field.disabled) {
            throw new Error(`'${field.title}' field is disabled`);
        }
    }

    getFirstAvailAccount (state) {
        const userAccountsData = App.state.accounts.getUserAccounts(App.owner_id);
        var userAccounts = new AccountList(userAccountsData);
        var visibleAccounts = userAccounts.getVisible();
        var res = visibleAccounts[0];

        if (res.id === state.accountId) {
            res = visibleAccounts[1];
        }

        return res;
    }

    onChangeMainAccount(value) {
        const res = copyObject(this.model);

        res.mainAccount = App.state.accounts.getItem(value);
        if (!res.mainAccount) {
            throw new Error(`Invalid account ${value}`);
        }

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
        this.checkEnabled(this.typeField);

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
            const persons = App.state.getPersonsByIndexes(0);
            [this.model.personId] = persons;
            this.model.destId = 0;
            this.model.destAccount = null;
            this.model.destAmount = '';
            this.model.currId = this.model.mainAccount.curr_id;
        }
        this.model.currency = Currency.getById(this.model.currId);
        this.model.person = App.state.persons.getItem(this.model.personId);
        this.model.isDifferent = this.isDifferentCurrencies(this.model);
        this.expectedState = this.getExpectedState(this.model);

        await this.selectByValue(this.typeField.inputElem, value);
        await this.onChange(this.typeField.inputElem);
        await this.parse();

        return this.checkState();
    }

    async changeDestAccount(value) {
        this.checkEnabled(this.destAccountField);

        const accountId = parseInt(value, 10);
        if (!accountId) {
            throw new Error(`Invalid account id: ${value}`);
        }
        if (this.model.mainAccount.id === accountId) {
            throw new Error(`Can't select same account as main: ${value}`);
        }

        this.model.destId = value;
        this.model.destAccount = App.state.accounts.getItem(value);
        this.model.currId = this.model.destAccount.curr_id;
        this.model.currency = Currency.getById(this.model.currId);
        this.model.isDifferent = this.isDifferentCurrencies(this.model);
        this.expectedState = this.getExpectedState(this.model);

        await this.selectByValue(this.destAccountField.inputElem, value);
        await this.onChange(this.destAccountField.inputElem);
        await this.parse();

        return this.checkState();
    }

    async changePerson(value) {
        this.checkEnabled(this.personField);

        this.model.personId = value;
        this.model.person = App.state.persons.getItem(value);
        this.expectedState = this.getExpectedState(this.model);

        await this.selectByValue(this.personField.inputElem, value);
        await this.onChange(this.personField.inputElem);
        await this.parse();

        return this.checkState();
    }

    async inputAmount(value) {
        this.checkEnabled(this.amountField);

        this.model.amount = value;
        this.expectedState = this.getExpectedState(this.model);

        await this.input(this.amountField.inputElem, value);
        await this.parse();

        return this.checkState();
    }

    async inputDestAmount(value) {
        this.checkEnabled(this.destAmountField);

        this.model.destAmount = value;
        this.expectedState = this.getExpectedState(this.model);

        await this.input(this.destAmountField.inputElem, value);
        await this.parse();

        return this.checkState();
    }

    async changeCurrency(value) {
        this.checkEnabled(this.currencyField);

        this.model.currId = value;
        this.model.currency = Currency.getById(value);
        this.model.isDifferent = this.isDifferentCurrencies(this.model);
        this.expectedState = this.getExpectedState(this.model);

        await this.selectByValue(this.currencyField.inputElem, value.toString());
        await this.onChange(this.currencyField.inputElem);
        await this.parse();

        return this.checkState();
    }

    async inputDate(value) {
        this.checkEnabled(this.dateField);

        this.model.date = value;
        this.expectedState = this.getExpectedState(this.model);

        await this.input(this.dateField.inputElem, value);
        await this.parse();

        return this.checkState();
    }

    async inputComment(value) {
        this.checkEnabled(this.commentField);

        this.model.comment = value;
        this.expectedState = this.getExpectedState(this.model);

        await this.input(this.commentField.inputElem, value);
        await this.parse();

        return this.checkState();
    }

    async clickDelete() {
        return this.click(this.deleteBtn);
    }

    static typeFromString(str) {
        if (typeof str !== 'string') {
            throw new Error('Invalid parameter');
        }

        const typeMap = {
            expense: EXPENSE,
            income: INCOME,
            transferfrom: TRANSFER,
            transferto: TRANSFER,
            debtfrom: DEBT,
            debtto: DEBT,
        };

        const lstr = str.toLowerCase();
        if (!(lstr in typeMap)) {
            throw new Error(`Unknown type: ${str}`);
        }

        return typeMap[lstr];
    }

    /**
     * Convert transaction object to expected state of component
     * Transaction object: { mainAccount, enabled, ...fields of transaction }
     * @param {Object} item - transaction item object
     * @param {AppState} state - application state
     */
    static render(item, state) {
        if (!item || !state) {
            throw new Error('Invalid parameters');
        }
        if (!item.mainAccount) {
            throw new Error('Main account not defined');
        }
        if (!availTransTypes.includes(item.type)) {
            throw new Error(`Invalid type of transaction: ${item.type}`);
        }

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

        if (item.type === EXPENSE) {
            res.typeField.value = 'expense';
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
        } else if (item.type === INCOME) {
            res.typeField.value = 'income';
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
        } else if (item.type === TRANSFER) {
            const isFrom = (item.mainAccount.id === item.src_id);

            res.typeField.value = (isFrom) ? 'transferfrom' : 'transferto';
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
        } else if (item.type === DEBT) {
            res.typeField.value = (item.op === 1)
                ? 'debtto'
                : 'debtfrom';
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
