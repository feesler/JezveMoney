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
import { Icon } from 'jezvejs/Icon';
import {
    ImportCondition,
    IMPORT_COND_OP_FIELD_FLAG,
} from '../../../../../js/model/ImportCondition.js';
import { MAX_PRECISION, __ } from '../../../../../js/utils.js';
import './ImportConditionForm.scss';

/** CSS classes */
const FORM_CLASS = 'cond-form';
const CONTAINER_CLASS = 'cond-form__container';
const PROP_FIELD_CLASS = 'property-field';
const OPERATOR_FILED_CLASS = 'operator-field';
const TEXT_FIELD_CLASS = 'text-field';
const AMOUNT_FIELD_CLASS = 'amount-field';
const ACCOUNT_FIELD_CLASS = 'account-field';
const TEMPLATE_FIELD_CLASS = 'tpl-field';
const CURRENCY_FIELD_CLASS = 'currency-field';
const VALUE_PROP_FIELD_CLASS = 'value-prop-field';
const COND_FIELDS_CLASS = 'cond-form__fields';
const CONTROLS_CLASS = 'cond-form__controls';
const VALIDATION_CLASS = 'validation-block';
const INV_FEEDBACK_CLASS = 'feedback invalid-feedback';

const defaultProps = {
    properties: null,
    onUpdate: null,
    onRemove: null,
};

/**
 * ImportConditionForm component
 */
export class ImportConditionForm extends Component {
    static get selector() {
        return `.${FORM_CLASS}`;
    }

    constructor(props) {
        super(props);

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        if (!this.props?.data) {
            throw new Error('Invalid props');
        }

        this.fieldTypes = ImportCondition.getFieldTypes();
        this.operatorTypes = ImportCondition.getOperatorTypes();

        const { data } = this.props;
        this.state = {
            conditionId: data.id,
            parent: data.parent_id,
            fieldType: data.field_id,
            availOperators: data.getAvailOperators(),
            operator: data.operator,
            isFieldValue: data.isPropertyValue(),
            value: data.value,
            isValid: this.props.isValid,
            message: this.props.message,
            properties: this.props.properties,
        };

        this.verifyOperator(this.state);

        this.init();
        this.render(this.state);
        // Check value changed
        const value = this.getConditionValue(this.state);
        if (data.value.toString() !== value.toString()) {
            this.state.value = value;
            this.sendUpdate();
        }
    }

    get id() {
        return this.state.conditionId;
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
            digits: MAX_PRECISION,
            onInput: () => this.onValueChange(),
        });
        // Create text value input element
        this.valueInput = createElement('input', {
            props: { className: `stretch-input ${TEXT_FIELD_CLASS}`, type: 'text' },
            events: { input: () => this.onValueChange() },
        });

        // Field value checkbox
        this.fieldValueCheck = Checkbox.create({
            label: __('CONDITION_COMPARE_PROPERTY'),
            onChange: () => this.onFieldValueChecked(),
        });

        this.fields = window.app.createContainer(COND_FIELDS_CLASS, [
            this.propertyDropDown.elem,
            this.operatorDropDown.elem,
            this.accountDropDown.elem,
            this.templateDropDown.elem,
            this.currencyDropDown.elem,
            this.amountInput,
            this.valueInput,
            this.valuePropDropDown.elem,
        ]);

        // Invalid feedback message
        this.validFeedback = createElement('div', { props: { className: INV_FEEDBACK_CLASS } });
        this.container = window.app.createContainer([CONTAINER_CLASS, VALIDATION_CLASS], [
            this.fields,
            this.fieldValueCheck.elem,
            this.validFeedback,
        ]);

        // Delete button
        const delIcon = Icon.create({
            icon: 'del',
            className: 'btn__icon delete-icon',
        });
        this.delBtn = createElement('button', {
            props: { className: 'btn icon-btn delete-btn', type: 'button' },
            children: delIcon.elem,
            events: { click: () => this.onDelete() },
        });
        this.controls = window.app.createContainer(CONTROLS_CLASS, this.delBtn);

        this.elem = window.app.createContainer(FORM_CLASS, [
            this.container,
            this.controls,
        ]);
    }

    getPropertyTypes(state = this.state) {
        if (!state.properties) {
            return this.fieldTypes;
        }

        const propFilter = asArray(state.properties);
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
            onChange: (property) => this.onPropertyChange(property),
        });

        this.propertyDropDown.append(items);
        this.propertyDropDown.setSelection(items[0].id);
    }

    /** Create operator field */
    createOperatorField() {
        const operatorItems = this.operatorTypes
            .map((operatorType) => ({ id: operatorType.id, title: operatorType.title }));

        this.operatorDropDown = DropDown.create({
            className: OPERATOR_FILED_CLASS,
            onChange: (operator) => this.onOperatorChange(operator),
        });
        this.operatorDropDown.append(operatorItems);
        this.operatorDropDown.setSelection(operatorItems[0].id);
    }

    /** Create account field */
    createAccountField() {
        this.accountDropDown = DropDown.create({
            className: ACCOUNT_FIELD_CLASS,
            enableFilter: true,
            noResultsMessage: __('NOT_FOUND'),
            onChange: () => this.onValueChange(),
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
            enableFilter: true,
            noResultsMessage: __('NOT_FOUND'),
            onChange: () => this.onValueChange(),
        });
        this.templateDropDown.append(templateItems);
        if (templateItems.length > 0) {
            this.templateDropDown.setSelection(templateItems[0].id);
        }
    }

    /** Create currency field */
    createCurrencyField() {
        this.currencyDropDown = DropDown.create({
            className: CURRENCY_FIELD_CLASS,
            enableFilter: true,
            onChange: () => this.onValueChange(),
        });
        window.app.initUserCurrencyList(this.currencyDropDown);
    }

    /** Create value property field */
    createValuePropField() {
        this.valuePropDropDown = DropDown.create({
            className: VALUE_PROP_FIELD_CLASS,
            onChange: () => this.onValueChange(),
        });
    }

    /** Verify correctness of operator */
    verifyOperator(state) {
        if (
            !state
            || !Array.isArray(state.availOperators)
            || !state.availOperators.length
            || !state.availOperators.includes(state.operator)
        ) {
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

        const newState = {
            ...this.state,
            fieldType: fieldType.id,
            availOperators: fieldType.operators,
            isValid: true,
        };

        // If not available operator is selected then select first available
        if (!newState.availOperators.includes(newState.operator)) {
            [newState.operator] = newState.availOperators;
        }

        if (!this.isFieldValueAvailable()) {
            newState.isFieldValue = false;
        }

        if (newState.isFieldValue) {
            const [item] = this.getValuePropertyItems(newState);
            newState.value = item.id;
        } else {
            newState.value = this.getConditionValue(newState);
        }

        this.verifyOperator(newState);
        this.setState(newState);
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

        this.setState({
            ...this.state,
            operator: operatorId,
            isValid: true,
        });
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
            this.valuePropDropDown.setSelection(value);
        } else if (ImportCondition.isAccountField(state.fieldType)) {
            this.accountDropDown.setSelection(value);
        } else if (ImportCondition.isTemplateField(state.fieldType)) {
            this.templateDropDown.setSelection(value);
        } else if (ImportCondition.isCurrencyField(state.fieldType)) {
            this.currencyDropDown.setSelection(value);
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

        this.setState({
            ...this.state,
            value,
            isValid: true,
        });
        this.sendUpdate();
    }

    /** Field value checkbox 'change' event handler */
    onFieldValueChecked() {
        if (!this.isFieldValueAvailable()) {
            return;
        }

        const newState = {
            ...this.state,
            isFieldValue: this.fieldValueCheck.checked,
            isValid: true,
        };

        if (newState.isFieldValue) {
            const [item] = this.getValuePropertyItems(newState);
            newState.value = item.id;
        } else {
            newState.value = this.getConditionValue(newState);
        }

        this.setState(newState);
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
            this.props.onUpdate(this.id, this.getData(this.state));
        }
    }

    /** Delete button 'click' event handler */
    onDelete() {
        if (isFunction(this.props.onRemove)) {
            this.props.onRemove(this.id);
        }
    }

    /** Render field type select */
    renderProperty(state) {
        const propTypes = this.getPropertyTypes(state);
        const items = propTypes.map(({ id, title }) => ({ id, title }));

        this.propertyDropDown.removeAll();
        this.propertyDropDown.append(items);
        this.propertyDropDown.setSelection(state.fieldType);
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
        this.operatorDropDown.setSelection(state.operator);
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
        this.valuePropDropDown.setSelection(items[0].id);
    }

    /** Render component state */
    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        window.app.setValidation(this.container, state.isValid);
        this.validFeedback.textContent = (state.isValid) ? '' : state.message;

        this.renderProperty(state);
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
