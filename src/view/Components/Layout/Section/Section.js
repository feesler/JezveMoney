import { asArray } from '@jezvejs/types';
import { createElement } from '@jezvejs/dom';
import { Component } from 'jezvejs';

import { Heading } from '../Heading/Heading.js';

import './Section.scss';

/** CSS classes */
const CONTAINER_CLASS = 'settings-block';
const CONTENT_CLASS = 'settings-block__content';

const defaultProps = {
    title: null,
    actions: null,
    showInHeaderOnScroll: false,
    content: null,
};

/**
 * Section component
 */
export class Section extends Component {
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
        this.heading = Heading.create({
            title: this.props.title,
            actions: this.props.actions,
            showInHeaderOnScroll: this.props.showInHeaderOnScroll,
        });

        this.contentContainer = createElement('div', { props: { className: CONTENT_CLASS } });

        this.elem = createElement('section', {
            props: { className: CONTAINER_CLASS },
            children: [
                this.heading.elem,
                this.contentContainer,
            ],
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

    setActions(title) {
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

    renderHeading(state) {
        this.heading.setState((headingState) => ({
            ...headingState,
            title: state.title,
            actions: state.actions,
            showInHeaderOnScroll: state.showInHeaderOnScroll,
        }));
    }

    renderContent(state, prevState) {
        if (state.content === prevState?.content) {
            return;
        }

        this.contentContainer.replaceChildren(...asArray(state.content));
    }

    render(state, prevState = {}) {
        this.renderHeading(state, prevState);
        this.renderContent(state, prevState);
    }
}
