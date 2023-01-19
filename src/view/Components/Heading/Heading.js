import {
    asArray,
    Component,
    createElement,
    px,
} from 'jezvejs';
import './style.scss';

/** CSS classes */
const CONTAINER_CLASS = 'heading';
const ACTIONS_CLASS = 'heading-actions';

const defaultProps = {
    title: null,
    actions: null,
    showInHeaderOnScroll: true,
};

/**
 * Heading component
 */
export class Heading extends Component {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        this.state = {
            ...this.props,
            inHeader: false,
        };

        if (this.elem) {
            this.parse();
        } else {
            this.init();
        }
    }

    init() {
        this.titleElem = createElement('h1');
        this.actionsContainer = createElement('div', {
            props: { className: ACTIONS_CLASS },
        });

        if (this.props.actions) {
            this.actionsContainer.append(...asArray(this.props.actions));
        }

        this.elem = createElement('header', {
            props: { className: CONTAINER_CLASS },
            children: [
                this.titleElem,
                this.actionsContainer,
            ],
        });

        this.postInit();
    }

    parse() {
        if (!this.elem) {
            throw new Error('Invalid element specified');
        }

        this.titleElem = this.elem.querySelector('h1');
        this.actionsContainer = this.elem.querySelector(`.${ACTIONS_CLASS}`);

        this.postInit();
    }

    postInit() {
        if (this.props.showInHeaderOnScroll) {
            this.createObserver();
        }

        this.render(this.state);
    }

    setTitle(title) {
        this.setState({ ...this.state, title });
    }

    showInHeader(inHeader) {
        this.setState({ ...this.state, inHeader });
    }

    onIntersectionChanged(isIntersecting) {
        if (!this.actionsContainer) {
            return;
        }

        const { header } = window.app.view;
        if (isIntersecting) {
            header.showUserMenu(() => this.showInHeader(false));
        } else {
            this.showInHeader(true);
            header.showActions(this.actionsContainer);
        }
    }

    createObserver() {
        const options = {
            root: null,
            rootMargin: '-50px',
            threshold: 0,
        };
        const observer = new IntersectionObserver((entries) => {
            const [entry] = entries;
            if (entry.target !== this.elem) {
                return;
            }

            this.onIntersectionChanged(entry.isIntersecting);
        }, options);

        observer.observe(this.elem);
    }

    renderHeaderTitle(state) {
        if (!state.showInHeaderOnScroll) {
            return;
        }

        const headerTitle = (state.inHeader) ? state.title : null;
        window.app.view.header.setTitle(headerTitle);
    }

    render(state, prevState = {}) {
        this.titleElem.textContent = (state.inHeader) ? null : state.title;
        this.renderHeaderTitle(state);

        if (state.inHeader === prevState?.inHeader) {
            return;
        }

        if (state.inHeader) {
            this.elem.style.height = px(this.elem.offsetHeight);
        } else {
            if (this.actionsContainer) {
                this.elem.append(this.actionsContainer);
            }
            this.elem.style.height = '';
        }
    }
}
