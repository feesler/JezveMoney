import { TestComponent } from 'jezve-test';
import { ImportCondition } from '../../../model/ImportCondition.js';
import { Currency } from '../../../model/Currency.js';
import { App } from '../../../Application.js';
import { query, prop } from '../../../env.js';

export class ImportConditionItem extends TestComponent {
    async parseContent() {
        if (!this.elem) {
            throw new Error('Invalid import condition item');
        }

        const res = {
            propertyTitle: { elem: await query(this.elem, '.cond-item__property') },
            operatorTitle: { elem: await query(this.elem, '.cond-item__operator') },
            valueTitle: { elem: await query(this.elem, '.cond-item__value') },
            valuePropTitle: { elem: await query(this.elem, '.cond-item__value-property') },
        };

        if (
            !res.propertyTitle.elem
            || !res.operatorTitle.elem
            || (!res.valueTitle.elem && !res.valuePropTitle.elem)
        ) {
            throw new Error('Invalid structure of condition item');
        }

        res.propertyTitle.value = await prop(res.propertyTitle.elem, 'textContent');
        res.operatorTitle.value = await prop(res.operatorTitle.elem, 'textContent');
        if (res.valueTitle.elem) {
            res.valueTitle.value = await prop(res.valueTitle.elem, 'textContent');
        }
        if (res.valuePropTitle.elem) {
            res.valuePropTitle.value = await prop(res.valuePropTitle.elem, 'textContent');
        }

        return res;
    }

    buildModel(cont) {
        const res = {};

        // Condition field type
        const fieldName = cont.propertyTitle.value;
        const field = ImportCondition.findFieldTypeByName(fieldName);
        if (!field) {
            throw new Error(`Invalid property title: '${fieldName}'`);
        }
        res.fieldType = field.id;

        // Condition operator
        const operatorName = cont.operatorTitle.value;
        const operator = ImportCondition.findOperatorByName(operatorName);
        if (!operator) {
            throw new Error(`Invalid operator title: '${operatorName}'`);
        }
        res.operator = operator.id;

        // Condition value
        if (cont.valuePropTitle.elem) {
            const valuePropName = cont.valuePropTitle.value;
            const valueProp = ImportCondition.findFieldTypeByName(valuePropName);
            if (!valueProp) {
                throw new Error(`Invalid value property: '${valuePropName}'`);
            }

            res.isFieldValue = true;
            res.value = valueProp.id;
        } else {
            const { value } = cont.valueTitle;
            res.isFieldValue = false;

            if (ImportCondition.isAccountField(field.id)) {
                const account = App.state.accounts.findByName(value);
                if (!account) {
                    throw new Error(`Account not found: '${value}'`);
                }

                res.value = account.id;
            } else if (ImportCondition.isTemplateField(field.id)) {
                const template = App.state.templates.findByName(value);
                if (!template) {
                    throw new Error(`Template not found: '${value}'`);
                }

                res.value = template.id;
            } else if (ImportCondition.isCurrencyField(field.id)) {
                const currency = Currency.findByName(value);
                if (!currency) {
                    throw new Error(`Currency not found: '${value}'`);
                }

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
        if (!fieldType) {
            throw new Error(`Invalid property type: '${model.fieldType}'`);
        }
        res.propertyTitle.value = fieldType.title;

        // Condition operator
        const operator = ImportCondition.getOperatorById(model.operator);
        if (!operator) {
            throw new Error(`Operator not found: '${model.operator}'`);
        }
        res.operatorTitle.value = operator.title;

        // Condition value
        let value;
        if (model.isFieldValue) {
            const valueProp = ImportCondition.getFieldTypeById(model.value);
            if (!valueProp) {
                throw new Error(`Invalid property type: '${model.value}'`);
            }

            res.valuePropTitle.value = valueProp.title;
        } else if (ImportCondition.isAccountField(model.fieldType)) {
            const account = App.state.accounts.getItem(model.value);
            if (!account) {
                throw new Error(`Account not found: '${model.value}'`);
            }

            value = account.name;
        } else if (ImportCondition.isTemplateField(model.fieldType)) {
            const template = App.state.templates.getItem(model.value);
            if (!template) {
                throw new Error(`Template not found: '${model.value}'`);
            }

            value = template.name;
        } else if (ImportCondition.isCurrencyField(model.fieldType)) {
            const currency = Currency.getById(model.value);
            if (!currency) {
                throw new Error(`Currency not found: '${model.value}'`);
            }

            value = currency.name;
        } else {
            value = model.value;
        }

        if (!model.isFieldValue) {
            res.valueTitle.value = value;
        }

        return res;
    }
}
