import {
    TestComponent,
    assert,
    query,
    hasClass,
    prop,
    click,
    input,
    isVisible,
} from 'jezve-test';
import { Checkbox, DropDown } from 'jezvejs/tests';
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

const fieldValueTypes = [
    'property',
    'account',
    'template',
    'amount',
    'currency',
    'text',
];

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

        res.fieldTypeField = await this.parseField(await query(this.elem, '.property-field'));
        res.operatorField = await this.parseField(await query(this.elem, '.operator-field'));
        res.amountField = await this.parseField(await query(this.elem, '.amount-field'));
        res.accountField = await this.parseField(await query(this.elem, '.account-field'));
        res.templateField = await this.parseField(await query(this.elem, '.tpl-field'));
        res.currencyField = await this.parseField(await query(this.elem, '.currency-field'));
        res.propertyField = await this.parseField(await query(this.elem, '.value-prop-field'));
        res.textField = await this.parseField(await query(this.elem, '.text-field'));

        res.fieldValueCheck = await Checkbox.create(this, await query(this.elem, '.cond-form__container .checkbox'));

        res.deleteBtn = { elem: await query(this.elem, '.delete-btn') };

        assert(
            res.fieldTypeField
            && res.operatorField
            && res.amountField
            && res.accountField
            && res.templateField
            && res.currencyField
            && res.propertyField
            && res.textField
            && res.fieldValueCheck.elem
            && res.deleteBtn.elem,
            'Invalid structure of import condition form',
        );

        return res;
    }

    async parseField(elem) {
        const res = { elem };

        assert(res.elem, 'Invalid field element');

        const isDropDown = await hasClass(elem, 'dd__container');
        if (isDropDown) {
            res.dropDown = await DropDown.create(this, elem);
            assert(res.dropDown, 'Invalid structure of field element');
            res.disabled = res.dropDown.content.disabled;
            res.value = res.dropDown.content.value;
        } else {
            res.inputElem = elem;
            res.disabled = await prop(res.inputElem, 'disabled');
            res.value = await prop(res.inputElem, 'value');
        }

        res.visible = await isVisible(elem);

        return res;
    }

    static getStateName(model) {
        if (model.isFieldValue) {
            return 'property';
        }

        assert(model.fieldType in fieldValueMap, `Invalid field type: ${model.fieldType}`);

        return fieldValueMap[model.fieldType];
    }

    static getStateValue(model) {
        const name = this.getStateName(model);
        assert(name in model, `Invalid property: '${name}'`);

        return model[name];
    }

    buildModel(cont) {
        const res = {
            fieldType: parseInt(cont.fieldTypeField.value, 10),
            fieldsAvailable: cont.fieldTypeField.dropDown.items.map(({ id }) => id),
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
            fieldTypeField: {
                value: model.fieldType.toString(),
                visible: true,
                dropDown: {
                    items: model.fieldsAvailable.map((id) => ({ id })),
                },
            },
            operatorField: { value: model.operator.toString(), visible: true },
            fieldValueCheck: {
                checked: model.isFieldValue,
                visible: ImportCondition.isPropertyValueAvailable(model.fieldType),
            },
            deleteBtn: { visible: true },
        };

        const state = ImportConditionForm.getStateName(model);

        fieldValueTypes.forEach((fieldName) => {
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

    async changeFieldType(value) {
        const fieldId = parseInt(value, 10);

        await this.content.fieldTypeField.dropDown.selectItem(fieldId);
    }

    async changeValue(name, value) {
        assert(this.model.state === name, `Invalid state ${this.model.state} expected ${name}`);

        const control = this.content[`${name}Field`];
        if (control.dropDown) {
            await control.dropDown.selectItem(parseInt(value, 10));
        } else {
            await input(control.inputElem, value.toString());
        }
    }

    async changeOperator(value) {
        await this.content.operatorField.dropDown.selectItem(value);
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
        await this.content.fieldValueCheck.toggle();
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
