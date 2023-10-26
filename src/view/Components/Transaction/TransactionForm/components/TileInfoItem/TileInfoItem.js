import { isFunction } from '@jezvejs/types';
import { enable, createElement } from '@jezvejs/dom';
import { Component } from 'jezvejs';
import './TileInfoItem.scss';

const ITEM_CLASS = 'tile-info-item';
const BUTTON_CLASS = 'btn dashed-btn';

const defaultProps = {
    label: null,
    title: null,
    onClick: null,
};

/**
 * TileInfoItem component
 */
export class TileInfoItem extends Component {
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
        };

        this.init();
    }

    init() {
        this.labelElem = createElement('span');

        const buttonProps = {
            props: {
                className: BUTTON_CLASS,
                type: 'button',
            },
        };
        if (isFunction(this.props.onClick)) {
            buttonProps.events = { click: this.props.onClick };
        }

        this.buttonElem = createElement('button', buttonProps);

        this.elem = createElement('div', {
            props: { className: ITEM_CLASS },
            children: [this.labelElem, this.buttonElem],
        });

        this.setClassNames();
        this.setUserProps();
        this.render(this.state);
    }

    enable(value = true) {
        enable(this.buttonElem, !!value);
    }

    /**
     * Set label of component
     * @param {string|null} label - label to set
     */
    setLabel(label) {
        if (typeof label !== 'string') {
            throw new Error('Invalid label specified');
        }
        if (this.state.label === label) {
            return;
        }

        this.setState({ ...this.state, label });
    }

    /**
     * Set title of component
     * @param {string|null} title - title to set
     */
    setTitle(title) {
        if (typeof title !== 'string') {
            throw new Error('Invalid title specified');
        }
        if (this.state.title === title) {
            return;
        }

        this.setState({ ...this.state, title });
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.labelElem.textContent = state.label;
        this.buttonElem.textContent = state.title;
    }
}
