import { createElement, enable } from '@jezvejs/dom';
import { ColorInput } from 'jezvejs/ColorInput';

import { App } from '../../../../Application/App.js';
import { Field } from '../../../Common/Field/Field.js';
import './ColorField.scss';

/* CSS classes */
const FIELD_CLASS = 'field horizontal-field color-field';
const TITLE_CLASS = 'field__title';
const CONTENT_CLASS = 'field__content';
const INPUT_CLASS = 'color-field__input';

const defaultProps = {
    inputId: undefined,
    title: null,
    value: '',
    name: undefined,
    disabled: false,
    validate: false,
    feedbackMessage: null,
    valid: true,
    onInput: null,
    onChange: null,
    onFocus: null,
    onBlur: null,
};

/**
 * Color input field component
 */
export class ColorField extends Field {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });
    }

    init() {
        this.input = ColorInput.create({
            id: this.props.inputId,
            className: INPUT_CLASS,
            type: 'color',
            name: this.props.name,
            value: this.props.value,
            disabled: this.props.disabled,
            onInput: this.props.onInput,
            onChange: this.props.onChange,
            onFocus: this.props.onFocus,
            onBlur: this.props.onBlur,
        });

        this.state.content = [this.input.elem];

        if (this.state.validate) {
            this.feedbackElem = createElement('div', {
                props: {
                    className: 'feedback invalid-feedback',
                },
            });
        }

        this.titleElem = createElement('label', { props: { className: TITLE_CLASS } });
        this.contentContainer = createElement('div', { props: { className: CONTENT_CLASS } });

        const { tagName } = this.props;
        if (typeof tagName !== 'string' || tagName.length === 0) {
            throw new Error('Invalid tagName property');
        }

        this.elem = createElement(tagName, {
            props: { className: FIELD_CLASS },
            children: [
                this.titleElem,
                this.contentContainer,
                this.feedbackElem,
            ],
        });
    }

    renderInput(state, prevState) {
        if (
            state.value === prevState.value
            && state.disabled === prevState.disabled
        ) {
            return;
        }

        this.input.setState((inputState) => ({
            ...inputState,
            value: state.value,
            disabled: state.disabled,
        }));
    }

    render(state, prevState = {}) {
        super.render(state, prevState);

        this.elem.classList.toggle('validation-block', state.validate);
        if (state.validate) {
            App.setValidation(this.elem, state.valid);
            this.feedbackElem.textContent = state.feedbackMessage;
        }

        this.renderInput(state, prevState);

        if (state.disabled !== prevState?.disabled) {
            enable(this.elem, !state.disabled);
        }
    }
}
