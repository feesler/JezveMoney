import { ce, Component } from 'jezvejs';
import {
    ImportCondition,
    IMPORT_COND_OP_FIELD_FLAG,
    IMPORT_COND_FIELD_TR_CURRENCY,
    IMPORT_COND_FIELD_ACC_CURRENCY,
    IMPORT_COND_FIELD_MAIN_ACCOUNT,
    IMPORT_COND_FIELD_TPL,
} from '../../../../js/model/ImportCondition.js';
import './style.scss';

/**
 * ImportConditionItem component
 */
export class ImportConditionItem extends Component {
    static create(props) {
        return new ImportConditionItem(props);
    }

    constructor(...args) {
        super(...args);

        if (!this.props?.data) {
            throw new Error('Invalid props');
        }

        this.submitHandler = this.props.submit;
        this.cancelHandler = this.props.cancel;
        this.updateHandler = this.props.update;
        this.deleteHandler = this.props.remove;

        if (!(this.props.data instanceof ImportCondition)) {
            throw new Error('Invalid rule item');
        }

        this.init();
        this.setData(this.props.data);
    }

    /** Main structure initialization */
    init() {
        this.propertyLabel = ce('span', { className: 'cond-item__property' });
        this.operatorLabel = ce('span', { className: 'cond-item__operator' });
        this.valueLabel = ce('span', { className: 'cond-item__value' });

        this.elem = window.app.createContainer('cond-item', [
            this.propertyLabel,
            this.operatorLabel,
            this.valueLabel,
        ]);
    }

    /** Set main state of component */
    setData(data) {
        if (!data) {
            throw new Error('Invalid data');
        }

        this.state = {
            conditionId: data.id,
            parentRuleId: data.rule_id,
            fieldType: data.field_id,
            operator: data.operator,
            isFieldValue: data.isPropertyValue(),
            value: data.value,
        };

        this.render(this.state);
    }

    /** Return import rule object */
    getData() {
        const res = {
            parent_id: this.state.parentRuleId,
            field_id: this.state.fieldType,
            operator: this.state.operator,
            value: this.state.value,
            flags: (this.state.isFieldValue) ? IMPORT_COND_OP_FIELD_FLAG : 0,
        };

        if (this.state.conditionId) {
            res.id = this.state.conditionId;
        }

        return res;
    }

    /** Return formatted rule value */
    formatValue(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (state.isFieldValue) {
            const propertyType = ImportCondition.getFieldTypeById(state.value);
            if (!propertyType) {
                throw new Error('Field type not found');
            }

            return propertyType.title;
        }

        if (
            state.fieldType === IMPORT_COND_FIELD_TR_CURRENCY
            || state.fieldType === IMPORT_COND_FIELD_ACC_CURRENCY
        ) {
            const valueItem = window.app.model.currency.getItem(state.value);
            if (!valueItem) {
                throw new Error('Invalid currency');
            }

            return valueItem.name;
        }

        if (state.fieldType === IMPORT_COND_FIELD_MAIN_ACCOUNT) {
            const valueItem = window.app.model.accounts.getItem(state.value);
            if (!valueItem) {
                throw new Error('Invalid account');
            }

            return valueItem.name;
        }

        if (state.fieldType === IMPORT_COND_FIELD_TPL) {
            const valueItem = window.app.model.templates.getItem(state.value);
            if (!valueItem) {
                throw new Error('Invalid template');
            }

            return valueItem.name;
        }

        return state.value;
    }

    /** Render component state */
    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        // Left value property
        const propertyType = ImportCondition.getFieldTypeById(state.fieldType);
        if (!propertyType) {
            throw new Error('Field type not found');
        }
        this.propertyLabel.textContent = propertyType.title;
        // Operator
        const operatorType = ImportCondition.getOperatorById(state.operator);
        if (!operatorType) {
            throw new Error('Operator not found');
        }
        this.operatorLabel.textContent = operatorType.title;
        // Right value
        if (state.isFieldValue) {
            this.valueLabel.classList.add('cond-item__value-property');
            this.valueLabel.classList.remove('cond-item__value');
        } else {
            this.valueLabel.classList.remove('cond-item__value-property');
            this.valueLabel.classList.add('cond-item__value');
        }
        this.valueLabel.textContent = this.formatValue(state);
    }
}
