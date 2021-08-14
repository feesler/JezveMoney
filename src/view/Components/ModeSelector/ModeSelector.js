import {
    isFunction,
    ce,
    addChilds,
    removeChilds,
    setEvents,
} from 'jezvejs';
import { Component } from 'jezvejs/Component';
import { createIcon } from '../../js/app.js';
import './style.css';

const defaultProps = {
    mode: 'classic',
    url: window.location,
};

const CONTAINER_CLASS = 'mode-selector';
const ITEM_CLASS = 'mode-selector__item';
const ACTIVE_ITEM_CLASS = 'mode-selector__item__active';
const availModes = ['classic', 'details'];

/**
 * Mode selector component
 */
export class ModeSelector extends Component {
    static create(props = {}) {
        const instance = new ModeSelector(props);
        instance.init();
        return instance;
    }

    static fromElement(elem, props = {}) {
        const instance = new ModeSelector(props);
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
        this.elem = ce('div', { className: CONTAINER_CLASS });
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

        const items = Array.from(elem.querySelectorAll(`.${ITEM_CLASS}`));
        items.forEach((item) => {
            if (!item.dataset.mode) {
                return;
            }
            const { mode } = item.dataset;
            if (item.classList.contains(ACTIVE_ITEM_CLASS)) {
                this.state.mode = mode;
            }
        });

        this.render(this.state);
    }

    setHandlers() {
        setEvents(this.elem, { click: (e) => this.onChangeMode(e) });
    }

    setClassNames() {
        if (!this.props.className) {
            return;
        }

        if (!Array.isArray(this.props.className)) {
            this.props.className = [this.props.className];
        }
        this.elem.classList.add(...this.props.className);
    }

    onChangeMode(e) {
        if (!isFunction(this.props.onChange)) {
            return;
        }

        e.preventDefault();

        const itemTarget = e.target.closest(`.${ITEM_CLASS}`);
        if (!itemTarget || !itemTarget.dataset.mode) {
            return;
        }

        const { mode } = itemTarget.dataset;

        this.props.onChange(mode);

        this.setMode(mode);
    }

    setMode(mode) {
        if (typeof mode !== 'string' || !availModes.includes(mode)) {
            throw new Error('Invalid mode');
        }

        if (this.state.mode === mode) {
            return;
        }

        this.state.mode = mode;
        this.render(this.state);
    }

    setURL(url) {
        this.state.url = url.toString();
        this.render(this.state);
    }

    renderItem(item) {
        const tagName = item.active ? 'b' : 'a';

        const elem = ce(tagName, { className: ITEM_CLASS }, [
            ce('span', { className: 'icon' }, createIcon(item.icon)),
            ce('span', { textContent: item.title }),
        ]);
        elem.setAttribute('data-mode', item.mode);
        if (item.active) {
            elem.classList.add(ACTIVE_ITEM_CLASS);
        } else {
            elem.href = item.url.toString();
        }

        return elem;
    }

    render(state) {
        const modeUrl = new URL(state.url);
        const elems = [];

        if (state.mode === 'details') {
            modeUrl.searchParams.delete('mode');

            elems.push(
                this.renderItem({
                    mode: 'classic',
                    icon: 'mode-list',
                    title: 'Classic',
                    url: modeUrl,
                }),
                this.renderItem({
                    mode: 'details',
                    active: true,
                    icon: 'mode-details',
                    title: 'Details',
                }),
            );
        } else {
            modeUrl.searchParams.set('mode', 'details');

            elems.push(
                this.renderItem({
                    mode: 'classic',
                    active: true,
                    icon: 'mode-list',
                    title: 'Classic',
                }),
                this.renderItem({
                    mode: 'details',
                    icon: 'mode-details',
                    title: 'Details',
                    url: modeUrl,
                }),
            );
        }

        removeChilds(this.elem);
        addChilds(this.elem, elems);
    }
}
