import {
    isDate,
    isFunction,
    Component,
    createElement,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { CloseButton } from 'jezvejs/CloseButton';
import { DateInput } from 'jezvejs/DateInput';
import { DatePicker } from 'jezvejs/DatePicker';
import { InputGroup } from 'jezvejs/InputGroup';
import {
    dateStringToTime,
    fixDate,
    timeToDate,
    __,
} from '../../js/utils.js';
import './style.scss';

const DATEPICKER_CONTAINER_CLASS = 'calendar';
const FEEDBACK_CLASS = 'feedback invalid-feedback';

const defaultValidation = {
    stdate: true,
    enddate: true,
    order: true,
    valid: true,
};

const defaultProps = {
    start: null,
    end: null,
    startPlaceholder: null,
    endPlaceholder: null,
    onChange: null,
};

/**
 * Date range component
 */
export class DateRangeInput extends Component {
    static userProps = {
        elem: ['id'],
    };

    constructor(props) {
        super(props);

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        this.state = {};

        this.init();
    }

    init() {
        this.startDateInput = DateInput.create({
            className: 'input-group__input stretch-input',
            name: 'stdate',
            locales: window.app.dateFormatLocale,
            placeholder: this.props.startPlaceholder,
            onInput: (e) => this.onStartDateInput(e),
        });

        const textElem = createElement('div', {
            props: {
                className: 'input-group__text',
                textContent: '-',
            },
        });

        this.endDateInput = DateInput.create({
            className: 'input-group__input stretch-input',
            name: 'enddate',
            locales: window.app.dateFormatLocale,
            placeholder: this.props.endPlaceholder,
            onInput: (e) => this.onEndDateInput(e),
        });

        this.clearBtn = CloseButton.create({
            className: 'input-group__inner-btn clear-btn',
            onClick: () => this.onDateClear(),
        });

        this.dateInputBtn = Button.create({
            icon: 'calendar-icon',
            className: 'icon-btn input-group__btn dp-btn',
            onClick: () => this.showCalendar(),
        });

        this.inputGroup = InputGroup.create({
            children: [
                this.startDateInput.elem,
                textElem,
                this.endDateInput.elem,
                this.clearBtn.elem,
                this.dateInputBtn.elem,
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
                textContent: __('FILTER_INVALID_DATE_RANGE'),
            },
        });

        this.elem = createElement('form', {
            props: { className: 'validation-block' },
            events: { submit: (e) => this.onSubmit(e) },
            children: [
                this.inputGroup.elem,
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
        const stdate = (data.stdate) ? window.app.formatDate(timeToDate(data.stdate)) : null;
        const enddate = (data.enddate) ? window.app.formatDate(timeToDate(data.enddate)) : null;

        this.setState({
            form: { stdate, enddate },
            filter: { stdate, enddate },
            validation: { ...defaultValidation },
        });
    }

    notifyChanged(data) {
        if (!isFunction(this.props.onChange)) {
            return;
        }

        this.props.onChange({
            stdate: dateStringToTime(data.stdate),
            enddate: dateStringToTime(data.enddate),
        });
    }

    /**
     * Date range select calback
     * @param {Range} range - object with 'start' and 'end' date properties
     */
    onRangeSelect(range) {
        if (!range || !isDate(range.start) || !isDate(range.end)) {
            return;
        }

        const stdate = window.app.formatDate(range.start);
        const enddate = window.app.formatDate(range.end);
        if (stdate === this.state.form.stdate && enddate === this.state.form.enddate) {
            return;
        }

        this.setState({
            ...this.state,
            form: {
                stdate,
                enddate,
            },
        });

        this.datePicker.hide();
    }

    /**
     * Date picker hide callback
     */
    onDatePickerHide() {
        const { filter, form } = this.state;
        if (filter.stdate === form.stdate && filter.enddate === form.enddate) {
            return;
        }

        this.notifyChanged(form);
    }

    /** Date range form 'submit' event handler */
    onSubmit(e) {
        e.preventDefault();

        const validation = this.validateDateRange();
        if (validation.valid) {
            this.notifyChanged(this.state.form);
        } else {
            this.setState({ ...this.state, validation });
        }
    }

    onStartDateInput(e) {
        this.setState({
            ...this.state,
            form: {
                ...this.state.form,
                stdate: e.target.value,
            },
            validation: { ...defaultValidation },
        });
    }

    onEndDateInput(e) {
        this.setState({
            ...this.state,
            form: {
                ...this.state.form,
                enddate: e.target.value,
            },
            validation: { ...defaultValidation },
        });
    }

    validateDateRange(state = this.state) {
        const validation = { ...defaultValidation };
        const startDate = fixDate(state.form.stdate);
        const endDate = fixDate(state.form.enddate);
        if (!startDate) {
            validation.stdate = false;
        }
        if (!endDate) {
            validation.enddate = false;
        }
        if (startDate > endDate) {
            validation.order = false;
        }
        validation.valid = (
            validation.stdate
            && validation.enddate
            && validation.order
        );

        return validation;
    }

    /**
     * Show calendar block
     */
    showCalendar() {
        if (!this.datePicker) {
            this.datePicker = DatePicker.create({
                relparent: this.datePickerWrapper.parentNode,
                locales: window.app.getCurrrentLocale(),
                range: true,
                onRangeSelect: (range) => this.onRangeSelect(range),
                onHide: () => this.onDatePickerHide(),
            });
            this.datePickerWrapper.append(this.datePicker.elem);

            this.setDatePickerSelection();
        }

        this.datePicker.show(!this.datePicker.visible());
    }

    /**
     * Clear date range query
     */
    onDateClear() {
        if (!this.state.form.stdate && !this.state.form.enddate) {
            return;
        }

        const form = { stdate: null, enddate: null };
        this.setState({
            ...this.state,
            form,
            validation: { ...defaultValidation },
        });

        if (this.datePicker) {
            this.datePicker.hide();
        } else {
            this.notifyChanged(this.state.form);
        }
    }

    setDatePickerSelection(state = this.state) {
        if (!this.datePicker) {
            return;
        }

        const { stdate, enddate } = state.filter;
        const isDateFilter = !!(stdate && enddate);
        if (isDateFilter) {
            this.datePicker.setSelection(stdate, enddate);
        } else {
            this.datePicker.clearSelection();
        }
    }

    render(state) {
        this.startDateInput.value = state.form.stdate ?? '';
        this.endDateInput.value = state.form.enddate ?? '';
        const isDateFilter = !!(state.filter.stdate && state.filter.enddate);
        this.clearBtn.show(isDateFilter);

        window.app.setValidation(this.elem, state.validation.valid);

        this.setDatePickerSelection(state);
    }
}
