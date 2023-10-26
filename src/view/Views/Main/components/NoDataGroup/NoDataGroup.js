import { Component } from 'jezvejs';
import { createElement } from '@jezvejs/dom';
import { __ } from '../../../../utils/utils.js';

/* CSS classes */
const GROUP_CLASS = 'nodata-group';
const MESSAGE_CLASS = 'nodata-message';

const defaultProps = {
    title: 'No data',
    url: null,
};

/**
 * No data message component for account and person lists
 */
export class NoDataGroup extends Component {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        this.state = { ...this.props };

        this.init();
        this.render(this.state);
    }

    init() {
        this.messageElem = createElement('span', {
            props: { className: MESSAGE_CLASS },
        });

        this.linkElem = createElement('a', {
            props: {
                className: 'btn link-btn',
                textContent: __('actions.create'),
            },
        });

        this.elem = createElement('div', {
            props: { className: GROUP_CLASS },
            children: [
                this.messageElem,
                this.linkElem,
            ],
        });
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.messageElem.textContent = state.title;
        this.linkElem.href = state.url?.toString() ?? '';
    }
}
