import { Component } from './component.js';
import {
    asyncMap,
} from '../../common.js';
import {
    IMPORT_COND_FIELD_MAIN_ACCOUNT,
    IMPORT_COND_FIELD_TPL,
    IMPORT_COND_FIELD_TR_AMOUNT,
    IMPORT_COND_FIELD_ACC_AMOUNT,
    IMPORT_COND_FIELD_TR_CURRENCY,
    IMPORT_COND_FIELD_ACC_CURRENCY,
    IMPORT_COND_FIELD_DATE,
    IMPORT_COND_FIELD_COMMENT,
} from '../../model/importcondition.js';

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
export class ImportConditionForm extends Component {
    /* TMP */
    static async create(...args) {
        if (args.length < 2 || !args[1]) {
            return null;
        }

        const instance = new this(...args);
        await instance.parse();

        return instance;
    }
    /* TMP */

    async parse() {
        const fieldElems = await this.queryAll(this.elem, '.field');
        await asyncMap(fieldElems, (field) => this.parseField(field));

        this.fieldValueCheck = { elem: await this.query(this.elem, '.value-field .checkwrap input[type=checkbox]') };
        this.deleteBtn = { elem: await this.query(this.elem, '.delete-btn') };

        if (
            !this.fieldTypeField
            || !this.operatorField
            || !this.amountField
            || !this.accountField
            || !this.templateField
            || !this.currencyField
            || !this.propertyField
            || !this.textField
            || !this.fieldValueCheck.elem
            || !this.deleteBtn.elem
        ) {
            throw new Error('Invalid structure of import condition form');
        }

        this.fieldValueCheck.checked = await this.prop(this.fieldValueCheck.elem, 'checked');

        this.model = this.buildModel(this);
    }

    mapField(field) {
        if (!field || !field.title) {
            throw new Error('Invalid field');
        }

        for (const name in fieldsMap) {
            if (fieldsMap[name] === field.title) {
                this[`${name}Field`] = field;
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
        this.model.state = ImportConditionForm.getStateName(this.model);
        this.model.value = ImportConditionForm.getStateValue(this.model);
        this.expectedState = ImportConditionForm.getExpectedState(this.model);

        await this.selectByValue(this.fieldTypeField.inputElem, fieldId);
        await this.onChange(this.fieldTypeField.inputElem);
        await this.parse();

        return this.checkState();
    }

    async changeValue(name, value, isSelect) {
        if (this.model.state !== name) {
            throw new Error('Invalid state');
        }

        this.model[name] = value;
        this.model.value = ImportConditionForm.getStateValue(this.model);
        this.expectedState = ImportConditionForm.getExpectedState(this.model);

        const control = this[`${name}Field`];
        if (isSelect) {
            await this.selectByValue(control.inputElem, value.toString());
            await this.onChange(control.inputElem);
        } else {
            await this.input(control.inputElem, value.toString());
        }
        await this.parse();

        return this.checkState();
    }

    async changeOperator(value) {
        this.model.operator = value;
        this.model.value = ImportConditionForm.getStateValue(this.model);
        this.expectedState = ImportConditionForm.getExpectedState(this.model);

        await this.selectByValue(this.operatorField.inputElem, value);
        await this.onChange(this.operatorField.inputElem);
        await this.parse();

        return this.checkState();
    }

    async changeTemplate(value) {
        return this.changeValue('template', value, true);
    }

    async changeAccount(value) {
        return this.changeValue('account', value, true);
    }

    async changeCurrency(value) {
        return this.changeValue('currency', value, true);
    }

    async changeProperty(value) {
        return this.changeValue('property', value, true);
    }

    async togglePropValue() {
        this.model.isFieldValue = !this.model.isFieldValue;
        this.model.state = ImportConditionForm.getStateName(this.model);
        this.model.value = ImportConditionForm.getStateValue(this.model);
        this.expectedState = ImportConditionForm.getExpectedState(this.model);

        await this.click(this.fieldValueCheck.elem);
        await this.onChange(this.fieldValueCheck.elem);
        await this.parse();

        return this.checkState();
    }

    async inputAmount(value) {
        return this.changeValue('amount', value, false);
    }

    async inputValue(value) {
        return this.changeValue('text', value, false);
    }

    async clickDelete() {
        return this.click(this.deleteBtn.elem);
    }
}
