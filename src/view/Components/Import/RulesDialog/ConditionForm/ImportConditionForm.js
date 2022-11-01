import {
    createElement,
    show,
    isFunction,
    asArray,
    Component,
} from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import { DropDown } from 'jezvejs/DropDown';
import { DecimalInput } from 'jezvejs/DecimalInput';
import {
    ImportCondition,
    IMPORT_COND_OP_FIELD_FLAG,
} from '../../../../js/model/ImportCondition.js';
import './style.scss';

/** CSS classes */
const FORM_CLASS = 'cond-form';
const CONTAINER_CLASS = 'cond-form__container';
const PROP_FIELD_CLASS = 'property-field';
const OPERATOR_FILED_CLASS = 'operator-field';
const VALUE_FIELD_CLASS = 'value-field';
const TEXT_FIELD_CLASS = 'text-field';
const AMOUNT_FIELD_CLASS = 'amount-field';
const ACCOUNT_FIELD_CLASS = 'account-field';
const TEMPLATE_FIELD_CLASS = 'tpl-field';
const CURRENCY_FIELD_CLASS = 'currency-field';
const VALUE_PROP_FIELD_CLASS = 'value-prop-field';
const COND_FIELDS_CLASS = 'cond-form__fields';
const CONTROLS_CLASS = 'cond-form__controls';
const VALIDATION_CLASS = 'validation-block';
const INV_FEEDBACK_CLASS = 'invalid-feedback';
/** Strings */
const LABEL_PROPERTY_CMP = 'Compare with another property';

const defaultProps = {
    properties: null,
    onUpdate: null,
    onRemove: null,
};

/**
 * ImportConditionForm component
 */
export class ImportConditionForm extends Component {
    constructor(props) {
        super(props);

        if (!this.props?.data) {
            throw new Error('Invalid props');
        }

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        this.fieldTypes = ImportCondition.getFieldTypes();
        this.operatorTypes = ImportCondition.getOperatorTypes();

        this.init();

        this.state = {
            conditionId: this.props.data.id,
            parent: this.props.data.parent_id,
            fieldType: this.props.data.field_id,
            availOperators: this.props.data.getAvailOperators(),
            operator: this.props.data.operator,
            isFieldValue: this.props.data.isPropertyValue(),
            value: this.props.data.value,
            isValid: this.props.isValid,
            message: this.props.message,
        };

        this.verifyOperator(this.state);
        this.render(this.state);
        // Check value changed
        const value = this.getConditionValue(this.state);
        if (this.props.data.value !== value) {
            this.state.value = value;
            this.sendUpdate();
        }
    }

    /** Form controls initialization */
    init() {
        this.createPropertyField();
        this.createOperatorField();
        this.createAccountField();
        this.createTemplateField();
        this.createCurrencyField();
        this.createValuePropField();

        // Create amount input element
        this.amountInput = createElement('input', {
            props: { className: `stretch-input ${AMOUNT_FIELD_CLASS}`, type: 'text' },
        });
        this.decAmountInput = DecimalInput.create({
            elem: this.amountInput,
            digits: 2,
            oninput: () => this.onValueChange(),
        });
        // Create text value input element
        this.valueInput = createElement('input', {
            props: { className: `stretch-input ${TEXT_FIELD_CLASS}`, type: 'text' },
            events: { input: () => this.onValueChange() },
        });

        // Field value checkbox
        this.fieldValueCheck = Checkbox.create({
            label: LABEL_PROPERTY_CMP,
            onChange: () => this.onFieldValueChecked(),
        });

        this.valueFieldBlock = window.app.createContainer(VALUE_FIELD_CLASS, [
            this.accountDropDown.elem,
            this.templateDropDown.elem,
            this.currencyDropDown.elem,
            this.amountInput,
            this.valueInput,
            this.valuePropDropDown.elem,
        ]);

        this.fields = window.app.createContainer(COND_FIELDS_CLASS, [
            this.propertyDropDown.elem,
            this.operatorDropDown.elem,
            this.valueFieldBlock,
        ]);

        // Invalid feedback message
        this.validFeedback = createElement('div', { props: { className: INV_FEEDBACK_CLASS } });
        this.container = window.app.createContainer(`${CONTAINER_CLASS} ${VALIDATION_CLASS}`, [
            this.fields,
            this.fieldValueCheck.elem,
            this.validFeedback,
        ]);

        // Delete button
        this.delBtn = createElement('button', {
            props: { className: 'btn icon-btn delete-btn', type: 'button' },
            children: window.app.createIcon('del', 'icon delete-icon'),
            events: { click: () => this.onDelete() },
        });
        this.controls = window.app.createContainer(CONTROLS_CLASS, this.delBtn);

        this.elem = window.app.createContainer(FORM_CLASS, [
            this.container,
            this.controls,
        ]);
    }

    getPropertyTypes() {
        if (!this.props.properties) {
            return this.fieldTypes;
        }

        const propFilter = asArray(this.props.properties);
        if (!propFilter.length) {
            return this.fieldTypes;
        }

        return this.fieldTypes.filter((type) => propFilter.includes(type.id));
    }

    /** Returns true if possible to compare current field type with another field */
    isFieldValueAvailable(state = this.state) {
        return ImportCondition.isPropertyValueAvailable(state.fieldType);
    }

    /** Create property field */
    createPropertyField() {
        const propTypes = this.getPropertyTypes();
        const items = propTypes.map(({ id, title }) => ({ id, title }));

        this.propertyDropDown = DropDown.create({
            className: PROP_FIELD_CLASS,
            onchange: (property) => this.onPropertyChange(property),
        });

        this.propertyDropDown.append(items);
        this.propertyDropDown.selectItem(items[0].id);
    }

    /** Create operator field */
    createOperatorField() {
        const operatorItems = this.operatorTypes
            .map((operatorType) => ({ id: operatorType.id, title: operatorType.title }));

        this.operatorDropDown = DropDown.create({
            className: OPERATOR_FILED_CLASS,
            onchange: (operator) => this.onOperatorChange(operator),
        });
        this.operatorDropDown.append(operatorItems);
        this.operatorDropDown.selectItem(operatorItems[0].id);
    }

    /** Create account field */
    createAccountField() {
        this.accountDropDown = DropDown.create({
            className: ACCOUNT_FIELD_CLASS,
            onchange: () => this.onValueChange(),
        });
        window.app.initAccountsList(this.accountDropDown);
    }

    /** Create template field */
    createTemplateField() {
        const templateItems = window.app.model.templates.map(
            (template) => ({ id: template.id, title: template.name }),
        );

        this.templateDropDown = DropDown.create({
            className: TEMPLATE_FIELD_CLASS,
            onchange: () => this.onValueChange(),
        });
        this.templateDropDown.append(templateItems);
        if (templateItems.length > 0) {
            this.templateDropDown.selectItem(templateItems[0].id);
        }
    }

    /** Create currency field */
    createCurrencyField() {
        this.currencyDropDown = DropDown.create({
            className: CURRENCY_FIELD_CLASS,
            onchange: () => this.onValueChange(),
        });
        window.app.initCurrencyList(this.currencyDropDown);
    }

    /** Create value property field */
    createValuePropField() {
        this.valuePropDropDown = DropDown.create({
            className: VALUE_PROP_FIELD_CLASS,
            onchange: () => this.onValueChange(),
        });
    }

    /** Verify correctness of operator */
    verifyOperator(state) {
        if (!state
            || !Array.isArray(state.availOperators)
            || !state.availOperators.length
            || !state.availOperators.includes(state.operator)) {
            throw new Error('Invalid state');
        }
    }

    /** Property select 'change' event handler */
    onPropertyChange(property) {
        if (!property || !property.id) {
            throw new Error('Invalid property');
        }

        const fieldType = ImportCondition.getFieldTypeById(property.id);
        if (!fieldType) {
            throw new Error('Invalid property type');
        }

        if (this.state.fieldType === fieldType.id) {
            return;
        }

        this.state.fieldType = fieldType.id;
        this.state.availOperators = fieldType.operators;
        // If not available operator is selected then select first available
        if (!this.state.availOperators.includes(this.state.operator)) {
            [this.state.operator] = this.state.availOperators;
        }

        if (!this.isFieldValueAvailable()) {
            this.state.isFieldValue = false;
        }

        if (this.state.isFieldValue) {
            const [item] = this.getValuePropertyItems(this.state);
            this.state.value = item.id;
        } else {
            this.state.value = this.getConditionValue(this.state);
        }

        this.state.isValid = true;

        this.verifyOperator(this.state);
        this.render(this.state);
        this.sendUpdate();
    }

    /** Operator select 'change' event handler */
    onOperatorChange(operator) {
        if (!operator || !operator.id) {
            throw new Error('Invalid operator');
        }

        const operatorId = parseInt(operator.id, 10);
        if (this.state.operator === operatorId) {
            return;
        }

        this.state.operator = operatorId;
        this.state.isValid = true;
        this.render(this.state);
        this.sendUpdate();
    }

    /** Return condition value */
    getConditionValue(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (state.isFieldValue) {
            const selection = this.valuePropDropDown.getSelectionData();
            return selection.id;
        }
        if (ImportCondition.isAccountField(state.fieldType)) {
            const selection = this.accountDropDown.getSelectionData();
            return selection.id;
        }
        if (ImportCondition.isTemplateField(state.fieldType)) {
            const selection = this.templateDropDown.getSelectionData();
            return selection.id;
        }
        if (ImportCondition.isCurrencyField(state.fieldType)) {
            const selection = this.currencyDropDown.getSelectionData();
            return selection.id;
        }
        if (ImportCondition.isAmountField(state.fieldType)) {
            return this.decAmountInput.value;
        }

        return this.valueInput.value;
    }

    /** Set condition value */
    setConditionValue(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        let value;
        if (ImportCondition.isItemField(state.fieldType) || state.isFieldValue) {
            value = parseInt(state.value, 10);
        }

        if (state.isFieldValue) {
            this.valuePropDropDown.selectItem(value);
        } else if (ImportCondition.isAccountField(state.fieldType)) {
            this.accountDropDown.selectItem(value);
        } else if (ImportCondition.isTemplateField(state.fieldType)) {
            this.templateDropDown.selectItem(value);
        } else if (ImportCondition.isCurrencyField(state.fieldType)) {
            this.currencyDropDown.selectItem(value);
        } else if (ImportCondition.isAmountField(state.fieldType)) {
            this.decAmountInput.value = state.value;
        } else {
            this.valueInput.value = state.value;
        }
    }

    /** Value property select 'change' event handler */
    onValueChange() {
        const value = this.getConditionValue(this.state);

        if (this.state.value === value) {
            return;
        }

        this.state.value = value;
        this.state.isValid = true;
        this.render(this.state);
        this.sendUpdate();
    }

    /** Field value checkbox 'change' event handler */
    onFieldValueChecked() {
        if (!this.isFieldValueAvailable()) {
            return;
        }

        this.state.isFieldValue = this.fieldValueCheck.checked;
        if (this.state.isFieldValue) {
            const [item] = this.getValuePropertyItems(this.state);
            this.state.value = item.id;
        } else {
            this.state.value = this.getConditionValue(this.state);
        }

        this.state.isValid = true;
        this.render(this.state);
        this.sendUpdate();
    }

    /** Return import rule object */
    getData(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        const res = {
            parent_id: state.parent,
            field_id: state.fieldType,
            operator: state.operator,
            value: state.value,
            flags: (state.isFieldValue) ? IMPORT_COND_OP_FIELD_FLAG : 0,
        };

        if (state.conditionId) {
            res.id = state.conditionId;
        }

        return res;
    }

    /** Send component 'update' event */
    sendUpdate() {
        if (isFunction(this.props.onUpdate)) {
            this.props.onUpdate(this.getData(this.state));
        }
    }

    /** Delete button 'click' event handler */
    onDelete() {
        if (isFunction(this.props.onRemove)) {
            this.props.onRemove();
        }
    }

    /** Render operator select */
    renderOperator(state) {
        const items = this.operatorTypes
            .filter((operatorType) => state.availOperators.includes(operatorType.id))
            .map((operatorType) => ({
                id: operatorType.id,
                title: operatorType.title,
            }));

        this.operatorDropDown.removeAll();
        this.operatorDropDown.append(items);
        this.operatorDropDown.selectItem(state.operator);
    }

    getValuePropertyItems(state) {
        const isCurrencyField = ImportCondition.isCurrencyField(state.fieldType);
        const isAmountField = ImportCondition.isAmountField(state.fieldType);
        if (!isCurrencyField && !isAmountField) {
            throw new Error('Invalid state');
        }

        const items = this.fieldTypes
            .filter((fieldType) => {
                if (fieldType.id === state.fieldType) {
                    return false;
                }

                if (isCurrencyField) {
                    return ImportCondition.isCurrencyField(fieldType.id);
                }

                return ImportCondition.isAmountField(fieldType.id);
            })
            .map(({ id, title }) => ({ id, title }));

        return items;
    }

    renderValueProperty(state) {
        if (!this.isFieldValueAvailable(state)) {
            return;
        }

        const items = this.getValuePropertyItems(state);

        this.valuePropDropDown.removeAll();
        this.valuePropDropDown.append(items);
        this.valuePropDropDown.selectItem(items[0].id);
    }

    /** Render component state */
    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (state.isValid) {
            this.validFeedback.textContent = '';
            window.app.clearBlockValidation(this.container);
        } else {
            this.validFeedback.textContent = state.message;
            window.app.invalidateBlock(this.container);
        }

        this.propertyDropDown.selectItem(state.fieldType);
        this.renderOperator(state);

        const isAccountValue = (
            !state.isFieldValue
            && ImportCondition.isAccountField(state.fieldType)
        );
        const isTplValue = (
            !state.isFieldValue
            && ImportCondition.isTemplateField(state.fieldType)
        );
        const isCurrencyField = ImportCondition.isCurrencyField(state.fieldType);
        const isCurrencyValue = (!state.isFieldValue && isCurrencyField);
        const isAmountField = ImportCondition.isAmountField(state.fieldType);
        const isAmountValue = (!state.isFieldValue && isAmountField);
        const isTextValue = (
            !state.isFieldValue
            && (
                ImportCondition.isDateField(state.fieldType)
                || ImportCondition.isStringField(state.fieldType)
            )
        );

        this.accountDropDown.show(isAccountValue);
        this.templateDropDown.show(isTplValue);
        this.currencyDropDown.show(isCurrencyValue);
        show(this.amountInput, isAmountValue);
        if (state.isFieldValue) {
            this.renderValueProperty(state);
        }
        this.valuePropDropDown.show(state.isFieldValue);
        show(this.valueInput, isTextValue);

        this.setConditionValue(state);

        const showFieldValueCheck = this.isFieldValueAvailable(state);
        this.fieldValueCheck.show(showFieldValueCheck);
        this.fieldValueCheck.check(state.isFieldValue);
    }
}
