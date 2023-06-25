import { TestComponent, assert, evaluate } from 'jezve-test';
import { ImportAction } from '../../../model/ImportAction.js';
import { ImportTransaction } from '../../../model/ImportTransaction.js';
import { App } from '../../../Application.js';
import { __ } from '../../../model/locale.js';

/**
 * Import actions list item test component
 */
export class ImportActionItem extends TestComponent {
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

            value = __(transactionType.titleToken, App.view.locale);
        } else if (ImportAction.isAccountValue(actionType.id)) {
            const account = App.state.accounts.getItem(model.value);
            assert(account, `Account not found: '${model.value}'`);

            value = account.name;
        } else if (ImportAction.isPersonValue(actionType.id)) {
            const person = App.state.persons.getItem(model.value);
            assert(person, `Person not found: '${model.value}'`);

            value = person.name;
        } else if (ImportAction.isCategoryValue(actionType.id)) {
            const categoryId = parseInt(model.value, 10);
            const category = App.state.categories.getItem(model.value);
            if (categoryId !== 0) {
                assert(category, `Category not found: '${model.value}'`);
            }

            value = (categoryId !== 0) ? category.name : '';
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

    static render(item) {
        assert.instanceOf(item, ImportAction, 'Invalid item');

        const model = {
            actionType: item.action_id,
            value: item.value,
        };

        return this.getExpectedState(model);
    }

    async parseContent() {
        assert(this.elem, 'Invalid import action item');

        const res = await evaluate((el) => {
            const textElemState = (elem) => ({
                value: elem?.textContent,
                visible: !!elem && !elem.hidden,
            });

            return {
                typeTitle: textElemState(el.querySelector('.action-item__type')),
                valueTitle: textElemState(el.querySelector('.action-item__value')),
            };
        }, this.elem);

        assert(
            res.typeTitle.visible && res.valueTitle.visible,
            'Invalid structure of import action item',
        );

        return res;
    }

    buildModel(cont) {
        const res = {};

        const actionName = cont.typeTitle.value;
        const actionType = ImportAction.findActionByName(actionName, App.view.locale);
        assert(actionType, `Unknown action: '${actionName}'`);
        res.actionType = actionType.id;

        const { value } = cont.valueTitle;
        if (ImportAction.isTransactionTypeValue(actionType.id)) {
            const transactionType = ImportTransaction.findTypeByName(value, App.view.locale);
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
        } else if (ImportAction.isCategoryValue(actionType.id)) {
            const category = (value.length === 0)
                ? { id: 0 }
                : App.state.categories.findByName(value);
            assert(category, `Category not found: '${value}'`);

            res.value = category.id;
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
}
