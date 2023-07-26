import {
    TestComponent,
    assert,
    query,
    hasClass,
    click,
    input,
    evaluate,
    asyncMap,
} from 'jezve-test';
import { Checkbox, DropDown } from 'jezvejs-test';
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

const fieldSelectors = [
    '.property-field',
    '.operator-field',
    '.amount-field',
    '.account-field',
    '.tpl-field',
    '.currency-field',
    '.value-prop-field',
    '.text-field',
];

/** Import condition form */
export class ImportConditionForm extends TestComponent {
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
            feedbackElem: { visible: model.feedbackVisible },
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

    static getExpectedPropertyValue(model) {
        assert(
            model.isFieldValue && ImportCondition.isPropertyValueAvailable(model.fieldType),
            'Preperty value not available',
        );

        if (model.fieldType === IMPORT_COND_FIELD_TR_AMOUNT) {
            return IMPORT_COND_FIELD_ACC_AMOUNT;
        }
        if (model.fieldType === IMPORT_COND_FIELD_ACC_AMOUNT) {
            return IMPORT_COND_FIELD_TR_AMOUNT;
        }
        if (model.fieldType === IMPORT_COND_FIELD_TR_CURRENCY) {
            return IMPORT_COND_FIELD_ACC_CURRENCY;
        }
        if (model.fieldType === IMPORT_COND_FIELD_ACC_CURRENCY) {
            return IMPORT_COND_FIELD_TR_CURRENCY;
        }

        throw new Error(`Invalid field type: ${model.fieldType}`);
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

    async parseContent() {
        const res = {
            fieldValueCheck: await Checkbox.create(this, await query(this.elem, '.cond-form__container .checkbox')),
            feedbackElem: { elem: await query(this.elem, '.invalid-feedback') },
            deleteBtn: { elem: await query(this.elem, '.delete-btn') },
        };

        [
            res.fieldTypeField,
            res.operatorField,
            res.amountField,
            res.accountField,
            res.templateField,
            res.currencyField,
            res.propertyField,
            res.textField,
        ] = await asyncMap(
            fieldSelectors,
            (selector) => this.parseField(query(this.elem, selector)),
        );

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
            && res.feedbackElem.elem
            && res.deleteBtn.elem,
            'Invalid structure of import condition form',
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
            feedbackVisible: cont.feedbackElem.visible,
        };

        res.state = ImportConditionForm.getStateName(res);
        res.value = ImportConditionForm.getStateValue(res);

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
