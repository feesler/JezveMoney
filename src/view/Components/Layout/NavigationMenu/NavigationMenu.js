import {
    Component,
    removeChilds,
    createElement,
    addChilds,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';

import { __, getApplicationURL } from '../../../utils/utils.js';
import { App } from '../../../Application/App.js';

import { Badge } from '../../Common/Badge/Badge.js';

import './NavigationMenu.scss';

/* CSS classes */
const MENU_CLASS = 'nav-list';
const ITEM_CLASS = 'nav-item';
const ITEM_LINK_CLASS = 'nav-item__link';
const CREATE_BTN_CLASS = 'nav-item__icon-btn';
const SEPARATOR_CLASS = 'nav-separator';

/**
 * Navigation menu component
 */
export class NavigationMenu extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ...this.props,
        };

        this.init();
        this.render(this.state);
    }

    init() {
        this.elem = createElement('ul', { props: { className: MENU_CLASS } });
    }

    setBadgeByURL(url, badge) {
        this.setState({
            ...this.state,
            items: this.state.items.map((item) => (
                (item.url === url)
                    ? { ...item, badge }
                    : item
            )),
        });
    }

    renderSeparator() {
        return createElement('li', { props: { className: SEPARATOR_CLASS } });
    }

    renderMenuItem(item) {
        if (!item.loggedOut && !App.isUserLoggedIn()) {
            return null;
        }

        if (item.type === 'separator') {
            return this.renderSeparator();
        }

        const content = (item.content) ?? createElement('a', {
            props: {
                className: ITEM_LINK_CLASS,
                href: getApplicationURL(item.url),
                textContent: (
                    (item.titleToken)
                        ? __(item.titleToken)
                        : item.title
                ),
            },
        });
        const children = [content];

        if (item.badge) {
            const badge = Badge.create({
                title: item.badge,
            });
            children.push(badge.elem);
        }

        if (item.createButton) {
            const createBtn = Button.create({
                type: 'link',
                url: getApplicationURL(item.createButton),
                icon: 'plus-light',
                className: CREATE_BTN_CLASS,
            });
            children.push(createBtn.elem);
        }

        return createElement('li', {
            props: { className: ITEM_CLASS },
            children,
        });
    }

    render(state) {
        if (!state) {
            throw new Error('invalid state');
        }

        const elems = state.items.map((item) => this.renderMenuItem(item));
        removeChilds(this.elem);
        addChilds(this.elem, elems);
    }
}
