import {
    isFunction,
    createElement,
} from 'jezvejs';
import { DecimalInput } from 'jezvejs/DecimalInput';
import { CloseButton } from 'jezvejs/CloseButton';
import { InputGroup } from 'jezvejs/InputGroup';

import { __ } from '../../../utils/utils.js';
import { normalize } from '../../../utils/decimal.js';
import { App } from '../../../Application/App.js';

import { Field } from '../Field/Field.js';

import './AmountRangeField.scss';

const CONTAINER_CLASS = 'field amount-range-field';
const TITLE_CLASS = 'field__title';
const CONTENT_CLASS = 'field__content';
const FEEDBACK_CLASS = 'feedback invalid-feedback';

const defaultValidation = {
    minAmount: true,
    maxAmount: true,
    order: true,
    valid: true,
};

const defaultProps = {
    minAmount: null,
    maxAmount: null,
    minPlaceholder: null,
    maxPlaceholder: null,
    minClearable: true,
    maxClearable: true,
    minVisible: true,
    maxVisible: true,
    disabled: false,
    minDisabled: false,
    maxDisabled: false,
    validation: false,
    onChange: null,
};

/**
 * Date range component
 */
export class AmountRangeField extends Field {
    static userProps = {
        elem: ['id'],
    };

    static getRangeState(data, state) {
        const minAmount = (data.minAmount) ? normalize(data.minAmount) : null;
        const maxAmount = (data.maxAmount) ? normalize(data.maxAmount) : null;

        return {
            ...state,
            form: { minAmount, maxAmount },
            filter: { minAmount, maxAmount },
            validation: { ...defaultValidation },
        };
    }

    constructor(props = {}) {
        const fieldProps = {
            ...defaultProps,
            ...props,
        };

        super(AmountRangeField.getRangeState(fieldProps, fieldProps));
    }

    init() {
        // Minimum amount
        this.minInput = DecimalInput.create({
            className: 'input input-group__input right-align-text',
            placeholder: this.state.minPlaceholder,
            onInput: (e) => this.onMinAmountInput(e),
        });
        this.minClearBtn = CloseButton.create({
            className: 'input-group__inner-btn clear-btn',
            onClick: (e) => this.onMinAmountClear(e),
        });
        this.minAmountGroup = InputGroup.create({
            className: 'input-group__input-outer range-part',
            children: [
                this.minInput.elem,
                this.minClearBtn.elem,
            ],
        });

        // Maximum amount
        this.maxInput = DecimalInput.create({
            className: 'input input-group__input right-align-text',
            placeholder: this.state.maxPlaceholder,
            onInput: (e) => this.onMaxAmountInput(e),
        });
        this.maxClearBtn = CloseButton.create({
            className: 'input-group__inner-btn clear-btn',
            onClick: (e) => this.onMaxAmountClear(e),
        });

        this.maxAmountGroup = InputGroup.create({
            className: 'input-group__input-outer range-part',
            children: [
                this.maxInput.elem,
                this.maxClearBtn.elem,
            ],
        });

        const inputsContainer = createElement('div', {
            props: { className: 'row-container' },
            children: [
                this.minAmountGroup.elem,
                this.maxAmountGroup.elem,
            ],
        });

        const content = [inputsContainer];

        if (this.state.validate) {
            this.feedbackElem = createElement('div', {
                props: {
                    className: FEEDBACK_CLASS,
                    textContent: __('transactions.invalidAmount'),
                },
            });

            content.push(this.feedbackElem);
        }

        this.titleElem = createElement('label', { props: { className: TITLE_CLASS } });
        this.contentContainer = createElement('div', {
            props: { className: CONTENT_CLASS },
            children: content,
        });

        this.elem = createElement('div', {
            props: { className: CONTAINER_CLASS },
            children: [this.titleElem, this.contentContainer],
        });
    }

    postInit() {
        this.setClassNames();
        this.setUserProps();
    }

    getRangeState(data, state = this.state) {
        return AmountRangeField.getRangeState(data, state);
    }

    setData(data) {
        this.setState(this.getRangeState(data));
    }

    notifyChanged() {
        if (!isFunction(this.props.onChange)) {
            return;
        }

        const { minAmount, maxAmount } = this.state.form;
        this.props.onChange({
            minAmount,
            maxAmount,
        });
    }

    onMinAmountInput(e) {
        this.setState({
            ...this.state,
            form: {
                ...this.state.form,
                minAmount: e.target.value,
            },
            validation: { ...defaultValidation },
        });

        this.notifyChanged();
    }

    onMaxAmountInput(e) {
        this.setState({
            ...this.state,
            form: {
                ...this.state.form,
                maxAmount: e.target.value,
            },
            validation: { ...defaultValidation },
        });

        this.notifyChanged();
    }

    validateAmountRange(state = this.state) {
        const validation = { ...defaultValidation };
        const minAmount = parseFloat(state.form.minAmount);
        const maxAmount = parseFloat(state.form.maxAmount);
        if (!minAmount && !state.minClearable) {
            validation.minAmount = false;
        }
        if (!maxAmount && !state.maxClearable) {
            validation.maxAmount = false;
        }
        if (minAmount && maxAmount && minAmount > maxAmount) {
            validation.order = false;
        }
        validation.valid = (
            validation.minAmount
            && validation.maxAmount
            && validation.order
        );

        return validation;
    }

    /**
     * Clears minimum amount
     */
    onMinAmountClear() {
        if (!this.state.form.minAmount) {
            return;
        }

        this.setState({
            ...this.state,
            form: {
                ...this.state.form,
                minAmount: null,
            },
            validation: { ...defaultValidation },
        });

        this.notifyChanged();
    }

    /**
     * Clear end date of range
     */
    onMaxAmountClear() {
        if (!this.state.form.maxAmount) {
            return;
        }

        this.setState({
            ...this.state,
            form: {
                ...this.state.form,
                maxAmount: null,
            },
            validation: { ...defaultValidation },
        });

        this.notifyChanged();
    }

    render(state, prevState = {}) {
        this.renderTitle(state, prevState);

        // Minimum amount field
        const minDisabled = (state.disabled || state.minDisabled);
        const minAmount = state.form.minAmount?.toString() ?? '';

        this.minInput.value = minAmount;
        this.minInput.enable(!minDisabled);

        const showMinClear = (
            state.minClearable
            && !minDisabled
            && (minAmount.length > 0)
        );
        this.minClearBtn.show(showMinClear);
        this.minAmountGroup.show(state.minVisible);

        // Maximum field
        const maxDisabled = (state.disabled || state.maxDisabled);
        const maxAmount = state.form.maxAmount?.toString() ?? '';
        this.maxInput.value = maxAmount;
        this.maxInput.enable(!maxDisabled);

        const showMaxClear = (
            state.maxClearable
            && !maxDisabled
            && (maxAmount.length > 0)
        );
        this.maxClearBtn.show(showMaxClear);

        this.maxAmountGroup.show(state.maxVisible);

        App.setValidation(this.elem, state.validation.valid);
    }
}
