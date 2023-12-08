import { isFunction, isNumber } from '@jezvejs/types';
import { getClassName } from '@jezvejs/dom';
import { Button } from 'jezvejs/Button';
import { DecimalInput } from 'jezvejs/DecimalInput';
import { InputGroup } from 'jezvejs/InputGroup';

import { getFixedValue } from './helpers.js';
import './NumberInputGroup.scss';

/* CSS classes */
const GROUP_CLASS = 'number-input-group';
const INPUT_OUTER_CLASS = 'input-group__input-outer';
const INPUT_CLASS = 'input input-group__input';
const INNER_BTN_CLASS = 'input-group__inner-btn';

const defaultProps = {
    inputId: undefined,
    locales: [],
    value: '',
    placeholder: '',
    disabled: false,
    step: 1,
    minValue: 1,
    maxValue: undefined,
    digits: 0,
    allowNegative: true,
    onInput: null,
    onChange: null,
    onIncrease: null,
    onDecrease: null,
};

/**
 * Number input form field component
 */
export class NumberInputGroup extends InputGroup {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
            className: getClassName(GROUP_CLASS, INPUT_OUTER_CLASS, props.className),
        });

        this.state = {
            ...this.props,
        };
    }

    get value() {
        return this.input.value;
    }

    init() {
        this.decreaseBtn = Button.create({
            icon: 'minus',
            className: INNER_BTN_CLASS,
            onClick: (e) => this.onDecrease(e),
        });

        this.input = DecimalInput.create({
            id: this.props.inputId,
            className: INPUT_CLASS,
            locales: this.props.locales,
            digits: this.props.digits,
            min: this.props.minValue,
            max: this.props.maxValue,
            allowNegative: this.props.allowNegative,
            placeholder: this.props.placeholder,
            onInput: (e) => this.onInput(e),
        });

        this.increaseBtn = Button.create({
            icon: 'plus',
            className: INNER_BTN_CLASS,
            onClick: (e) => this.onIncrease(e),
        });

        this.props.children = [
            this.decreaseBtn.elem,
            this.input.elem,
            this.increaseBtn.elem,
        ];

        super.init();
    }

    isValidValue(value) {
        if (value === '') {
            return true;
        }

        const fixedValue = getFixedValue(value);
        const { minValue, maxValue, allowNegative } = this.state;
        if (
            (!allowNegative && fixedValue < 0)
            || (isNumber(minValue) && fixedValue < minValue)
            || (isNumber(maxValue) && fixedValue > maxValue)
        ) {
            return false;
        }

        return true;
    }

    onDecrease(e) {
        const fixedValue = getFixedValue(this.state.value);
        const step = parseFloat(this.state.step);
        const value = fixedValue - step;

        if (!this.isValidValue(value)) {
            return;
        }

        this.setState({ ...this.state, value });

        if (isFunction(this.props.onDecrease)) {
            this.props.onDecrease(e);
        }

        this.notifyChanged();
    }

    onIncrease(e) {
        const fixedValue = getFixedValue(this.state.value);
        const step = parseFloat(this.state.step);
        const value = fixedValue + step;

        if (!this.isValidValue(value)) {
            return;
        }

        this.setState({ ...this.state, value });

        if (isFunction(this.props.onIncrease)) {
            this.props.onIncrease(e);
        }

        this.notifyChanged();
    }

    onInput(e) {
        const { value } = e.target;
        if (!this.isValidValue(value)) {
            return;
        }

        this.setState({ ...this.state, value });

        if (isFunction(this.props.onInput)) {
            this.props.onInput(e);
        }

        this.notifyChanged();
    }

    notifyChanged() {
        if (isFunction(this.props.onChange)) {
            this.props.onChange(this.state.value);
        }
    }

    enable(value = true) {
        const disabled = !value;
        if (this.state.disabled === disabled) {
            return;
        }

        this.setState({ ...this.state, disabled });
    }

    setValue(value) {
        if (this.state.value === value) {
            return;
        }

        const { minValue, maxValue } = this.state;
        if (
            (isNumber(minValue) && value < minValue)
            || (isNumber(maxValue) && value > maxValue)
        ) {
            return;
        }

        this.setState({ ...this.state, value });
    }

    renderInput(state, prevState) {
        if (state.value !== this.input.value) {
            this.input.value = state.value.toString();
        }
        if (state.disabled !== prevState?.disabled) {
            this.input.enable(!state.disabled);
        }
        if (state.placeholder !== prevState?.placeholder) {
            this.input.elem.placeholder = state.placeholder;
        }
    }

    render(state, prevState = {}) {
        super.enable(!state.disabled);

        this.renderInput(state, prevState);

        const fixedValue = getFixedValue(state.value);
        const isMinLimit = isNumber(state.minValue);
        const isMaxLimit = isNumber(state.maxValue);

        const enableDecrease = (
            !isMinLimit
            || (fixedValue - state.step >= state.minValue)
        );
        this.decreaseBtn.enable(enableDecrease && !state.disabled);

        const enableIncrease = (
            !isMaxLimit
            || (fixedValue - state.step <= state.maxValue)
        );
        this.increaseBtn.enable(enableIncrease && !state.disabled);
    }
}
