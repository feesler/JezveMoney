import { isFunction } from '@jezvejs/types';
import { createElement, getClassNames } from '@jezvejs/dom';
import { WeekDaySelect } from 'jezvejs/WeekDaySelect';

import { __ } from '../../../../utils/utils.js';

import { Field } from '../../../Common/Field/Field.js';
import { FieldHeaderButton } from '../FieldHeaderButton/FieldHeaderButton.js';

import './WeekDaySelectField.scss';

/* CSS classes */
const FIELD_CLASS = 'week-day-field';

const defaultProps = {
    selectId: undefined,
    type: 'buttons',
    multiple: true,
    disabled: false,
    value: [],
    showWeekdaysButton: true,
    showWeekendsButton: true,
    onChange: null,
};

/**
 * Week day select field component
 */
export class WeekDaySelectField extends Field {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
            className: getClassNames(FIELD_CLASS, props.className),
        });
    }

    init() {
        this.fieldTitleElem = createElement('span', {
            props: { textContent: this.props.title },
        });

        this.state.title = [this.fieldTitleElem];

        if (this.props.showWeekdaysButton) {
            this.weekdaysBtn = FieldHeaderButton.create({
                dataValue: 'weekdays',
                title: __('dateRange.weekdays'),
                onClick: (e) => this.onSelectWeekdays(e),
            });

            this.state.title.push(this.weekdaysBtn.elem);
        }
        if (this.props.showWeekendsButton) {
            this.weekendBtn = FieldHeaderButton.create({
                dataValue: 'weekend',
                title: __('dateRange.weekend'),
                onClick: (e) => this.onSelectWeekend(e),
            });
            this.state.title.push(this.weekendBtn.elem);
        }

        this.select = WeekDaySelect.create({
            id: this.props.selectId,
            type: this.props.type,
            multiple: this.props.multiple,
            onChange: (value) => this.onChange(value),
        });

        this.state.content = [this.select.elem];

        super.init();
    }

    onChange(value) {
        this.setSelection(value);
        this.sendChangeEvent();
    }

    onSelectWeekdays(e) {
        e?.preventDefault();
        this.selectWeekdays();
        this.sendChangeEvent();
    }

    onSelectWeekend(e) {
        e?.preventDefault();
        this.selectWeekend();
        this.sendChangeEvent();
    }

    setSelection(value) {
        this.setState({ ...this.state, value });
    }

    selectWeekdays() {
        this.setSelection(['1', '2', '3', '4', '5']);
    }

    selectWeekend() {
        this.setSelection(['0', '6']);
    }

    sendChangeEvent() {
        if (isFunction(this.props.onChange)) {
            this.props.onChange(this.state.value);
        }
    }

    render(state, prevState = {}) {
        super.render(state, prevState);

        if (state.value !== prevState.value) {
            this.select.setSelection(state.value);
        }
        if (state.disabled !== prevState.disabled) {
            this.select.enable(!state.disabled);
        }
    }
}
