import {
    createElement,
    Component,
    isFunction,
    asArray,
} from 'jezvejs';
import { CloseButton } from 'jezvejs/CloseButton';

import { __ } from '../../utils/utils.js';
import { App } from '../../Application/App.js';

import { Field } from '../Fields/Field/Field.js';
import { Heading } from '../Heading/Heading.js';

import './ItemDetails.scss';

/** CSS classes */
const CONTAINER_CLASS = 'list-item-details';
const CREATE_DATE_FIELD_CLASS = 'create-date-field';
const UPDATE_DATE_FIELD_CLASS = 'update-date-field';

const defaultProps = {
    item: null,
    onClose: null,
};

/**
 * List item details base component
 */
export class ItemDetails extends Component {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        this.state = {
            ...this.props,
        };

        this.init();
    }

    /** Component initialization */
    init() {
        this.closeBtn = CloseButton.create({
            onClick: () => this.onClose(),
        });

        this.heading = Heading.create({
            showInHeaderOnScroll: false,
            actions: [
                this.closeBtn.elem,
            ],
        });

        this.createDateField = Field.create({
            title: __('item.createDate'),
            className: CREATE_DATE_FIELD_CLASS,
        });

        this.updateDateField = Field.create({
            title: __('item.updateDate'),
            className: UPDATE_DATE_FIELD_CLASS,
        });

        const content = this.getContent();

        this.elem = createElement('div', {
            props: { className: CONTAINER_CLASS },
            children: [
                this.heading.elem,
                ...asArray(content),
                this.createDateField.elem,
                this.updateDateField.elem,
            ],
        });

        this.setClassNames();
        this.render(this.state);
    }

    onClose() {
        if (isFunction(this.props.onClose)) {
            this.state.onClose();
        }
    }

    setItem(item) {
        this.setState({ ...this.state, item });
    }

    renderDateField(field, time) {
        field?.setContent(App.formatDate(time));
    }
}
