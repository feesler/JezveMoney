import {
    TestComponent,
    query,
    assert,
    evaluate,
} from 'jezve-test';
import { ImportCondition } from '../../../model/ImportCondition.js';
import { App } from '../../../Application.js';

export class ImportConditionItem extends TestComponent {
    async parseContent() {
        assert(this.elem, 'Invalid import condition item');

        const res = {
            propertyTitle: { elem: await query(this.elem, '.cond-item__property') },
            operatorTitle: { elem: await query(this.elem, '.cond-item__operator') },
            valueTitle: { elem: await query(this.elem, '.cond-item__value') },
            valuePropTitle: { elem: await query(this.elem, '.cond-item__value-property') },
        };

        assert(
            res.propertyTitle.elem
            && res.operatorTitle.elem
            && (res.valueTitle.elem || res.valuePropTitle.elem),
            'Invalid structure of condition item',
        );

        [
            res.propertyTitle.value,
            res.operatorTitle.value,
            res.valueTitle.value,
            res.valuePropTitle.value,
        ] = await evaluate(
            (...elems) => elems.map((el) => el?.textContent),
            res.propertyTitle.elem,
            res.operatorTitle.elem,
            res.valueTitle.elem,
            res.valuePropTitle.elem,
        );

        return res;
    }

    buildModel(cont) {
        const res = {};

        // Condition field type
        const fieldName = cont.propertyTitle.value;
        const field = ImportCondition.findFieldTypeByName(fieldName, App.view.locale);
        assert(field, `Invalid property title: '${fieldName}'`);
        res.fieldType = field.id;

        // Condition operator
        const operatorName = cont.operatorTitle.value;
        const operator = ImportCondition.findOperatorByName(operatorName, App.view.locale);
        assert(operator, `Invalid operator title: '${operatorName}'`);
        res.operator = operator.id;

        // Condition value
        if (cont.valuePropTitle.elem) {
            const valuePropName = cont.valuePropTitle.value;
            const valueProp = ImportCondition.findFieldTypeByName(valuePropName, App.view.locale);
            assert(valueProp, `Invalid value property: '${valuePropName}'`);

            res.isFieldValue = true;
            res.value = valueProp.id;
        } else {
            const { value } = cont.valueTitle;
            res.isFieldValue = false;

            if (ImportCondition.isAccountField(field.id)) {
                const account = App.state.accounts.findByName(value);
                assert(account, `Account not found: '${value}'`);

                res.value = account.id;
            } else if (ImportCondition.isTemplateField(field.id)) {
                const template = App.state.templates.find((item) => item.name === value);
                assert(template, `Template not found: '${value}'`);

                res.value = template.id;
            } else if (ImportCondition.isCurrencyField(field.id)) {
                const currency = App.currency.findByName(value);
                assert(currency, `Currency not found: '${value}'`);

                res.value = currency.id;
            } else {
                res.value = value;
            }
        }

        return res;
    }

    static getExpectedState(model) {
        const res = {
            propertyTitle: { visible: true },
            operatorTitle: { visible: true },
            valueTitle: { visible: !model.isFieldValue },
            valuePropTitle: { visible: model.isFieldValue },
        };

        // Condition field type
        const fieldType = ImportCondition.getFieldTypeById(model.fieldType);
        assert(fieldType, `Invalid property type: '${model.fieldType}'`);
        res.propertyTitle.value = fieldType.title;

        // Condition operator
        const operator = ImportCondition.getOperatorById(model.operator);
        assert(operator, `Operator not found: '${model.operator}'`);
        res.operatorTitle.value = operator.title;

        // Condition value
        let value;
        if (model.isFieldValue) {
            const valueProp = ImportCondition.getFieldTypeById(model.value);
            assert(valueProp, `Invalid property type: '${model.value}'`);

            res.valuePropTitle.value = valueProp.title;
        } else if (ImportCondition.isAccountField(model.fieldType)) {
            const account = App.state.accounts.getItem(model.value);
            assert(account, `Account not found: '${model.value}'`);

            value = account.name;
        } else if (ImportCondition.isTemplateField(model.fieldType)) {
            const template = App.state.templates.getItem(model.value);
            assert(template, `Template not found: '${model.value}'`);

            value = template.name;
        } else if (ImportCondition.isCurrencyField(model.fieldType)) {
            const currency = App.currency.getItem(model.value);
            assert(currency, `Currency not found: '${model.value}'`);

            value = currency.name;
        } else {
            value = model.value;
        }

        if (!model.isFieldValue) {
            res.valueTitle.value = value;
        }

        return res;
    }

    static render(item) {
        assert.instanceOf(item, ImportCondition, 'Invalid item');

        const model = {
            isFieldValue: item.isPropertyValue(),
            fieldType: item.field_id,
            operator: item.operator,
            value: item.value,
        };

        return this.getExpectedState(model);
    }
}
