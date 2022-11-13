import {
    isFunction,
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
    computedStyle,
    Component,
} from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import { IconButton } from '../IconButton/IconButton.js';
import './style.scss';

/* CSS classes */
const MENU_CLASS = 'actions-menu';
const LIST_CLASS = 'actions-menu-list';
const FIXED_LIST_CLASS = 'actions-menu-list_fixed';
const BUTTON_CLASS = 'btn icon-btn actions-menu-btn';
const ICON_CLASS = 'icon actions-menu-btn__icon';
const SEPARATOR_CLASS = 'actions-menu-list__separator';
const ICONBTN_CLASS = 'action-iconbutton';
const CHECKBOX_CLASS = 'action-checkbox';

/* List position constants */
const SCREEN_PADDING = 5;
const LIST_MARGIN = 5;

const defaultProps = {
    icon: 'ellipsis',
    attached: false,
    attachTo: null,
    hideOnScroll: true,
    fixed: true,
    content: null,
    items: [],
    id: null,
    onClose: null,
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

        this.ignoreScroll = false;

        this.emptyClickHandler = () => this.hideMenu();
        this.scrollHandler = () => this.onScroll();
        this.togglerEvents = { click: (e) => this.toggleMenu(e) };

        this.init();
    }

    init() {
        const { createContainer, createIcon } = window.app;

        this.menuList = createContainer(LIST_CLASS);
        show(this.menuList, false);

        if (this.props.fixed) {
            this.menuList.classList.add(FIXED_LIST_CLASS);
        }

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

    setHandlers() {
        setEmptyClick(this.emptyClickHandler);

        if (this.props.hideOnScroll) {
            this.setScrollEvents();
            setTimeout(() => {
                this.ignoreScroll = false;
            }, 200);
        }
    }

    removeHandlers() {
        removeEmptyClick(this.emptyClickHandler);
        if (this.props.hideOnScroll) {
            this.removeScrollEvents();
        }
    }

    setScrollEvents() {
        window.addEventListener('scroll', this.scrollHandler, { passive: true, capture: true });
    }

    removeScrollEvents() {
        window.removeEventListener('scroll', this.scrollHandler, { passive: true, capture: true });
    }

    onScroll() {
        if (this.ignoreScroll) {
            return;
        }

        this.hideMenu();
    }

    isMenuVisible() {
        return !this.menuList.hasAttribute('hidden');
    }

    detach() {
        this.removeHandlers();
        if (this.hostElem) {
            removeEvents(this.hostElem, this.togglerEvents);
            this.hostElem = null;
            this.relElem = null;
        } else {
            removeEvents(this.menuBtn, this.togglerEvents);
        }

        show(this.menuList, false);
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

    attachAndShow(elem) {
        this.attachTo(elem);
        if (!this.isMenuVisible()) {
            this.showMenu();
        }
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

    /** Find parent element of list without offsetParent and check it has position: fixed */
    isInsideFixedContainer() {
        let elem = this.menuList;
        while (elem.offsetParent) {
            elem = elem.offsetParent;
        }

        const style = computedStyle(elem);
        return style.position === 'fixed';
    }

    calculatePosition() {
        const html = document.documentElement;
        const screenTop = html.scrollTop;
        const screenBottom = screenTop + html.clientHeight;
        const scrollAvailable = !this.isInsideFixedContainer();
        const scrollHeight = (scrollAvailable) ? html.scrollHeight : screenBottom;

        const offset = (this.menuList.offsetParent)
            ? getOffset(this.menuList.offsetParent)
            : { top: screenTop, left: html.scrollLeft };
        const container = getOffset(this.relElem);
        container.width = this.relElem.offsetWidth;
        container.height = this.relElem.offsetHeight;

        const margins = LIST_MARGIN * 2;
        const padding = SCREEN_PADDING * 2;
        const listWidth = this.menuList.offsetWidth;
        let listHeight = this.menuList.offsetHeight;
        const totalListHeight = container.height + listHeight + margins;
        const listBottom = container.top + totalListHeight;

        // Check vertical offset of menu list
        const listTop = container.top - listHeight - padding;
        const topSpace = container.top - screenTop;
        const bottomSpace = screenBottom - container.top + container.height;

        if (
            listBottom > scrollHeight
            && (
                scrollAvailable
                || (!scrollAvailable && topSpace > bottomSpace)
            )
        ) {
            const listOverflow = screenTop - listTop;
            if (listOverflow > 0) {
                if (scrollAvailable) {
                    html.scrollTop -= listOverflow;
                } else {
                    listHeight -= listOverflow;
                    this.menuList.style.height = px(listHeight);
                }
            }

            this.menuList.style.top = px(container.top - offset.top - listHeight - padding);
        } else {
            const listOverflow = listBottom + padding - screenBottom;
            if (listOverflow > 0) {
                if (scrollAvailable) {
                    html.scrollTop += listOverflow;
                } else {
                    listHeight -= listOverflow;
                    this.menuList.style.height = px(listHeight);
                }
            }
            this.menuList.style.top = px(
                container.top - offset.top + container.height,
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

    showMenu() {
        show(this.menuList, true);
        if (!this.props.fixed && !this.menuList.offsetParent) {
            show(this.menuList, false);
            return;
        }

        this.ignoreScroll = true;
        this.calculatePosition();

        if (PopupMenu.activeInstance !== this) {
            PopupMenu.hideActive();
            PopupMenu.activeInstance = this;
        }

        this.setHandlers();
    }

    hideMenu() {
        show(this.menuList, false);
        this.menuList.style.top = '';
        this.menuList.style.left = '';
        this.menuList.style.width = '';
        this.menuList.style.height = '';

        PopupMenu.activeInstance = null;
        this.removeHandlers();

        if (isFunction(this.props.onClose)) {
            this.props.onClose();
        }
    }

    toggleMenu(e) {
        e?.stopPropagation();

        if (this.isMenuVisible()) {
            this.hideMenu();
        } else {
            this.showMenu();
        }
    }
}
