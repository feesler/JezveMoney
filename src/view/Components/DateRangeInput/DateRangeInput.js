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
import 'jezvejs/style/Input';
import { InputGroup } from 'jezvejs/InputGroup';
import {
    dateStringToTime,
    parseDate,
    __,
} from '../../utils/utils.js';
import './DateRangeInput.scss';

const CALENDAR_BUTTON_CLASS = 'btn input-group__inner-btn calendar-btn';
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

        this.state = {
            selectPart: null,
        };

        this.init();
    }

    init() {
        this.startDateInput = DateInput.create({
            className: 'input input-group__input date-range-part',
            name: 'stdate',
            locales: window.app.dateFormatLocale,
            placeholder: this.props.startPlaceholder,
            onInput: (e) => this.onStartDateInput(e),
        });

        this.startClearBtn = CloseButton.create({
            className: 'input-group__inner-btn clear-btn',
            onClick: () => this.onStartDateClear(),
        });

        this.startDateBtn = Button.create({
            icon: 'calendar-icon',
            className: CALENDAR_BUTTON_CLASS,
            onClick: () => this.showCalendar(true),
        });

        const startDateOuter = createElement('div', {
            props: { className: 'input-group__input-outer date-range-part' },
            children: [
                this.startDateInput.elem,
                this.startClearBtn.elem,
                this.startDateBtn.elem,
            ],
        });

        const textElem = createElement('div', {
            props: {
                className: 'input-group__text',
                textContent: '-',
            },
        });

        this.endDateInput = DateInput.create({
            className: 'input input-group__input',
            name: 'enddate',
            locales: window.app.dateFormatLocale,
            placeholder: this.props.endPlaceholder,
            onInput: (e) => this.onEndDateInput(e),
        });

        this.endClearBtn = CloseButton.create({
            className: 'input-group__inner-btn clear-btn',
            onClick: () => this.onEndDateClear(),
        });

        this.endDateBtn = Button.create({
            icon: 'calendar-icon',
            className: CALENDAR_BUTTON_CLASS,
            onClick: () => this.showCalendar(false),
        });

        const endDateOuter = createElement('div', {
            props: { className: 'input-group__input-outer date-range-part' },
            children: [
                this.endDateInput.elem,
                this.endClearBtn.elem,
                this.endDateBtn.elem,
            ],
        });

        this.inputGroup = InputGroup.create({
            children: [
                startDateOuter,
                textElem,
                endDateOuter,
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
        const stdate = (data.stdate)
            ? window.app.formatInputDate(data.stdate)
            : null;
        const enddate = (data.enddate)
            ? window.app.formatInputDate(data.enddate)
            : null;

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

    isDisabledDate(date, state) {
        const rangePart = state?.rangePart;
        if (rangePart !== 'start' && rangePart !== 'end') {
            return false;
        }

        const { filter } = this.state;

        const limitValue = (rangePart === 'start') ? filter.enddate : filter.stdate;
        const limitDate = parseDate(limitValue);
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

        const dateFmt = window.app.formatInputDate(date);
        const form = {
            ...this.state.form,
        };

        if (this.state.selectPart === 'start') {
            if (dateFmt === this.state.form.stdate) {
                return;
            }

            form.stdate = dateFmt;
        } else if (this.state.selectPart === 'end') {
            if (dateFmt === this.state.form.enddate) {
                return;
            }

            form.enddate = dateFmt;
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
        const startDate = parseDate(state.form.stdate);
        const endDate = parseDate(state.form.enddate);
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
    showCalendar(selectStartDateFilter) {
        if (!this.datePicker) {
            this.datePicker = DatePicker.create({
                relparent: this.datePickerWrapper.parentNode,
                locales: window.app.getCurrrentLocale(),
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
        if (!this.state.form.stdate) {
            return;
        }

        this.setState({
            ...this.state,
            form: {
                ...this.state.form,
                stdate: null,
            },
            validation: { ...defaultValidation },
        });

        if (this.datePicker) {
            this.datePicker.hide();
        } else {
            this.notifyChanged(this.state.form);
        }
    }

    /**
     * Clear end date of range
     */
    onEndDateClear() {
        if (!this.state.form.enddate) {
            return;
        }

        this.setState({
            ...this.state,
            form: {
                ...this.state.form,
                enddate: null,
            },
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

        let value = null;
        const { selectPart } = state;
        if (selectPart === 'start') {
            value = state.filter.stdate;
        } else if (selectPart === 'end') {
            value = state.filter.enddate;
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
        this.startDateInput.value = state.form.stdate ?? '';
        this.endDateInput.value = state.form.enddate ?? '';

        this.startClearBtn.show(!!state.form.stdate);
        this.endClearBtn.show(!!state.form.enddate);

        window.app.setValidation(this.elem, state.validation.valid);

        this.setDatePickerSelection(state);
        if (this.datePicker && state.selectPart !== prevState?.selectPart) {
            this.datePicker.setRangePart(state.selectPart);
        }
    }
}
