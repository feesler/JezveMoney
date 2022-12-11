import {
    TestComponent,
    assert,
    query,
    hasClass,
    click,
    input,
    asyncMap,
    evaluate,
} from 'jezve-test';
import { DropDown } from 'jezvejs-test';
import {
    IMPORT_ACTION_SET_TR_TYPE,
    IMPORT_ACTION_SET_ACCOUNT,
    IMPORT_ACTION_SET_PERSON,
    IMPORT_ACTION_SET_SRC_AMOUNT,
    IMPORT_ACTION_SET_DEST_AMOUNT,
    IMPORT_ACTION_SET_COMMENT,
    IMPORT_ACTION_SET_CATEGORY,
} from '../../../model/ImportAction.js';

const actionValueTypes = [
    'transType',
    'account',
    'person',
    'category',
    'amount',
    'text',
];

const actionValueMap = {
    [IMPORT_ACTION_SET_TR_TYPE]: 'transType',
    [IMPORT_ACTION_SET_ACCOUNT]: 'account',
    [IMPORT_ACTION_SET_PERSON]: 'person',
    [IMPORT_ACTION_SET_SRC_AMOUNT]: 'amount',
    [IMPORT_ACTION_SET_DEST_AMOUNT]: 'amount',
    [IMPORT_ACTION_SET_COMMENT]: 'text',
    [IMPORT_ACTION_SET_CATEGORY]: 'category',
};

const fieldSelectors = [
    '.action-type-field',
    '.trans-type-field',
    '.account-field',
    '.person-field',
    '.category-field',
    '.amount-field',
    '.action-value-field',
];

/** Import action form */
export class ImportActionForm extends TestComponent {
    async parseContent() {
        assert(this.elem, 'Invalid import action form');

        const res = {
            deleteBtn: { elem: await query(this.elem, '.delete-btn') },
        };

        [
            res.actionField,
            res.transTypeField,
            res.accountField,
            res.personField,
            res.categoryField,
            res.amountField,
            res.textField,
        ] = await asyncMap(
            fieldSelectors,
            (selector) => this.parseField(query(this.elem, selector)),
        );

        assert(
            res.actionField
            && res.transTypeField
            && res.accountField
            && res.personField
            && res.categoryField
            && res.amountField
            && res.textField
            && res.deleteBtn.elem,
            'Invalid structure of import action form',
        );

        return res;
    }

    async parseField(el) {
        const elem = await el;
        assert(elem, 'Invalid field element');

        let res;

        const isDropDown = await hasClass(elem, 'dd__container');
        if (isDropDown) {
            const dropDown = await DropDown.create(this, elem);
            assert(dropDown, 'Invalid structure of field element');

            res = {
                dropDown,
                disabled: dropDown.disabled,
                value: dropDown.value,
            };
        } else {
            res = await evaluate((inputEl) => ({
                disabled: inputEl.disabled,
                value: inputEl.value,
            }), elem);
            res.inputElem = elem;
        }

        res.elem = elem;

        return res;
    }

    static getStateName(model) {
        assert(model.actionType in actionValueMap, `Invalid action type: ${model.actionType}`);

        return actionValueMap[model.actionType];
    }

    static getStateValue(model) {
        const actionValue = this.getStateName(model);
        assert(actionValue in model, `Invalid action value: ${actionValue}`);

        return model[actionValue];
    }

    async buildModel(cont) {
        const res = {
            actionType: parseInt(cont.actionField.value, 10),
            actionsAvailable: cont.actionField.dropDown.items.map(({ id }) => id),
            transType: cont.transTypeField.value,
            account: parseInt(cont.accountField.value, 10),
            person: parseInt(cont.personField.value, 10),
            category: parseInt(cont.categoryField.value, 10),
            amount: cont.amountField.value,
            text: cont.textField.value,
        };

        res.state = ImportActionForm.getStateName(res);
        res.value = ImportActionForm.getStateValue(res);

        return res;
    }

    static getExpectedState(model) {
        const res = {
            actionField: {
                visible: true,
                value: model.actionType.toString(),
                dropDown: {
                    items: model.actionsAvailable.map((id) => ({ id })),
                },
            },
            deleteBtn: { visible: true },
        };

        const state = ImportActionForm.getStateName(model);

        actionValueTypes.forEach((fieldName) => {
            const controlName = `${fieldName}Field`;
            const visible = state === fieldName;

            if (!res[controlName]) {
                res[controlName] = {};
            }
            res[controlName].visible = visible;
            if (visible) {
                res[controlName].value = model.value.toString();
            }
        });

        return res;
    }

    async changeAction(value) {
        const actionId = parseInt(value, 10);
        await this.content.actionField.dropDown.selectItem(actionId);
    }

    async changeValue(name, value) {
        assert(this.model.state === name, 'Invalid state');

        const control = this.content[`${name}Field`];
        if (control.dropDown) {
            await control.dropDown.selectItem(value);
        } else {
            await input(control.inputElem, value.toString());
        }
    }

    async changeTransactionType(value) {
        return this.changeValue('transType', value);
    }

    async changeAccount(value) {
        return this.changeValue('account', value);
    }

    async changePerson(value) {
        return this.changeValue('person', value);
    }

    async changeCategory(value) {
        return this.changeValue('category', value);
    }

    async inputAmount(value) {
        return this.changeValue('amount', value);
    }

    async inputValue(value) {
        return this.changeValue('text', value);
    }

    async clickDelete() {
        return click(this.content.deleteBtn.elem);
    }
}
