import { createElement, getClassName } from '@jezvejs/dom';
import { MenuGroupHeader } from 'jezvejs/Menu';

import './CollapsibleMenuGroupHeader.scss';

/* CSS classes */
const TITLE_CLASS = 'menu-group-header__title';

const defaultProps = {
    title: null,
    expanded: false,
};

/**
 * Collapsible menu group header component
 */
export class CollapsibleMenuGroupHeader extends MenuGroupHeader {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });
    }

    init() {
        this.titleElem = createElement('span', {
            props: { className: TITLE_CLASS },
        });

        this.elem = createElement('button', {
            props: {
                className: getClassName(MenuGroupHeader.className, 'menu-item'),
                type: 'button',
            },
            children: [
                this.titleElem,
            ],
        });
    }

    get id() {
        return this.state.id;
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.elem.dataset.id = state.id;

        this.titleElem.textContent = state.title ?? '';
    }
}
