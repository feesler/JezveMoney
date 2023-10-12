import {
    asArray,
    Component,
    createElement,
    px,
} from 'jezvejs';

import { App } from '../../../Application/App.js';
import './Heading.scss';

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

        this.titleElem = this.elem.querySelector('h1,h2');
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

    setActions(actions) {
        this.setState({ ...this.state, actions });
    }

    showInHeader(inHeader) {
        this.setState({ ...this.state, inHeader });
    }

    onIntersectionChanged(isIntersecting) {
        if (!this.actionsContainer) {
            return;
        }

        const { header } = App.view;
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

            const rect = entry.boundingClientRect;
            if (
                rect
                && rect.left === 0
                && rect.right === 0
                && rect.top === 0
                && rect.bottom === 0
            ) {
                return;
            }

            this.onIntersectionChanged(entry.isIntersecting);
        }, options);

        observer.observe(this.elem);
    }

    renderHeaderTitle(state, prevState) {
        if (
            state.title === prevState?.title
            && state.inHeader === prevState?.inHeader
            && state.showInHeaderOnScroll === prevState?.showInHeaderOnScroll
        ) {
            return;
        }

        this.titleElem.textContent = (state.inHeader) ? null : state.title;

        if (!state.showInHeaderOnScroll) {
            return;
        }

        const headerTitle = (state.inHeader) ? state.title : null;
        App.view.header.setTitle(headerTitle);
    }

    renderActions(state, prevState) {
        if (state.actions === prevState?.actions) {
            return;
        }

        this.actionsContainer.textContent = '';
        this.actionsContainer.append(...asArray(state.actions));
    }

    renderContainer(state, prevState) {
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

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.renderHeaderTitle(state, prevState);
        this.renderActions(state, prevState);
        this.renderContainer(state, prevState);
    }
}
