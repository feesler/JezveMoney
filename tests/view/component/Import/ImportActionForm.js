import { AppComponent } from '../AppComponent.js';
import { DropDown } from '../DropDown.js';
import {
    asyncMap,
} from '../../../common.js';
import {
    IMPORT_ACTION_SET_TR_TYPE,
    IMPORT_ACTION_SET_ACCOUNT,
    IMPORT_ACTION_SET_PERSON,
    IMPORT_ACTION_SET_SRC_AMOUNT,
    IMPORT_ACTION_SET_DEST_AMOUNT,
    IMPORT_ACTION_SET_COMMENT,
} from '../../../model/ImportAction.js';
import {
    query,
    queryAll,
    prop,
    click,
    input,
} from '../../../env.js';

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
export class ImportActionForm extends AppComponent {
    async parseContent() {
        if (!this.elem) {
            throw new Error('Invalid import action form');
        }

        const res = {
            deleteBtn: { elem: await query(this.elem, '.delete-btn') },
        };

        const fieldElems = await queryAll(this.elem, '.field');
        const fields = await asyncMap(fieldElems, (field) => this.parseField(field));
        fields.forEach((field) => { res[field.name] = field.component; });

        if (
            !res.actionField
            || !res.transTypeField
            || !res.accountField
            || !res.personField
            || !res.amountField
            || !res.textField
            || !res.deleteBtn.elem
        ) {
            throw new Error('Invalid structure of import action form');
        }

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

        if (!field || !field.title) {
            throw new Error('Invalid field');
        }

        for (const fieldName in fieldsMap) {
            if (fieldsMap[fieldName] === field.title) {
                return { name: fieldName, component: field };
            }
        }

        throw new Error(`Unknown field '${field.title}'`);
    }

    async parseField(elem) {
        const res = { elem };

        if (!res.elem) {
            throw new Error('Invalid field element');
        }

        res.labelElem = await query(elem, ':scope > label');
        if (!res.labelElem) {
            throw new Error('Invalid structure of field element');
        }
        res.title = await prop(res.labelElem, 'textContent');

        const dropDownElem = await query(elem, '.dd__container');
        if (dropDownElem) {
            res.dropDown = await DropDown.create(this, dropDownElem);
            if (!res.dropDown) {
                throw new Error('Invalid structure of field element');
            }
            res.disabled = res.dropDown.content.disabled;
            res.value = res.dropDown.content.value;
        } else {
            res.inputElem = await query(elem, ':scope > div > *');
            if (!res.inputElem) {
                throw new Error('Invalid structure of field element');
            }
            res.disabled = await prop(res.inputElem, 'disabled');
            res.value = await prop(res.inputElem, 'value');
        }

        return this.mapField(res);
    }

    static getStateName(model) {
        if (!(model.actionType in actionValueMap)) {
            throw new Error(`Invalid action type: ${model.actionType}`);
        }

        return actionValueMap[model.actionType];
    }

    static getStateValue(model) {
        const actionValue = this.getStateName(model);
        if (!(actionValue in model)) {
            throw new Error(`Invalid action value: ${actionValue}`);
        }

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
            visibility: {
                actionField: true,
                deleteBtn: true,
            },
            values: {
                actionField: { value: model.actionType.toString() },
            },
        };

        actionValueTypes.forEach((fieldName) => {
            const controlName = `${fieldName}Field`;
            const visible = model.state === fieldName;

            res.visibility[controlName] = visible;
            if (visible) {
                res.values[controlName] = { value: model.value.toString() };
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
        if (this.model.state !== name) {
            throw new Error('Invalid state');
        }

        this.model[name] = value;
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
