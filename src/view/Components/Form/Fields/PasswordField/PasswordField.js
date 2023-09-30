import { createElement, getClassNames, setProps } from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { Input } from 'jezvejs/Input';
import { InputGroup } from 'jezvejs/InputGroup';

import { App } from '../../../../Application/App.js';

import { Field } from '../../../Common/Field/Field.js';

import './PasswordField.scss';

/* CSS classes */
const FIELD_CLASS = 'password-field';
const INPUT_CLASS = 'input-group__input password-field__input';
const BTN_CLASS = 'input-group__inner-btn toggle-show-btn';

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
    placeholder: '',
    name: undefined,
    disabled: false,
    validate: false,
    feedbackMessage: null,
    valid: true,
    disableAutoProps: true,
    showPassword: false,
    onInput: null,
    onChange: null,
    onFocus: null,
    onBlur: null,
};

/**
 * Password input form field component
 */
export class PasswordField extends Field {
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
            type: 'password',
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

        this.showPasswordBtn = Button.create({
            icon: 'show',
            className: BTN_CLASS,
            onClick: (e) => this.toggleShowPassword(e),
        });

        this.group = InputGroup.create({
            className: 'input-group__input-outer',
            children: [
                this.input.elem,
                this.showPasswordBtn.elem,
            ],
        });

        this.state.content = [this.group.elem];

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

    toggleShowPassword() {
        this.setState({
            ...this.state,
            showPassword: !this.state.showPassword,
        });
    }

    focus() {
        this.input.elem.focus();
    }

    blur() {
        this.input.elem.focus();
    }

    renderInput(state, prevState) {
        this.input.value = state.value;

        if (state.showPassword !== prevState?.showPassword) {
            this.input.elem.type = (state.showPassword) ? 'text' : 'password';
        }
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

        if (
            state.showPassword !== prevState?.showPassword
            || state.disabled !== prevState?.disabled
        ) {
            this.showPasswordBtn.setState((btnState) => ({
                ...btnState,
                icon: (state.showPassword) ? 'hide' : 'show',
                enabled: !state.disabled,
            }));
        }

        this.showPasswordBtn.show(state.value?.length > 0);
    }
}
