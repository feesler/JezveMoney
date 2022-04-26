import { TestComponent } from 'jezve-test';
import { DropDown } from '../DropDown.js';
import { asyncMap } from '../../../common.js';
import {
    IMPORT_COND_FIELD_MAIN_ACCOUNT,
    IMPORT_COND_FIELD_TPL,
    IMPORT_COND_FIELD_TR_AMOUNT,
    IMPORT_COND_FIELD_ACC_AMOUNT,
    IMPORT_COND_FIELD_TR_CURRENCY,
    IMPORT_COND_FIELD_ACC_CURRENCY,
    IMPORT_COND_FIELD_DATE,
    IMPORT_COND_FIELD_COMMENT,
    ImportCondition,
} from '../../../model/ImportCondition.js';
import {
    query,
    queryAll,
    prop,
    click,
    input,
    onChange,
} from '../../../env.js';

const fieldValueTypes = [
    'property',
    'account',
    'template',
    'amount',
    'currency',
    'text',
];

const fieldsMap = {
    fieldType: 'Property',
    operator: 'Operator',
    amount: 'Amount',
    account: 'Account',
    template: 'Template',
    currency: 'Currency',
    property: 'Value property',
    text: 'Value',
};

const fieldValueMap = {
    [IMPORT_COND_FIELD_MAIN_ACCOUNT]: 'account',
    [IMPORT_COND_FIELD_TPL]: 'template',
    [IMPORT_COND_FIELD_TR_AMOUNT]: 'amount',
    [IMPORT_COND_FIELD_ACC_AMOUNT]: 'amount',
    [IMPORT_COND_FIELD_TR_CURRENCY]: 'currency',
    [IMPORT_COND_FIELD_ACC_CURRENCY]: 'currency',
    [IMPORT_COND_FIELD_COMMENT]: 'text',
    [IMPORT_COND_FIELD_DATE]: 'text',
};

/** Import condition form */
export class ImportConditionForm extends TestComponent {
    async parseContent() {
        const res = {};

        const fieldElems = await queryAll(this.elem, '.field');
        const fields = await asyncMap(fieldElems, (field) => this.parseField(field));
        fields.forEach((field) => { res[field.name] = field.component; });

        res.fieldValueCheck = { elem: await query(this.elem, '.value-field .checkwrap input[type=checkbox]') };
        res.deleteBtn = { elem: await query(this.elem, '.delete-btn') };

        if (
            !res.fieldTypeField
            || !res.operatorField
            || !res.amountField
            || !res.accountField
            || !res.templateField
            || !res.currencyField
            || !res.propertyField
            || !res.textField
            || !res.fieldValueCheck.elem
            || !res.deleteBtn.elem
        ) {
            throw new Error('Invalid structure of import condition form');
        }

        res.fieldValueCheck.checked = await prop(res.fieldValueCheck.elem, 'checked');

        return res;
    }

    mapField(field) {
        if (!field || !field.title) {
            throw new Error('Invalid field');
        }

        for (const name in fieldsMap) {
            if (fieldsMap[name] === field.title) {
                return { name: `${name}Field`, component: field };
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
        if (model.isFieldValue) {
            return 'property';
        }

        if (!(model.fieldType in fieldValueMap)) {
            throw new Error(`Invalid field type: ${model.fieldType}`);
        }

        return fieldValueMap[model.fieldType];
    }

    static getStateValue(model) {
        const name = this.getStateName(model);
        if (!(name in model)) {
            throw new Error(`Invalid property: '${name}'`);
        }

        return model[name];
    }

    buildModel(cont) {
        const res = {
            fieldType: parseInt(cont.fieldTypeField.value, 10),
            operator: parseInt(cont.operatorField.value, 10),
            isFieldValue: cont.fieldValueCheck.checked,
            property: cont.propertyField.value,
            account: cont.accountField.value,
            template: cont.templateField.value,
            amount: cont.amountField.value,
            currency: cont.currencyField.value,
            text: cont.textField.value,
        };

        res.state = ImportConditionForm.getStateName(res);
        res.value = ImportConditionForm.getStateValue(res);

        return res;
    }

    static getExpectedState(model) {
        const res = {
            visibility: {
                fieldTypeField: true,
                operatorField: true,
                deleteBtn: true,
            },
            values: {
                fieldTypeField: { value: model.fieldType.toString() },
                operatorField: { value: model.operator.toString() },
                fieldValueCheck: { checked: model.isFieldValue },
            },
        };

        fieldValueTypes.forEach((fieldName) => {
            const controlName = `${fieldName}Field`;
            const visible = model.state === fieldName;

            res.visibility[controlName] = visible;
            if (visible) {
                res.values[controlName] = { value: model.value.toString() };
            }
        });

        return res;
    }

    async changeFieldType(value) {
        const fieldId = parseInt(value, 10);
        this.model.fieldType = fieldId;
        const field = ImportCondition.getFieldTypeById(fieldId);
        if (!field.operators.includes(this.model.operator)) {
            [this.model.operator] = field.operators;
        }
        this.model.state = ImportConditionForm.getStateName(this.model);
        this.model.value = ImportConditionForm.getStateValue(this.model);
        this.expectedState = ImportConditionForm.getExpectedState(this.model);

        await this.content.fieldTypeField.dropDown.selectItem(fieldId);
        await this.parse();

        return this.checkState();
    }

    async changeValue(name, value) {
        if (this.model.state !== name) {
            throw new Error(`Invalid state ${this.model.state} expected ${name}`);
        }

        this.model[name] = value;
        this.model.value = ImportConditionForm.getStateValue(this.model);
        this.expectedState = ImportConditionForm.getExpectedState(this.model);

        const control = this.content[`${name}Field`];
        if (control.dropDown) {
            await control.dropDown.selectItem(parseInt(value, 10));
        } else {
            await input(control.inputElem, value.toString());
        }
        await this.parse();

        return this.checkState();
    }

    async changeOperator(value) {
        this.model.operator = value;
        this.model.value = ImportConditionForm.getStateValue(this.model);
        this.expectedState = ImportConditionForm.getExpectedState(this.model);

        await this.content.operatorField.dropDown.selectItem(value);
        await this.parse();

        return this.checkState();
    }

    async changeTemplate(value) {
        return this.changeValue('template', value);
    }

    async changeAccount(value) {
        return this.changeValue('account', value);
    }

    async changeCurrency(value) {
        return this.changeValue('currency', value);
    }

    async changeProperty(value) {
        return this.changeValue('property', value);
    }

    async togglePropValue() {
        this.model.isFieldValue = !this.model.isFieldValue;
        this.model.state = ImportConditionForm.getStateName(this.model);
        this.model.value = ImportConditionForm.getStateValue(this.model);
        this.expectedState = ImportConditionForm.getExpectedState(this.model);

        await click(this.content.fieldValueCheck.elem);
        await onChange(this.content.fieldValueCheck.elem);
        await this.parse();

        return this.checkState();
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
