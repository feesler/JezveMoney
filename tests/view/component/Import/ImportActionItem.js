import {
    TestComponent,
    assert,
    query,
    prop,
} from 'jezve-test';
import { ImportAction } from '../../../model/ImportAction.js';
import { ImportTransaction } from '../../../model/ImportTransaction.js';
import { App } from '../../../Application.js';

export class ImportActionItem extends TestComponent {
    async parseContent() {
        assert(this.elem, 'Invalid import action item');

        const res = {
            typeTitle: { elem: await query(this.elem, '.action-item__type') },
            valueTitle: { elem: await query(this.elem, '.action-item__value') },
        };
        assert(
            res.typeTitle.elem
            && res.valueTitle.elem,
            'Invalid structure of action item',
        );

        res.typeTitle.value = await prop(res.typeTitle.elem, 'textContent');
        res.valueTitle.value = await prop(res.valueTitle.elem, 'textContent');

        return res;
    }

    buildModel(cont) {
        const res = {};

        const actionName = cont.typeTitle.value;
        const actionType = ImportAction.findActionByName(actionName);
        assert(actionType, `Unknown action: '${actionName}'`);
        res.actionType = actionType.id;

        const { value } = cont.valueTitle;
        if (ImportAction.isTransactionTypeValue(actionType.id)) {
            const transactionType = ImportTransaction.findTypeByName(value);
            assert(transactionType, `Unknown transaction type: '${value}'`);

            res.value = transactionType.id;
        } else if (ImportAction.isAccountValue(actionType.id)) {
            const account = App.state.accounts.findByName(value);
            assert(account, `Account not found: '${value}'`);

            res.value = account.id;
        } else if (ImportAction.isPersonValue(actionType.id)) {
            const person = App.state.persons.findByName(value);
            assert(person, `Person not found: '${value}'`);

            res.value = person.id;
        } else if (ImportAction.isAmountValue(actionType.id)) {
            const amount = parseFloat(value);
            assert(
                !Number.isNaN(amount) && amount !== 0,
                `Invalid amount value: '${value}'`,
            );

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
        assert(actionType, `Unknown action type: '${model.actionType}'`);
        res.typeTitle.value = actionType.title;

        let value;
        if (ImportAction.isTransactionTypeValue(actionType.id)) {
            const transactionType = ImportTransaction.getTypeById(model.value);
            assert(transactionType, `Unknown transaction type: '${model.value}'`);

            value = transactionType.title;
        } else if (ImportAction.isAccountValue(actionType.id)) {
            const account = App.state.accounts.getItem(model.value);
            assert(account, `Account not found: '${model.value}'`);

            value = account.name;
        } else if (ImportAction.isPersonValue(actionType.id)) {
            const person = App.state.persons.getItem(model.value);
            assert(person, `Person not found: '${model.value}'`);

            value = person.name;
        } else if (ImportAction.isAmountValue(actionType.id)) {
            const amount = parseFloat(model.value);
            assert(
                !Number.isNaN(amount) && amount !== 0,
                `Invalid amount value: '${model.value}'`,
            );

            value = amount;
        } else {
            value = model.value;
        }
        res.valueTitle.value = value.toString();

        return res;
    }
}
