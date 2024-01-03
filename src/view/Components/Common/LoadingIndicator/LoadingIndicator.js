import { createElement, show } from '@jezvejs/dom';
import { Component } from 'jezvejs';
import { Spinner } from 'jezvejs/Spinner';
import { __ } from '../../../utils/utils.js';
import './LoadingIndicator.scss';

/* CSS classes */
const CONTAINER_CLASS = 'loading-indicator';
const FIXED_CONTAINER_CLASS = 'loading-indicator_fixed';
const SPINNER_CLASS = 'loading-indicator__spinner';
const TITLE_CLASS = 'loading-indicator__title';

/**
 * Loading indicator component
 */
export class LoadingIndicator extends Component {
    static getDefaultProps() {
        return {
            title: __('loading'),
            visible: false,
            fixed: true,
            blockScroll: true,
        };
    }

    constructor(props = {}) {
        super({
            ...LoadingIndicator.getDefaultProps(),
            ...props,
        });

        this.state = {
            ...this.props,
        };

        this.init();
    }

    init() {
        this.spinner = Spinner.create({ className: SPINNER_CLASS });
        this.titleElem = createElement('div', { props: { className: TITLE_CLASS } });
        this.elem = createElement('div', {
            props: { className: CONTAINER_CLASS },
            children: [
                this.spinner.elem,
                this.titleElem,
            ],
        });
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

    render(state) {
        this.titleElem.textContent = state.title;
        show(this.elem, state.visible);

        if (state.fixed && state.blockScroll) {
            document.body.style.overflow = (state.visible) ? 'hidden' : '';
        }
    }
}
