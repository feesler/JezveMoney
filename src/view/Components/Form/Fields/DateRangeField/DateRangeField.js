import { asArray } from '@jezvejs/types';
import { createElement } from '@jezvejs/dom';

import { dateStringToTime } from '../../../../utils/utils.js';

import { Field } from '../../../Common/Field/Field.js';
import { DateRangeInput } from '../../Inputs/Date/DateRangeInput/DateRangeInput.js';
import { FieldHeaderButton } from '../FieldHeaderButton/FieldHeaderButton.js';

import './DateRangeField.scss';

/* CSS classes */
const FIELD_CLASS = 'field date-range-field';
const HEADER_CLASS = 'field__title';
const HEADER_CONTROLS_CLASS = 'field__controls';

const defaultProps = {
    tagName: 'section',
    disabled: false,
    title: null,
    startDate: null,
    endDate: null,
    input: {},
    headerButtons: [],
    onChange: null,
};

/**
 * Date range field component
 */
export class DateRangeField extends Field {
    static userProps = {
        elem: ['id'],
    };

    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });
    }

    init() {
        this.titleElem = createElement('span');

        this.headerControls = createElement('div', {
            props: { className: HEADER_CONTROLS_CLASS },
        });

        this.header = createElement('header', {
            props: { className: HEADER_CLASS },
            children: [
                this.titleElem,
                this.headerControls,
            ],
        });

        this.input = DateRangeInput.create({
            ...this.props.input,
            onChange: this.props.onChange,
        });

        const { tagName } = this.props;
        if (typeof tagName !== 'string' || tagName.length === 0) {
            throw new Error('Invalid tagName property');
        }

        this.elem = createElement(tagName, {
            props: { className: FIELD_CLASS },
            children: [
                this.header,
                this.input.elem,
            ],
        });
    }

    renderHeaderButtons(state, prevState) {
        if (state.headerButtons === prevState.headerButtons) {
            return;
        }

        const buttons = asArray(state.headerButtons).map((item) => (
            FieldHeaderButton.create(item).elem
        ));

        this.headerControls.textContent = '';
        this.headerControls.append(...buttons);
    }

    renderTitle(state, prevState) {
        if (state.title === prevState?.title) {
            return;
        }

        this.titleElem.textContent = state.title;
    }

    renderContent(state, prevState) {
        if (
            state.disabled === prevState?.disabled
            && state.startDate === prevState?.startDate
            && state.endDate === prevState?.endDate
            && state.input === prevState?.input
        ) {
            return;
        }

        this.input.setState((inpState) => ({
            ...inpState,
            disabled: state.disabled,
            form: {
                ...inpState.form,
                startDate: state.startDate,
                endDate: state.endDate,
            },
            filter: {
                ...inpState.filter,
                startDate: dateStringToTime(state.startDate),
                endDate: dateStringToTime(state.endDate),
            },
            ...state.input,
        }));
    }

    render(state, prevState = {}) {
        super.render(state, prevState);

        this.renderHeaderButtons(state, prevState);
    }
}
