import { asArray } from '@jezvejs/types';
import { createElement } from '@jezvejs/dom';
import { Component } from 'jezvejs';
import './Field.scss';

/** CSS classes */
const CONTAINER_CLASS = 'field';
const TITLE_CLASS = 'field__title';
const CONTENT_CLASS = 'field__content';

const defaultProps = {
    title: null,
    content: null,
    tagName: 'div',
};

/**
 * Field component
 */
export class Field extends Component {
    static userProps = {
        elem: ['id'],
        titleElem: ['htmlFor'],
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
        this.titleElem = createElement('label', { props: { className: TITLE_CLASS } });
        this.contentContainer = createElement('div', { props: { className: CONTENT_CLASS } });

        const { tagName } = this.props;
        if (typeof tagName !== 'string' || tagName.length === 0) {
            throw new Error('Invalid tagName property');
        }

        this.elem = createElement(tagName, {
            props: { className: CONTAINER_CLASS },
            children: [this.titleElem, this.contentContainer],
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

        this.titleElem.replaceChildren(...asArray(state.title));
    }

    renderContent(state, prevState) {
        if (state.content === prevState?.content) {
            return;
        }

        this.contentContainer.replaceChildren(...asArray(state.content));
    }

    render(state, prevState = {}) {
        this.renderTitle(state, prevState);
        this.renderContent(state, prevState);
    }
}
