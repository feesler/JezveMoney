import { createElement, Component, isFunction } from 'jezvejs';
import { Icon } from 'jezvejs/Icon';
import './style.scss';

/* CSS classes */
const CLOSE_BUTTON_CLASS = 'btn close-btn';
const CLOSE_ICON_CLASS = 'icon close-icon';

const defaultProps = {
    onClick: null,
};

export class CloseButton extends Component {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        this.init();
    }

    init() {
        const icon = Icon.create({
            icon: 'close',
            className: CLOSE_ICON_CLASS,
        });

        const events = {};
        if (isFunction(this.props.onClick)) {
            events.click = (e) => this.props.onClick(e);
        }

        this.elem = createElement('button', {
            props: { className: CLOSE_BUTTON_CLASS, type: 'button' },
            children: icon.elem,
            events,
        });

        this.setClassNames();
    }
}
