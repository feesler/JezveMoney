import { createElement } from 'jezvejs';
import { DatePicker } from 'jezvejs/DatePicker';

import { __, timeToDate } from '../../../../utils/utils.js';
import { App } from '../../../../Application/App.js';

import { Field } from '../../../Common/Field/Field.js';
import { DateInputGroup } from '../../Inputs/Date/DateInputGroup/DateInputGroup.js';

const defaultProps = {
    locales: [],
    value: '',
    placeholder: '',
    date: Date.now(),
    disabled: false,
    validate: false,
    feedbackMessage: null,
    valid: true,
    clearButton: false,
    onInput: null,
    onClear: null,
    onDateSelect: null,
};

/**
 * Date input form field component
 */
export class DateInputField extends Field {
    static userProps = {
        elem: ['id'],
        titleElem: ['htmlFor'],
    };

    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });
    }

    init() {
        this.group = DateInputGroup.create({
            locales: this.props.locales,
            onInput: this.props.onInput,
            onToggleDialog: () => this.showCalendar(),
            onClear: this.props.onClear,
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
                    textContent: __('transactions.invalidDate'),
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
            locales: App.getCurrrentLocale(),
            onDateSelect: this.props.onDateSelect,
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

    renderInput(state) {
        this.group.setState((groupState) => ({
            ...groupState,
            value: state.value,
            disabled: state.disabled,
            placeholder: state.placeholder,
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
    }
}
