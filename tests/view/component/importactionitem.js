import { Component } from './component.js';
import { ImportAction } from '../../model/importaction.js';
import { App } from '../../app.js';

export class ImportActionItem extends Component {
    async parse() {
        if (!this.elem) {
            throw new Error('Invalid import action item');
        }

        this.typeTitle = { elem: await this.query(this.elem, '.action-item__type') };
        this.valueTitle = { elem: await this.query(this.elem, '.action-item__value') };
        if (!this.typeTitle.elem || !this.valueTitle.elem) {
            throw new Error('Invalid structure of action item');
        }

        this.typeTitle.value = await this.prop(this.typeTitle.elem, 'textContent');
        this.valueTitle.value = await this.prop(this.valueTitle.elem, 'textContent');

        this.model = this.buildModel(this);
    }

    buildModel(cont) {
        const res = {};

        const actionName = cont.typeTitle.value;
        const actionType = ImportAction.findActionByName(actionName);
        if (!actionType) {
            throw new Error(`Unknown action: '${actionName}'`);
        }
        res.actionType = actionType.id;

        const { value } = cont.valueTitle;
        if (ImportAction.isTransactionTypeValue(actionType.id)) {
            const transactionType = ImportAction.findTransactionTypeByName(value);
            if (!transactionType) {
                throw new Error(`Unknown transaction type: '${value}'`);
            }

            res.value = transactionType.id;
        } else if (ImportAction.isAccountValue(actionType.id)) {
            const account = App.state.accounts.findByName(value);
            if (!account) {
                throw new Error(`Account not found: '${value}'`);
            }

            res.value = account.id;
        } else if (ImportAction.isPersonValue(actionType.id)) {
            const person = App.state.persons.findByName(value);
            if (!person) {
                throw new Error(`Person not found: '${value}'`);
            }

            res.value = person.id;
        } else if (ImportAction.isAmountValue(actionType.id)) {
            const amount = parseFloat(value);
            if (Number.isNaN(amount) || amount === 0) {
                throw new Error(`Invalid amount value: '${value}'`);
            }

            res.value = amount;
        } else {
            res.value = value;
        }

        return res;
    }

    static getExpectedState(model) {
        const res = {
            visibility: {
                typeTitle: true,
                valueTitle: true,
            },
            values: {
                typeTitle: {},
                valueTitle: {},
            },
        };

        const actionType = ImportAction.getActionById(model.actionType);
        if (!actionType) {
            throw new Error(`Unknown action type: '${model.actionType}'`);
        }
        res.values.typeTitle.value = actionType.title;

        let value;
        if (ImportAction.isTransactionTypeValue(actionType.id)) {
            const transactionType = ImportAction.getTransactionTypeById(model.value);
            if (!transactionType) {
                throw new Error(`Unknown transaction type: '${model.value}'`);
            }

            value = transactionType.title;
        } else if (ImportAction.isAccountValue(actionType.id)) {
            const account = App.state.accounts.getItem(model.value);
            if (!account) {
                throw new Error(`Account not found: '${model.value}'`);
            }

            value = account.name;
        } else if (ImportAction.isPersonValue(actionType.id)) {
            const person = App.state.persons.getItem(model.value);
            if (!person) {
                throw new Error(`Person not found: '${model.value}'`);
            }

            value = person.name;
        } else if (ImportAction.isAmountValue(actionType.id)) {
            const amount = parseFloat(model.value);
            if (Number.isNaN(amount) || amount === 0) {
                throw new Error(`Invalid amount value: '${model.value}'`);
            }

            value = amount;
        } else {
            value = model.value;
        }
        res.values.valueTitle.value = value.toString();

        return res;
    }
}
