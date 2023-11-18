import { createElement, enable } from '@jezvejs/dom';
import { Input } from 'jezvejs/Input';

import { App } from '../../../../Application/App.js';
import { Field } from '../../../Common/Field/Field.js';
import './ColorField.scss';

/* CSS classes */
const FIELD_CLASS = 'field horizontal-field color-field';
const TITLE_CLASS = 'field__title';
const CONTENT_CLASS = 'field__content';
const INPUT_CLASS = 'input-field__input';
const COLOR_VALUE_CLASS = 'input-field__input-color';
const INPUT_CONTAINER_CLASS = 'input-field__input-container';
const COLOR_PROP = '--color-field-value';

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
        this.input = Input.create({
            id: this.props.inputId,
            className: INPUT_CLASS,
            type: 'color',
            name: this.props.name,
            onInput: this.props.onInput,
            onChange: this.props.onChange,
            onFocus: this.props.onFocus,
            onBlur: this.props.onBlur,
        });

        this.colorValue = createElement('div', { props: { className: COLOR_VALUE_CLASS } });

        this.inputContainer = createElement('div', {
            props: { className: INPUT_CONTAINER_CLASS },
            children: [
                this.input.elem,
                this.colorValue,
            ],
        });

        this.state.content = [this.inputContainer];

        if (this.state.validate) {
            this.feedbackElem = createElement('div', {
                props: {
                    className: 'feedback invalid-feedback',
                },
            });

            this.state.content.push(this.feedbackElem);
        }

        this.titleElem = createElement('label', { props: { className: TITLE_CLASS } });
        this.contentContainer = createElement('div', { props: { className: CONTENT_CLASS } });

        const { tagName } = this.props;
        if (typeof tagName !== 'string' || tagName.length === 0) {
            throw new Error('Invalid tagName property');
        }

        this.elem = createElement(tagName, {
            props: { className: FIELD_CLASS },
            children: [this.titleElem, this.contentContainer],
        });
    }

    renderInput(state, prevState) {
        this.input.value = state.value;

        if (state.disabled !== prevState?.disabled) {
            this.input.enable(!state.disabled);
        }
    }

    render(state, prevState = {}) {
        super.render(state, prevState);

        this.elem.classList.toggle('validation-block', state.validate);
        if (state.validate) {
            App.setValidation(this.elem, state.valid);
            this.feedbackElem.textContent = state.feedbackMessage;
        }

        this.renderInput(state, prevState);

        if (state.value !== prevState?.value) {
            this.inputContainer.style.setProperty(COLOR_PROP, state.value);
        }

        if (state.disabled !== prevState?.disabled) {
            enable(this.elem, !state.disabled);
        }
    }
}
