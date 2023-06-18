import {
    Component,
    removeChilds,
    createElement,
    addChilds,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';

import { __ } from '../../utils/utils.js';
import { App } from '../../Application/App.js';

/* CSS classes */
const MENU_CLASS = 'nav-list';
const ITEM_CLASS = 'nav-item';
const ITEM_LINK_CLASS = 'nav-item__link';
const CREATE_BTN_CLASS = 'nav-item__icon-btn';
const SEPARATOR_CLASS = 'nav-separator';

const menuItems = [
    { url: 'accounts/', titleToken: 'accounts.listTitle', createButton: 'accounts/create/' },
    { url: 'persons/', titleToken: 'persons.listTitle', createButton: 'persons/create/' },
    { url: 'categories/', titleToken: 'categories.listTitle', createButton: 'categories/create/' },
    { url: 'transactions/', titleToken: 'transactions.listTitle', createButton: 'transactions/create/' },
    { url: 'schedule/', titleToken: 'schedule.listTitle', createButton: 'schedule/create/' },
    { url: 'reminders/', titleToken: 'reminders.listTitle' },
    { url: 'statistics/', titleToken: 'statistics.title' },
    { url: 'import/', titleToken: 'import.listTitle' },
    { type: 'separator' },
    { url: 'about/', titleToken: 'about.title', loggedOut: true },
];

/**
 * Navigation menu component
 */
export class NavigationMenu extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ...this.props,
            items: menuItems,
        };

        this.init();
        this.render(this.state);
    }

    init() {
        this.elem = createElement('ul', { props: { className: MENU_CLASS } });
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

        const { baseURL } = App;

        const linkElem = createElement('a', {
            props: {
                className: ITEM_LINK_CLASS,
                href: `${baseURL}${item.url}`,
                textContent: __(item.titleToken),
            },
        });
        const children = [linkElem];

        if (item.createButton) {
            const createBtn = Button.create({
                type: 'link',
                url: `${baseURL}${item.createButton}`,
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
