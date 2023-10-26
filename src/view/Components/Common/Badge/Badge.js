import { createElement } from '@jezvejs/dom';
import { Component } from 'jezvejs';
import './Badge.scss';

/* CSS classes */
const BADGE_CLASS = 'badge';

const defaultProps = {
    title: null,
};

/**
 * Badge component
 */
export class Badge extends Component {
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
        this.render(this.state);
    }

    init() {
        this.elem = createElement('span', { props: { className: BADGE_CLASS } });

        this.setClassNames();
        this.setUserProps();
    }

    setTitle(title) {
        this.setState({ ...this.state, title });
    }

    render(state) {
        this.elem.textContent = state?.title ?? '';
    }
}
