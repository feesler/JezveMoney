import { createElement, getClassNames, setProps } from 'jezvejs';
import { Input } from 'jezvejs/Input';

import { App } from '../../Application/App.js';
import { Field } from '../Field/Field.js';
import './InputField.scss';

/* CSS classes */
const FIELD_CLASS = 'input-field';
const INPUT_CLASS = 'input-field__input';

const disabledInputAutoProps = {
    autocomplete: 'off',
    autocapitalize: 'none',
    autocorrect: 'off',
    spellcheck: false,
};

const defaultProps = {
    inputId: undefined,
    title: null,
    value: '',
    type: 'text',
    placeholder: '',
    name: undefined,
    disabled: false,
    validate: false,
    feedbackMessage: null,
    valid: true,
    disableAutoProps: true,
    onInput: null,
    onChange: null,
    onFocus: null,
    onBlur: null,
};

/**
 * Input form field component
 */
export class InputField extends Field {
    static userProps = {
        elem: ['id'],
        titleElem: ['htmlFor'],
    };

    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
            className: getClassNames(FIELD_CLASS, props.className),
            htmlFor: props.inputId,
        });
    }

    init() {
        this.input = Input.create({
            id: this.props.inputId,
            className: INPUT_CLASS,
            type: this.props.type,
            name: this.props.name,
            placeholder: this.props.placeholder,
            onInput: this.props.onInput,
            onChange: this.props.onChange,
            onFocus: this.props.onFocus,
            onBlur: this.props.onBlur,
        });
        if (this.props.disableAutoProps) {
            setProps(this.input.elem, disabledInputAutoProps);
        }

        this.state.content = [this.input.elem];

        if (this.state.validate) {
            this.feedbackElem = createElement('div', {
                props: {
                    className: 'feedback invalid-feedback',
                },
            });

            this.state.content.push(this.feedbackElem);
        }

        super.init();
    }

    focus() {
        this.input.elem.focus();
    }

    blur() {
        this.input.elem.focus();
    }

    renderInput(state, prevState) {
        this.input.value = state.value;

        if (state.disabled !== prevState?.disabled) {
            this.input.enable(!state.disabled);
        }
        if (state.placeholder !== prevState?.placeholder) {
            this.input.elem.placeholder = state.placeholder;
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
    }
}
