import { createElement } from '@jezvejs/dom';
import { Component } from 'jezvejs';

/* CSS classes */
const MESSAGE_CLASS = 'nodata-message';

const defaultProps = {
    title: 'No data',
};

/**
 * No data message component for lists & etc.
 */
export class NoDataMessage extends Component {
    static userProps = {
        elem: ['id'],
    };

    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        this.state = { ...this.props };

        this.init();
        this.postInit();
        this.render(this.state);
    }

    init() {
        this.elem = createElement('div', {
            props: { className: MESSAGE_CLASS },
        });
    }

    postInit() {
        this.setClassNames();
        this.setUserProps();
    }

    setTitle(title) {
        if (this.state.title === title) {
            return;
        }

        this.setState({ ...this.state, title });
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.elem.textContent = state.title;
    }
}
