import {
    createElement,
    setEvents,
    re,
    removeEvents,
    getOffset,
    asArray,
    show,
    px,
    removeChilds,
    setEmptyClick,
    removeEmptyClick,
    Component,
} from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import { IconButton } from '../IconButton/IconButton.js';
import './style.scss';

/* CSS classes */
const MENU_CLASS = 'actions-menu';
const LIST_CLASS = 'actions-menu-list';
const BUTTON_CLASS = 'btn icon-btn actions-menu-btn';
const ICON_CLASS = 'icon actions-menu-btn__icon';
const SEPARATOR_CLASS = 'actions-menu-list__separator';
const ICONBTN_CLASS = 'action-iconbutton';
const CHECKBOX_CLASS = 'action-checkbox';

/* List position constants */
const LIST_MARGIN = 5;

const defaultProps = {
    icon: 'ellipsis',
    attached: false,
    attachTo: null,
    content: null,
    items: [],
    id: null,
};

export class PopupMenu extends Component {
    static activeInstance = null;

    static hideActive() {
        if (this.activeInstance) {
            this.activeInstance.hideMenu();
        }
    }

    constructor(props) {
        super(props);

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        this.emptyClickHandler = () => this.hideMenu();
        this.togglerEvents = { click: (e) => this.toggleMenu(e) };

        this.init();
    }

    init() {
        const { createContainer, createIcon } = window.app;

        this.menuList = createContainer(LIST_CLASS);
        show(this.menuList, false);

        if (this.props.items) {
            this.append(this.props.items);
        } else {
            this.setContent(this.props.content);
        }

        if (this.props.attached) {
            this.elem = this.menuList;
            if (this.props.attachTo) {
                this.attachTo(this.props.attachTo);
            }
        } else {
            this.menuBtn = createElement('button', {
                props: { className: BUTTON_CLASS, type: 'button' },
                children: createIcon(this.props.icon, ICON_CLASS),
                events: this.togglerEvents,
            });

            this.elem = createContainer(MENU_CLASS, [
                this.menuBtn,
                this.menuList,
            ]);
            this.relElem = this.elem;
        }

        if (this.props.id) {
            this.elem.id = this.props.id;
        }
        this.setClassNames();
    }

    detach() {
        if (this.hostElem) {
            removeEvents(this.hostElem, this.togglerEvents);
            this.hostElem = null;
        } else {
            removeEvents(this.menuBtn, this.togglerEvents);
        }

        re(this.elem);
    }

    attachTo(elem) {
        if (!(elem instanceof Element)) {
            throw new Error('Invalid element');
        }
        if (this.hostElem === elem) {
            return;
        }

        this.detach();

        this.hostElem = elem;
        this.relElem = this.hostElem;
        setEvents(this.hostElem, this.togglerEvents);

        this.hostElem.append(this.elem);
    }

    setContent(content) {
        removeChilds(this.menuList);
        if (!content) {
            return;
        }
        this.menuList.append(...asArray(content));
    }

    append(items) {
        if (!items) {
            return;
        }

        asArray(items).forEach((item) => this.addItem(item));
    }

    addItem(item) {
        if (!item) {
            return null;
        }

        const { type = 'icon', ...props } = item;
        if (type === 'icon') {
            return this.addIconItem(props);
        }
        if (type === 'checkbox') {
            return this.addCheckboxItem(props);
        }
        if (type === 'separator') {
            return this.addSeparator();
        }

        return null;
    }

    addIconItem(item) {
        if (!item) {
            return null;
        }

        const { className = [], ...rest } = item;
        const button = IconButton.create({
            className: [ICONBTN_CLASS, ...asArray(className)],
            ...rest,
        });
        this.menuList.append(button.elem);

        return button;
    }

    addCheckboxItem(item) {
        if (!item) {
            return null;
        }

        const { className = [], ...rest } = item;
        const button = Checkbox.create({
            className: [CHECKBOX_CLASS, ...asArray(className)],
            ...rest,
        });
        this.menuList.append(button.elem);

        return button;
    }

    addSeparator() {
        const separator = createElement('div', { props: { className: SEPARATOR_CLASS } });
        this.menuList.append(separator);
        return separator;
    }

    calculatePosition() {
        const html = document.documentElement;
        const screenBottom = html.scrollTop + html.clientHeight;

        const offset = getOffset(this.menuList.offsetParent);
        const container = getOffset(this.relElem);
        container.width = this.relElem.offsetWidth;
        container.height = this.relElem.offsetHeight;

        const margins = LIST_MARGIN * 2;
        const listWidth = this.menuList.offsetWidth;
        const listHeight = this.menuList.offsetHeight;
        const totalListHeight = container.height + listHeight + margins;
        const listBottom = container.top + totalListHeight;

        // Check vertical offset of menu list
        if (listBottom > html.scrollHeight) {
            this.menuList.style.top = px(container.top - offset.top - listHeight - LIST_MARGIN);
        } else {
            if (listBottom > screenBottom) {
                html.scrollTop += listBottom - screenBottom;
            }
            this.menuList.style.top = px(
                container.top - offset.top + container.height + LIST_MARGIN,
            );
        }

        const leftOffset = container.left - html.scrollLeft;
        // Check list overflows screen to the right
        // if rendered from the left of container
        if (leftOffset + listWidth > html.clientWidth) {
            const listLeft = container.left + container.width - listWidth - offset.left;
            this.menuList.style.left = px(listLeft);
        } else {
            this.menuList.style.left = px(container.left - offset.left);
        }
    }

    hideMenu() {
        show(this.menuList, false);
        this.menuList.style.top = '';
        this.menuList.style.left = '';
        this.menuList.style.width = '';

        PopupMenu.activeInstance = null;

        removeEmptyClick(this.emptyClickHandler);
    }

    toggleMenu() {
        if (this.menuList.hasAttribute('hidden')) {
            show(this.menuList, true);
            if (!this.menuList.offsetParent) {
                show(this.menuList, false);
                return;
            }

            this.calculatePosition();

            PopupMenu.activeInstance = this;

            setEmptyClick(this.emptyClickHandler);
        } else {
            this.hideMenu();
        }
    }
}
