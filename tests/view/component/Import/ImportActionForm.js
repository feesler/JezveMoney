import {
    TestComponent,
    assert,
    query,
    queryAll,
    prop,
    click,
    input,
} from 'jezve-test';
import { DropDown } from 'jezvejs/tests';
import {
    asyncMap,
    trimToDigitsLimit,
} from '../../../common.js';
import {
    IMPORT_ACTION_SET_TR_TYPE,
    IMPORT_ACTION_SET_ACCOUNT,
    IMPORT_ACTION_SET_PERSON,
    IMPORT_ACTION_SET_SRC_AMOUNT,
    IMPORT_ACTION_SET_DEST_AMOUNT,
    IMPORT_ACTION_SET_COMMENT,
} from '../../../model/ImportAction.js';

const actionValueTypes = [
    'transType',
    'account',
    'person',
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
};

/** Import action form */
export class ImportActionForm extends TestComponent {
    async parseContent() {
        assert(this.elem, 'Invalid import action form');

        const res = {
            deleteBtn: { elem: await query(this.elem, '.delete-btn') },
        };

        const fieldElems = await queryAll(this.elem, '.field');
        const fields = await asyncMap(fieldElems, (field) => this.parseField(field));
        fields.forEach((field) => { res[field.name] = field.component; });

        assert(
            res.actionField
            && res.transTypeField
            && res.accountField
            && res.personField
            && res.amountField
            && res.textField
            && res.deleteBtn.elem,
            'Invalid structure of import action form',
        );

        return res;
    }

    mapField(field) {
        const fieldsMap = {
            actionField: 'Action',
            transTypeField: 'Transaction type',
            accountField: 'Account',
            personField: 'Person',
            amountField: 'Amount',
            textField: 'Value',
        };

        assert(field?.title, 'Invalid field');

        let res = null;
        for (const fieldName in fieldsMap) {
            if (fieldsMap[fieldName] === field.title) {
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
            transType: cont.transTypeField.value,
            account: parseInt(cont.accountField.value, 10),
            person: parseInt(cont.personField.value, 10),
            amount: cont.amountField.value,
            text: cont.textField.value,
        };

        res.state = ImportActionForm.getStateName(res);
        res.value = ImportActionForm.getStateValue(res);

        return res;
    }

    static getExpectedState(model) {
        const res = {
            actionField: { value: model.actionType.toString(), visible: true },
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
        this.model.actionType = actionId;
        this.model.state = ImportActionForm.getStateName(this.model);
        this.model.value = ImportActionForm.getStateValue(this.model);
        this.expectedState = ImportActionForm.getExpectedState(this.model);

        await this.content.actionField.dropDown.selectItem(actionId);
        await this.parse();

        return this.checkState();
    }

    async changeValue(name, value) {
        assert(this.model.state === name, 'Invalid state');

        if (name === 'amount') {
            this.model[name] = trimToDigitsLimit(value, 2);
        } else {
            this.model[name] = value;
        }
        this.model.value = ImportActionForm.getStateValue(this.model);
        this.expectedState = ImportActionForm.getExpectedState(this.model);

        const control = this.content[`${name}Field`];
        if (control.dropDown) {
            await control.dropDown.selectItem(value);
        } else {
            await input(control.inputElem, value.toString());
        }
        await this.parse();

        return this.checkState();
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
