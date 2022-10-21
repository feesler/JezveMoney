import {
    isDate,
    isFunction,
    setEvents,
    show,
    Component,
} from 'jezvejs';
import { DateInput } from 'jezvejs/DateInput';
import { DatePicker } from 'jezvejs/DatePicker';
import { fixDate } from '../../js/utils.js';

const defaultValidation = {
    stdate: true,
    enddate: true,
    order: true,
    valid: true,
};

const defaultProps = {
    start: null,
    end: null,
    onChange: null,
};

/**
 * Date range component
 */
export class DateRangeInput extends Component {
    static fromElement(elem, props) {
        const instance = new DateRangeInput(props);
        instance.parse(elem);
        return instance;
    }

    constructor(props) {
        super(props);

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        this.state = {
        };
    }

    setData(data) {
        const { stdate, enddate } = data;
        this.setState({
            form: { stdate, enddate },
            filter: { stdate, enddate },
            validation: { ...defaultValidation },
        });
    }

    parse(elem) {
        this.elem = elem;
        if (!this.elem) {
            throw new Error('Invalid element');
        }
        setEvents(this.elem, { submit: (e) => this.onSubmit(e) });

        this.startDateInput = DateInput.create({
            elem: elem.querySelector('input[name="stdate"]'),
            oninput: (e) => this.onStartDateInput(e),
        });

        this.endDateInput = DateInput.create({
            elem: elem.querySelector('input[name="enddate"]'),
            oninput: (e) => this.onEndDateInput(e),
        });

        this.clearBtn = elem.querySelector('.clear-btn');
        if (!this.clearBtn) {
            throw new Error('Clear button not found');
        }
        setEvents(this.clearBtn, { click: () => this.onDateClear() });

        this.dateInputBtn = elem.querySelector('.dp-btn');
        if (!this.dateInputBtn) {
            throw new Error('DatePicker button not found');
        }
        setEvents(this.dateInputBtn, { click: () => this.showCalendar() });

        this.datePickerWrapper = elem.querySelector('.calendar');

        this.setClassNames();
        this.setData(this.props);
    }

    notifyChanged(data) {
        if (isFunction(this.props.onChange)) {
            this.props.onChange(data);
        }
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
                locales: window.app.datePickerLocale,
                range: true,
                onrangeselect: (range) => this.onRangeSelect(range),
                onhide: () => this.onDatePickerHide(),
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
        show(this.clearBtn, isDateFilter);

        if (state.validation.valid) {
            window.app.clearBlockValidation(this.elem);
        } else {
            window.app.invalidateBlock(this.elem);
        }

        this.setDatePickerSelection(state);
    }
}
