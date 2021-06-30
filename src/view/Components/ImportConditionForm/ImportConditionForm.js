import {
    ce,
    show,
    isFunction,
    DropDown,
    DecimalInput,
} from 'jezvejs';
import { AppComponent } from '../AppComponent/AppComponent.js';
import {
    ImportCondition,
    IMPORT_COND_OP_FIELD_FLAG,
} from '../../js/model/ImportCondition.js';
import { View } from '../../js/View.js';
import './style.css';

/**
 * ImportConditionForm component constructor
 */
export class ImportConditionForm extends AppComponent {
    constructor(...args) {
        super(...args);

        if (
            !this.parent
            || !this.props
            || !this.props.data
            || !this.props.tplModel
            || !this.props.currencyModel
            || !this.props.accountModel
            || !this.props.personModel
        ) {
            throw new Error('Invalid props');
        }

        this.parentView = (this.parent instanceof View)
            ? this.parent
            : this.parent.parentView;

        this.updateHandler = this.props.update;
        this.deleteHandler = this.props.remove;

        this.model = {
            template: this.props.tplModel,
            currency: this.props.currencyModel,
            accounts: this.props.accountModel,
            persons: this.props.personModel,
        };

        if (!(this.props.data instanceof ImportCondition)) {
            throw new Error('Invalid condition item');
        }
        this.props.data.isValid = this.props.isValid;
        this.props.data.message = this.props.message;

        this.fieldTypes = ImportCondition.getFieldTypes();
        this.operatorTypes = ImportCondition.getOperatorTypes();

        this.init();
        this.setData(this.props.data);
    }

    /** Shortcut for ImportConditionForm constructor */
    static create(props) {
        return new ImportConditionForm(props);
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
        this.amountInput = ce('input', { type: 'text' });
        this.decAmountInput = DecimalInput.create({
            elem: this.amountInput,
            oninput: this.onValueChange.bind(this),
        });
        this.amountField = this.createField('Amount', this.amountInput);
        // Create text value input element
        this.valueInput = ce(
            'input',
            { type: 'text' },
            null,
            { input: this.onValueChange.bind(this) },
        );
        this.valueField = this.createField('Value', this.valueInput);

        // Field value checkbox
        this.fieldValueCheck = ce(
            'input',
            { type: 'checkbox' },
            null,
            { change: () => this.onFieldValueChecked() },
        );
        this.fieldValueCheck.addEventListener('change', this.onFieldValueChecked.bind(this));
        this.valueFieldBlock = this.createContainer('value-field', [
            this.accountField,
            this.templateField,
            this.currencyField,
            this.amountField,
            this.valueField,
            this.valuePropField,
            this.createCheck(this.fieldValueCheck, 'checkwrap', 'Compare with another property'),
        ]);

        this.fields = this.createContainer('cond-form__fields', [
            this.propertyField,
            this.operatorField,
            this.valueFieldBlock,
        ]);

        // Invalid feedback message
        this.validFeedback = ce('div', { className: 'invalid-feedback' });
        this.container = this.createContainer('cond-form__container validation-block', [
            this.fields,
            this.validFeedback,
        ]);

        // Delete button
        this.delBtn = ce(
            'button',
            { className: 'btn icon-btn delete-btn', type: 'button' },
            this.createIcon('del'),
            { click: () => this.onDelete() },
        );
        this.controls = this.createContainer('cond-form__controls', this.delBtn);

        this.elem = this.createContainer('cond-form', [
            this.container,
            this.controls,
        ]);
    }

    /** Create property field */
    createPropertyField() {
        const filedTypeItems = this.fieldTypes
            .filter((fieldType) => !ImportCondition.isTemplateField(fieldType.id))
            .map((fieldType) => ({ id: fieldType.id, title: fieldType.title }));

        const selectElem = ce('select');
        this.propertyField = this.createField('Property', selectElem);

        this.propertyDropDown = DropDown.create({
            input_id: selectElem,
            onchange: this.onPropertyChange.bind(this),
            editable: false,
        });

        this.propertyDropDown.append(filedTypeItems);
        this.propertyDropDown.selectItem(filedTypeItems[0].id);
    }

    /** Create operator field */
    createOperatorField() {
        const operatorItems = this.operatorTypes
            .map((operatorType) => ({ id: operatorType.id, title: operatorType.title }));

        const selectElem = ce('select');
        this.operatorField = this.createField('Operator', selectElem);

        this.operatorDropDown = DropDown.create({
            input_id: selectElem,
            onchange: this.onOperatorChange.bind(this),
            editable: false,
        });
        this.operatorDropDown.append(operatorItems);
        this.operatorDropDown.selectItem(operatorItems[0].id);
    }

    /** Create account field */
    createAccountField() {
        const accountItems = this.model.accounts.map(
            (account) => ({ id: account.id, title: account.name }),
        );

        const selectElem = ce('select');
        this.accountField = this.createField('Account', selectElem);

        this.accountDropDown = DropDown.create({
            input_id: selectElem,
            onchange: this.onValueChange.bind(this),
            editable: false,
        });
        this.accountDropDown.append(accountItems);
        this.accountDropDown.selectItem(accountItems[0].id);
    }

    /** Create template field */
    createTemplateField() {
        const templateItems = this.model.template.map(
            (template) => ({ id: template.id, title: template.name }),
        );

        const selectElem = ce('select');
        this.templateField = this.createField('Template', selectElem);

        this.templateDropDown = DropDown.create({
            input_id: selectElem,
            onchange: this.onValueChange.bind(this),
            editable: false,
        });
        this.templateDropDown.append(templateItems);
        if (templateItems.length > 0) {
            this.templateDropDown.selectItem(templateItems[0].id);
        }
    }

    /** Create currency field */
    createCurrencyField() {
        const currencyItems = this.model.currency.map(
            (currency) => ({ id: currency.id, title: currency.name }),
        );

        const selectElem = ce('select');
        this.currencyField = this.createField('Currency', selectElem);

        this.currencyDropDown = DropDown.create({
            input_id: selectElem,
            onchange: this.onValueChange.bind(this),
            editable: false,
        });
        this.currencyDropDown.append(currencyItems);
        this.currencyDropDown.selectItem(currencyItems[0].id);
    }

    /** Create value property field */
    createValuePropField() {
        const items = this.fieldTypes
            .filter((fieldType) => !ImportCondition.isTemplateField(fieldType.id))
            .map((fieldType) => ({ id: fieldType.id, title: fieldType.title }));

        const selectElem = ce('select');
        this.valuePropField = this.createField('Value property', selectElem);

        this.valuePropDropDown = DropDown.create({
            input_id: selectElem,
            onchange: this.onValueChange.bind(this),
            editable: false,
        });
        this.valuePropDropDown.append(items);
        this.valuePropDropDown.selectItem(items[0].id);
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

    /** Set main state of component */
    setData(data) {
        if (!data) {
            throw new Error('Invalid data');
        }

        this.state = {
            conditionId: data.id,
            parent: data.parent_id,
            fieldType: data.field_id,
            availOperators: data.getAvailOperators(),
            operator: data.operator,
            isFieldValue: data.isPropertyValue(),
            value: data.value,
            isValid: data.isValid,
            message: data.message,
        };

        this.verifyOperator(this.state);
        this.render(this.state);
        // Check value changed
        const value = this.getConditionValue(this.state);
        if (data.value !== value) {
            this.state.value = value;
            this.sendUpdate();
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

        this.state.value = this.getConditionValue(this.state);
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

        if (this.state.operator === operator.id) {
            return;
        }

        this.state.operator = operator.id;
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
        this.state.isFieldValue = this.fieldValueCheck.checked;
        this.state.value = this.getConditionValue(this.state);
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
        if (isFunction(this.updateHandler)) {
            this.updateHandler(this.getData(this.state));
        }
    }

    /** Delete button 'click' event handler */
    onDelete() {
        if (isFunction(this.deleteHandler)) {
            this.deleteHandler();
        }
    }

    /** Render operator select */
    renderOperator(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

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

    /** Render component state */
    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (state.isValid) {
            this.validFeedback.textContent = '';
            this.parentView.clearBlockValidation(this.container);
        } else {
            this.validFeedback.textContent = state.message;
            this.parentView.invalidateBlock(this.container);
        }

        this.propertyDropDown.selectItem(state.fieldType);
        this.renderOperator(state);
        this.fieldValueCheck.checked = state.isFieldValue;

        const isAccountValue = (
            !state.isFieldValue
            && ImportCondition.isAccountField(state.fieldType)
        );
        const isTplValue = (
            !state.isFieldValue
            && ImportCondition.isTemplateField(state.fieldType)
        );
        const isCurrencyValue = (
            !state.isFieldValue
            && ImportCondition.isCurrencyField(state.fieldType)
        );
        const isAmountValue = (
            !state.isFieldValue
            && ImportCondition.isAmountField(state.fieldType)
        );
        const isTextValue = (
            !state.isFieldValue
            && (
                ImportCondition.isDateField(state.fieldType)
                || ImportCondition.isStringField(state.fieldType)
            )
        );

        show(this.accountField, isAccountValue);
        show(this.templateField, isTplValue);
        show(this.currencyField, isCurrencyValue);
        show(this.amountField, isAmountValue);
        show(this.valuePropField, state.isFieldValue);
        show(this.valueField, isTextValue);

        this.setConditionValue(state);
    }
}
