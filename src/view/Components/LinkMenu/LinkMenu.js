import {
    isFunction,
    createElement,
    addChilds,
    removeChilds,
    setEvents,
    enable,
    Component,
} from 'jezvejs';
import './style.scss';

const CONTAINER_CLASS = 'link-menu';
const ITEM_CLASS = 'link-menu-item';
const ACTIVE_ITEM_CLASS = 'link-menu-item_active';
const ITEM_TITLE_CLASS = 'link-menu-item__title';
const ITEM_ICON_CONTAINER_CLASS = 'link-menu-item__icon';
const ITEM_ICON_CLASS = 'icon';

const defaultProps = {
    disabled: false,
    itemParam: 'value',
    url: window.location,
    items: [],
    onChange: null,
};

/**
 * Link Menu component
 */
export class LinkMenu extends Component {
    static create(props = {}) {
        const instance = new LinkMenu(props);
        instance.init();
        return instance;
    }

    static fromElement(elem, props = {}) {
        const instance = new LinkMenu(props);
        instance.parse(elem);
        return instance;
    }

    constructor(props) {
        super(props);

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        this.state = {
            ...this.props,
        };
    }

    init() {
        this.elem = createElement('div', { props: { className: CONTAINER_CLASS } });
        this.setHandlers();
        this.setClassNames();

        this.render(this.state);
    }

    parse(elem) {
        if (!elem || !elem.classList || !elem.classList.contains(CONTAINER_CLASS)) {
            throw new Error('Invalid element');
        }

        this.elem = elem;
        this.setHandlers();
        this.setClassNames();

        const itemElems = Array.from(elem.querySelectorAll(`.${ITEM_CLASS}`));
        this.state.items = itemElems.map((item) => this.parseItem(item));

        this.render(this.state);
    }

    parseItem(elem) {
        if (!elem) {
            return null;
        }

        let titleElem = elem.querySelector(`.${ITEM_TITLE_CLASS}`);
        if (!titleElem) {
            titleElem = elem;
        }

        const res = {
            title: titleElem.textContent.trim(),
            value: elem.dataset.value,
            active: elem.classList.contains(ACTIVE_ITEM_CLASS),
            icon: null,
        };

        const iconElem = elem.querySelector(`.${ITEM_ICON_CONTAINER_CLASS}`);
        const iconUseElem = iconElem?.querySelector('use');
        if (iconUseElem) {
            res.icon = iconUseElem.href.baseVal;
            if (res.icon.startsWith('#')) {
                res.icon = res.substring(1);
            }
        }

        return res;
    }

    setHandlers() {
        setEvents(this.elem, { click: (e) => this.onSelectItem(e) });
    }

    onSelectItem(e) {
        e.preventDefault();

        const itemTarget = e.target.closest(`.${ITEM_CLASS}`);
        if (!itemTarget?.dataset?.value) {
            return;
        }

        const { value } = itemTarget.dataset;
        this.setActive(value);

        if (isFunction(this.props.onChange)) {
            this.props.onChange(value);
        }
    }

    enable(value = true) {
        const disabled = !value;
        if (this.state.disabled === disabled) {
            return;
        }
        this.setState({ ...this.state, disabled });
    }

    setActive(value) {
        this.setState({
            ...this.state,
            items: this.state.items.map((item) => ({
                ...item,
                active: item.value === value,
            })),
        });
    }

    setURL(value) {
        const url = value.toString();
        if (this.state.url === url) {
            return;
        }

        this.setState({ ...this.state, url });
    }

    getItemURL(item, state) {
        if (!state.url) {
            return null;
        }

        const { itemParam } = state;
        const url = new URL(state.url);
        if (item.value) {
            url.searchParams.set(itemParam, item.value);
        } else {
            url.searchParams.delete(itemParam);
        }

        return url;
    }

    renderItem(item, state) {
        const tagName = (item.active) ? 'b' : 'a';

        const children = [];

        if (item.icon) {
            const iconElem = createElement('span', {
                props: { className: ITEM_ICON_CONTAINER_CLASS },
                children: window.app.createIcon(item.icon, ITEM_ICON_CLASS),
            });

            children.push(iconElem);
        }

        const titleElem = createElement('span', {
            props: { className: ITEM_TITLE_CLASS, textContent: item.title },
        });
        children.push(titleElem);

        const elem = createElement(tagName, {
            props: { className: ITEM_CLASS },
            attrs: { 'data-value': item.value },
            children,
        });

        if (item.active) {
            elem.classList.add(ACTIVE_ITEM_CLASS);
        } else {
            const url = this.getItemURL(item, state);
            elem.href = url.toString();
        }

        return elem;
    }

    render(state) {
        const elems = state.items.map((item) => this.renderItem(item, state));
        removeChilds(this.elem);
        addChilds(this.elem, elems);

        enable(this.elem, !state.disabled);
    }
}
