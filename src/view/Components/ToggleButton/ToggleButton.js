import { createElement, Component, isFunction } from 'jezvejs';
import { Icon } from 'jezvejs/Icon';
import './style.scss';

/* CSS classes */
const TOGGLE_BUTTON_CLASS = 'btn icon-btn toggle-btn';
const TOGGLE_ICON_CLASS = 'icon toggle-icon';

const defaultProps = {
    onClick: null,
};

export class ToggleButton extends Component {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        this.init();
    }

    init() {
        const icon = Icon.create({
            icon: 'toggle-ext',
            className: TOGGLE_ICON_CLASS,
        });

        const events = {};
        if (isFunction(this.props.onClick)) {
            events.click = (e) => this.props.onClick(e);
        }

        this.elem = createElement('button', {
            props: { className: TOGGLE_BUTTON_CLASS, type: 'button' },
            children: icon.elem,
            events,
        });

        this.setClassNames();
    }
}
