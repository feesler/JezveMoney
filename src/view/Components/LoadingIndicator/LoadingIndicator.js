import {
    ce,
    show,
    Component,
    Spinner,
} from 'jezvejs';
import './style.css';

const defaultProps = {
    title: 'Loading...',
    visible: false,
    fixed: true,
    blockScroll: true,
};

const CONTAINER_CLASS = 'loading-indicator';
const FIXED_CONTAINER_CLASS = 'loading-indicator_fixed';
const SPINNER_CLASS = 'loading-indicator__spinner';
const TITLE_CLASS = 'loading-indicator__title';

/**
 * Loading indicator component
 */
export class LoadingIndicator extends Component {
    static create(props = {}) {
        const instance = new LoadingIndicator(props);
        instance.init();
        return instance;
    }

    constructor(props) {
        super(props);

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        this.state = {
            ...this.props,
        };
    }

    init() {
        this.spinner = Spinner.create({ className: SPINNER_CLASS });
        this.titleElem = ce('div', { className: TITLE_CLASS });
        this.elem = ce('div', { className: CONTAINER_CLASS }, [
            this.spinner.elem,
            this.titleElem,
        ]);
        if (this.props.fixed) {
            this.elem.classList.add(FIXED_CONTAINER_CLASS);
        }

        this.setClassNames();

        this.render(this.state);
    }

    show(visible = true) {
        this.setState({ ...this.state, visible });
    }

    hide() {
        this.show(false);
    }

    setTitle(title) {
        this.setState({ ...this.state, title });
    }

    setState(state) {
        if (this.state === state) {
            return;
        }

        this.render(state, this.state);
        this.state = state;
    }

    render(state) {
        this.titleElem.textContent = state.title;
        show(this.elem, state.visible);

        if (state.fixed && state.blockScroll) {
            document.body.style.overflow = (state.visible) ? 'hidden' : '';
        }
    }
}
