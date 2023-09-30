import {
    isDate,
    isFunction,
    Component,
    createElement,
} from 'jezvejs';
import { DatePicker } from 'jezvejs/DatePicker';

import { parseDate, __, timeToDate } from '../../../../../utils/utils.js';
import { App } from '../../../../../Application/App.js';

import { DateInputGroup } from '../DateInputGroup/DateInputGroup.js';

import './DateRangeInput.scss';

const DATEPICKER_CONTAINER_CLASS = 'calendar';
const FEEDBACK_CLASS = 'feedback invalid-feedback';

const validateDateOptions = {
    fixShortYear: false,
};

const defaultValidation = {
    startDate: true,
    endDate: true,
    order: true,
    valid: true,
};

const defaultProps = {
    start: null,
    end: null,
    startPlaceholder: null,
    endPlaceholder: null,
    startClearable: true,
    endClearable: true,
    startVisible: true,
    endVisible: true,
    disabled: false,
    startDisabled: false,
    endDisabled: false,
    onChange: null,
};

/**
 * Date range component
 */
export class DateRangeInput extends Component {
    static userProps = {
        elem: ['id'],
    };

    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        this.state = {
            ...this.props,
            selectPart: null,
        };

        this.init();
    }

    init() {
        this.startDateGroup = DateInputGroup.create({
            className: 'date-range-part',
            name: 'startDate',
            locales: App.dateFormatLocale,
            placeholder: this.props.startPlaceholder,
            clearButton: this.props.startClearable,
            onInput: (e) => this.onStartDateInput(e),
            onClear: () => this.onStartDateClear(),
            onToggleDialog: () => this.showCalendar(true),
        });

        this.endDateGroup = DateInputGroup.create({
            className: 'date-range-part',
            name: 'endDate',
            locales: App.dateFormatLocale,
            placeholder: this.props.endPlaceholder,
            clearButton: this.props.endClearable,
            onInput: (e) => this.onEndDateInput(e),
            onClear: () => this.onEndDateClear(),
            onToggleDialog: () => this.showCalendar(false),
        });

        const inputsContainer = createElement('div', {
            props: { className: 'row-container' },
            children: [
                this.startDateGroup.elem,
                this.endDateGroup.elem,
            ],
        });

        const hiddenInp = createElement('input', {
            props: { type: 'submit' },
            attrs: { hidden: '' },
        });

        this.datePickerWrapper = createElement('div', {
            props: { className: DATEPICKER_CONTAINER_CLASS },
        });

        this.feedbackElem = createElement('div', {
            props: {
                className: FEEDBACK_CLASS,
                textContent: __('dateRange.invalidRange'),
            },
        });

        this.elem = createElement('form', {
            props: { className: 'date-range-input validation-block' },
            events: { submit: (e) => this.onSubmit(e) },
            children: [
                inputsContainer,
                hiddenInp,
                this.datePickerWrapper,
                this.feedbackElem,
            ],
        });

        this.setClassNames();
        this.setUserProps();
        this.setData(this.props);
    }

    setData(data) {
        const startDate = (data.startDate)
            ? App.formatInputDate(data.startDate)
            : null;
        const endDate = (data.endDate)
            ? App.formatInputDate(data.endDate)
            : null;

        this.setState({
            ...this.state,
            form: { startDate, endDate },
            filter: { startDate, endDate },
            validation: { ...defaultValidation },
        });
    }

    notifyChanged() {
        if (!isFunction(this.props.onChange)) {
            return;
        }

        const { form } = this.state;

        this.props.onChange({
            startDate: form.startDate,
            endDate: form.endDate,
        });
    }

    isDisabledDate(date, state) {
        const rangePart = state?.rangePart;
        if (rangePart !== 'start' && rangePart !== 'end') {
            return false;
        }

        const { filter } = this.state;

        const limitValue = (rangePart === 'start') ? filter.endate : filter.startDate;
        if (!limitValue) {
            return false;
        }
        const limitDate = (typeof limitValue === 'string')
            ? parseDate(limitValue)
            : timeToDate(limitValue);
        if (!limitDate) {
            return false;
        }

        const diff = limitDate - date;
        return (rangePart === 'start') ? (diff < 0) : (diff > 0);
    }

    /**
     * Date select callback
     * @param {Date} date - selected date
     */
    onDateSelect(date) {
        if (!isDate(date)) {
            return;
        }

        const dateFmt = App.formatInputDate(date);
        const form = {
            ...this.state.form,
        };

        if (this.state.selectPart === 'start') {
            if (dateFmt === this.state.form.startDate) {
                return;
            }

            form.startDate = dateFmt;
        } else if (this.state.selectPart === 'end') {
            if (dateFmt === this.state.form.endDate) {
                return;
            }

            form.endDate = dateFmt;
        }

        this.setState({
            ...this.state,
            form,
        });

        this.datePicker.hide();
    }

    /**
     * Date picker hide callback
     */
    onDatePickerHide() {
        this.setState({
            ...this.state,
            selectPart: null,
        });

        const { filter, form } = this.state;
        if (filter.startDate === form.startDate && filter.endDate === form.endDate) {
            return;
        }

        this.notifyChanged();
    }

    /** Date range form 'submit' event handler */
    onSubmit(e) {
        e.preventDefault();

        const validation = this.validateDateRange();
        if (validation.valid) {
            this.notifyChanged();
        } else {
            this.setState({ ...this.state, validation });
        }
    }

    onStartDateInput(e) {
        this.setState({
            ...this.state,
            form: {
                ...this.state.form,
                startDate: e.target.value,
            },
            validation: { ...defaultValidation },
        });

        this.notifyChanged();
    }

    onEndDateInput(e) {
        this.setState({
            ...this.state,
            form: {
                ...this.state.form,
                endDate: e.target.value,
            },
            validation: { ...defaultValidation },
        });

        this.notifyChanged();
    }

    validateDateRange(state = this.state) {
        const validation = { ...defaultValidation };
        const startDate = parseDate(state.form.startDate, validateDateOptions);
        const endDate = parseDate(state.form.endDate, validateDateOptions);
        if (!startDate && !state.startClearable) {
            validation.startDate = false;
        }
        if (!endDate && !state.endClearable) {
            validation.endDate = false;
        }
        if (startDate && endDate && startDate > endDate) {
            validation.order = false;
        }
        validation.valid = (
            validation.startDate
            && validation.endDate
            && validation.order
        );

        return validation;
    }

    /**
     * Show calendar block
     */
    showCalendar(selectStartDateFilter) {
        if (!this.datePicker) {
            this.datePicker = DatePicker.create({
                relparent: this.datePickerWrapper.parentNode,
                locales: App.getCurrrentLocale(),
                disabledDateFilter: (...args) => this.isDisabledDate(...args),
                onDateSelect: (date) => this.onDateSelect(date),
                onHide: () => this.onDatePickerHide(),
            });
            this.datePickerWrapper.append(this.datePicker.elem);

            this.setDatePickerSelection();
        }

        const selectPart = (selectStartDateFilter) ? 'start' : 'end';
        if (selectPart === this.state.selectPart) {
            this.datePicker.show(!this.datePicker.visible());
        } else {
            this.datePicker.setRangePart(selectPart);
            this.datePicker.show();
        }

        this.setState({
            ...this.state,
            selectPart,
        });
    }

    /**
     * Clear start date of range
     */
    onStartDateClear() {
        if (!this.state.form.startDate) {
            return;
        }

        this.setState({
            ...this.state,
            form: {
                ...this.state.form,
                startDate: null,
            },
            validation: { ...defaultValidation },
        });

        if (this.datePicker) {
            this.datePicker.hide();
        } else {
            this.notifyChanged();
        }
    }

    /**
     * Clear end date of range
     */
    onEndDateClear() {
        if (!this.state.form.endDate) {
            return;
        }

        this.setState({
            ...this.state,
            form: {
                ...this.state.form,
                endDate: null,
            },
            validation: { ...defaultValidation },
        });

        if (this.datePicker) {
            this.datePicker.hide();
        } else {
            this.notifyChanged();
        }
    }

    setDatePickerSelection(state = this.state) {
        if (!this.datePicker) {
            return;
        }

        let value = null;
        const { selectPart } = state;
        if (selectPart === 'start') {
            value = state.filter.startDate;
        } else if (selectPart === 'end') {
            value = state.filter.endDate;
        } else {
            return;
        }

        const date = parseDate(value);
        if (date) {
            this.datePicker.setSelection(date);
        } else {
            this.datePicker.clearSelection();
        }
    }

    render(state, prevState = {}) {
        // Start date field
        this.startDateGroup.setState((startState) => ({
            ...startState,
            value: state.form.startDate ?? '',
            disabled: (state.disabled || state.startDisabled),
            clearButton: state.startClearable,
        }));
        this.startDateGroup.show(state.startVisible);

        // End date field
        this.endDateGroup.setState((endState) => ({
            ...endState,
            value: state.form.endDate ?? '',
            disabled: (state.disabled || state.endDisabled),
            clearButton: state.endClearable,
        }));
        this.endDateGroup.show(state.endVisible);

        App.setValidation(this.elem, state.validation.valid);

        this.setDatePickerSelection(state);
        if (this.datePicker && state.selectPart !== prevState?.selectPart) {
            this.datePicker.setRangePart(state.selectPart);
        }
    }
}
