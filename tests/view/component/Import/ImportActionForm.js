import { assert } from '@jezvejs/assert';
import {
    TestComponent,
    query,
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
    static getExpectedState(model) {
        const res = {
            actionField: {
                visible: true,
                value: model.actionType.toString(),
                dropDown: {
                    items: model.actionsAvailable.map((id) => ({ id })),
                },
            },
            feedbackElem: { visible: model.feedbackVisible },
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

    static getStateName(model) {
        assert(model.actionType in actionValueMap, `Invalid action type: ${model.actionType}`);

        return actionValueMap[model.actionType];
    }

    static getStateValue(model) {
        const actionValue = this.getStateName(model);
        assert(actionValue in model, `Invalid action value: ${actionValue}`);

        return model[actionValue];
    }

    async parseContent() {
        assert(this.elem, 'Invalid import action form');

        const res = {
            feedbackElem: { elem: await query(this.elem, '.invalid-feedback') },
            deleteBtn: { elem: await query(this.elem, '.delete-btn') },
        };

        [
            res.deleteBtn.visible,
        ] = await evaluate(
            (...elems) => elems.map((el) => (el && !el.hidden)),
            res.deleteBtn.elem,
        );

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
            && res.feedbackElem.elem
            && res.deleteBtn.elem,
            'Invalid structure of import action form',
        );

        return res;
    }

    async parseField(fieldElem) {
        const elem = await fieldElem;
        assert(elem, 'Invalid field element');

        const res = await evaluate((el) => ({
            dropDown: el?.classList?.contains('dd__container'),
            visible: el && !el.hidden,
            disabled: el.disabled,
            value: el.value,
        }), elem);

        if (res.dropDown) {
            res.dropDown = await DropDown.create(this, elem);
            assert(res.dropDown, 'Invalid structure of field element');

            res.disabled = res.dropDown.disabled;
            res.value = res.dropDown.value;
        } else {
            res.inputElem = elem;
        }

        res.elem = elem;

        return res;
    }

    buildModel(cont) {
        const res = {
            actionType: parseInt(cont.actionField.value, 10),
            actionsAvailable: cont.actionField.dropDown.items.map(({ id }) => id),
            transType: cont.transTypeField.value,
            account: parseInt(cont.accountField.value, 10),
            person: parseInt(cont.personField.value, 10),
            category: parseInt(cont.categoryField.value, 10),
            amount: cont.amountField.value,
            text: cont.textField.value,
            feedbackVisible: cont.feedbackElem.visible,
        };

        res.state = ImportActionForm.getStateName(res);
        res.value = ImportActionForm.getStateValue(res);

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
