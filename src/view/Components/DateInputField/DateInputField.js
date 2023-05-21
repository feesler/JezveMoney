import { createElement, isFunction } from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { DateInput } from 'jezvejs/DateInput';
import { DatePicker } from 'jezvejs/DatePicker';
import { InputGroup } from 'jezvejs/InputGroup';
import { Field } from '../Field/Field.js';
import { __, timeToDate } from '../../utils/utils.js';

const defaultProps = {
    locales: [],
    value: '',
    placeholder: '',
    date: Date.now(),
    disabled: false,
    validate: false,
    feedbackMessage: null,
    valid: true,
    onInput: null,
    onDateSelect: null,
};

/**
 * Date input form field component
 */
export class DateInputField extends Field {
    static userProps = {
        elem: ['id'],
        titleElem: ['htmlFor'],
        input: ['placeholder'],
    };

    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });
    }

    init() {
        this.input = DateInput.create({
            className: 'input input-group__input',
            locales: this.props.locales,
            onInput: (e) => this.onInput(e),
        });

        this.datePickerBtn = Button.create({
            className: 'input-group__btn',
            icon: 'calendar-icon',
            onClick: () => this.showCalendar(),
        });

        this.group = InputGroup.create({
            children: [
                this.input.elem,
                this.datePickerBtn.elem,
            ],
        });

        this.datePickerWrapper = createElement('div', { props: { className: 'calendar' } });

        this.container = createElement('div', {
            props: { className: 'column-container' },
            children: [
                this.group.elem,
                this.datePickerWrapper,
            ],
        });

        this.state.content = [this.container];

        if (this.state.validate) {
            this.feedbackElem = createElement('div', {
                props: {
                    className: 'feedback invalid-feedback',
                    textContent: __('TR_INVALID_DATE'),
                },
            });

            this.state.content.push(this.feedbackElem);
        }

        super.init();
    }

    createDatePicker() {
        if (this.datePicker) {
            return;
        }

        this.datePicker = DatePicker.create({
            relparent: this.container,
            locales: window.app.getCurrrentLocale(),
            onDateSelect: (d) => this.onDateSelect(d),
        });
        this.datePickerWrapper.append(this.datePicker.elem);
    }

    /** Shows date picker */
    showCalendar() {
        this.createDatePicker();
        if (!this.datePicker) {
            return;
        }

        const visible = this.datePicker.visible();
        const { date } = this.state;
        if (!visible && date) {
            this.datePicker.setSelection(timeToDate(date));
        }

        this.datePicker.show(!visible);
    }

    onInput(e) {
        if (isFunction(this.props.onInput)) {
            this.props.onInput(e);
        }
    }

    onDateSelect(date) {
        if (isFunction(this.props.onDateSelect)) {
            this.props.onDateSelect(date);
        }
    }

    renderInput(state, prevState) {
        if (state.value !== prevState?.value) {
            this.input.value = state.value;
        }

        if (state.disabled !== prevState?.disabled) {
            this.input.enable(!state.disabled);
            this.datePickerBtn.enable(!state.disabled);
        }
        if (state.placeholder !== prevState?.placeholder) {
            this.input.elem.placeholder = state.placeholder;
        }
    }

    render(state, prevState = {}) {
        super.render(state, prevState);

        this.elem.classList.toggle('validation-block', state.validate);
        if (state.validate) {
            window.app.setValidation(this.elem, state.valid);
            this.feedbackElem.textContent = state.feedbackMessage;
        }

        this.renderInput(state, prevState);
    }
}
