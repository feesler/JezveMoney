import { createElement, getClassName } from '@jezvejs/dom';
import { Button } from 'jezvejs/Button';
import { MenuItem } from 'jezvejs/Menu';

import { Badge } from '../../../../Common/Badge/Badge.js';
import { getApplicationURL } from '../../../../../utils/utils.js';

/* CSS classes */
const ITEM_CLASS = 'menu-item nav-item static-menu-item';
const CONTENT_CLASS = 'menu-item__content';
const ITEM_LINK_CLASS = 'nav-item__link';
const CREATE_BTN_CLASS = 'nav-item__icon-btn';

const defaultProps = {
    selected: false,
    active: false,
    hidden: false,
    disabled: false,
    multiple: false,
    group: null,
    badge: null,
    createButton: null,
};

export class NavigationMenuListItem extends MenuItem {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
            className: getClassName(ITEM_CLASS, props.className),
        });
    }

    createContainer(state) {
        const props = {
            className: ITEM_CLASS,
        };

        if (!state.tabThrough) {
            props.tabIndex = -1;
        }

        this.contentElem = createElement('div', {
            props: { className: CONTENT_CLASS },
        });

        const elem = createElement('div', {
            props,
            children: this.contentElem,
        });

        this.setElement(elem);

        this.beforeElem = null;
        this.afterElem = null;
        this.beforeContent = null;
        this.afterContent = null;

        this.postInit();
    }

    createContent() {
        if (!this.titleElem) {
            this.titleElem = createElement('a', {
                props: {
                    className: ITEM_LINK_CLASS,
                    href: '#',
                },
            });
        }

        this.contentElem.append(this.titleElem);
    }

    renderAfterContent(state) {
        if (state.badge) {
            const badge = Badge.create({
                title: state.badge,
            });
            return badge.elem;
        }

        if (!state.createButton) {
            return null;
        }
        const createBtn = Button.create({
            type: 'link',
            url: getApplicationURL(state.createButton),
            icon: 'plus-light',
            className: CREATE_BTN_CLASS,
        });

        return createBtn.elem;
    }

    renderContent(state) {
        this.createContent();

        const title = state.title ?? '';
        this.titleElem.title = title;
        this.titleElem.textContent = title;
        const url = getApplicationURL(this.getItemURL(state));
        this.titleElem.href = url.toString();
    }
}
