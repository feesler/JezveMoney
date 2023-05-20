import {
    createElement,
    addChilds,
    removeChilds,
    Component,
} from 'jezvejs';
import './Field.scss';

/** CSS classes */
const CONTAINER_CLASS = 'field';
const TITLE_CLASS = 'field__title';
const CONTENT_CLASS = 'field__content';

/**
 * Field component
 */
export class Field extends Component {
    static userProps = {
        elem: ['id'],
        titleElem: ['htmlFor'],
    };

    constructor(...args) {
        super(...args);

        this.state = { ...this.props };

        this.init();
    }

    init() {
        this.titleElem = createElement('label', { props: { className: TITLE_CLASS } });
        this.contentContainer = createElement('div', { props: { className: CONTENT_CLASS } });
        this.elem = createElement('div', {
            props: { className: CONTAINER_CLASS },
            children: [this.titleElem, this.contentContainer],
        });

        this.setClassNames();
        this.setUserProps();
        this.render(this.state);
    }

    setTitle(title) {
        if (this.state.title === title) {
            return;
        }

        this.setState({ ...this.state, title });
    }

    setContent(content) {
        if (this.state.content === content) {
            return;
        }

        this.setState({ ...this.state, content });
    }

    renderTitle(state, prevState) {
        if (state.title === prevState?.title) {
            return;
        }

        removeChilds(this.titleElem);

        if (!state.title) {
            return;
        }

        if (typeof state.title === 'string') {
            this.titleElem.textContent = state.title;
        } else {
            addChilds(this.titleElem, state.title);
        }
    }

    renderContent(state, prevState) {
        if (state.content === prevState?.content) {
            return;
        }

        removeChilds(this.contentContainer);

        if (!state.content) {
            return;
        }

        if (typeof state.content === 'string') {
            this.contentContainer.textContent = state.content;
        } else {
            addChilds(this.contentContainer, state.content);
        }
    }

    render(state, prevState = {}) {
        this.renderTitle(state, prevState);
        this.renderContent(state, prevState);
    }
}
