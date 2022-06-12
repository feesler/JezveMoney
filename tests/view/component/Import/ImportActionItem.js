import { TestComponent, query, prop } from 'jezve-test';
import { ImportAction } from '../../../model/ImportAction.js';
import { ImportTransaction } from '../../../model/ImportTransaction.js';
import { App } from '../../../Application.js';

export class ImportActionItem extends TestComponent {
    async parseContent() {
        if (!this.elem) {
            throw new Error('Invalid import action item');
        }

        const res = {
            typeTitle: { elem: await query(this.elem, '.action-item__type') },
            valueTitle: { elem: await query(this.elem, '.action-item__value') },
        };

        if (!res.typeTitle.elem || !res.valueTitle.elem) {
            throw new Error('Invalid structure of action item');
        }

        res.typeTitle.value = await prop(res.typeTitle.elem, 'textContent');
        res.valueTitle.value = await prop(res.valueTitle.elem, 'textContent');

        return res;
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
            const transactionType = ImportTransaction.findTypeByName(value);
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
            typeTitle: { visible: true },
            valueTitle: { visible: true },
        };

        const actionType = ImportAction.getActionById(model.actionType);
        if (!actionType) {
            throw new Error(`Unknown action type: '${model.actionType}'`);
        }
        res.typeTitle.value = actionType.title;

        let value;
        if (ImportAction.isTransactionTypeValue(actionType.id)) {
            const transactionType = ImportTransaction.getTypeById(model.value);
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
        res.valueTitle.value = value.toString();

        return res;
    }
}
