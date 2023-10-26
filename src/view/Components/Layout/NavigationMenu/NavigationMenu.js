import { getClassName } from '@jezvejs/dom';
import { Menu } from 'jezvejs/Menu';

import { NavigationMenuListItem } from './components/ListItem/MenuItem.js';

import './NavigationMenu.scss';

/* CSS classes */
const MENU_CLASS = 'nav-list';

/**
 * Navigation menu component
 */
export class NavigationMenu extends Menu {
    constructor(props) {
        super({
            ...props,
            className: getClassName(MENU_CLASS, props.className),
            focusItemOnHover: false,
            preventNavigation: false,
            components: {
                ...props.components,
                ListItem: NavigationMenuListItem,
            },
        });
    }

    onFocus() {
    }

    onItemClick() {
    }

    setBadgeByURL(url, badge) {
        this.store.setState({
            ...this.state,
            items: this.state.items.map((item) => (
                (item.url === url)
                    ? { ...item, badge }
                    : item
            )),
        });
    }
}
