import {
    createElement,
    svg,
    setAttributes,
    Component,
    removeChilds,
} from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import './style.scss';

/** CSS classes */
export const TILE_CLASS = 'tile';
const WIDE_CLASS = 'tile_wide';
const SELECTED_CLASS = 'tile_selected';
const SORT_CLASS = 'tile_sort';
const TITLE_CLASS = 'tile__title';
const SUBTITLE_CLASS = 'tile__subtitle';
const ICON_CLASS = 'tile__icon';
const ICON_CONTENT_CLASS = 'tile__icon-content';
const CHECKBOX_CLASS = 'tile__checkbox';

const SUBTITLE_LIMIT = 13;

const defaultProps = {
    attrs: {},
    type: 'static', // 'static', 'button' or 'link'
    link: null,
    title: '',
    subtitle: null,
    icon: null,
    selected: false,
    listMode: 'list',
};

/**
 * Tile component
 */
export class Tile extends Component {
    constructor(props) {
        super(props);

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        this.state = {
            ...this.props,
        };

        if (this.elem) {
            this.parse();
        } else {
            this.init();
        }

        this.setClassNames();
        this.render(this.state);
    }

    get id() {
        return this.state.id;
    }

    init() {
        if (this.props.type === 'static') {
            this.elem = createElement('div', { props: { className: TILE_CLASS } });
        }
        if (this.props.type === 'link') {
            this.elem = createElement('a', { props: { className: TILE_CLASS } });
            if (this.props.link) {
                this.elem.href = this.props.link;
            }
        }
        if (this.props.type === 'button') {
            this.elem = createElement('button', {
                props: { className: TILE_CLASS, type: 'button' },
            });
        }
    }

    /**
     * Parse DOM to obtain child elements and build state of component
     */
    parse() {
        if (!this.elem?.classList?.contains(TILE_CLASS)) {
            throw new Error('Invalid element specified');
        }

        this.titleElem = this.elem.querySelector(`.${TITLE_CLASS}`);
        if (this.titleElem) {
            this.state.title = this.titleElem.textContent;
        }

        this.subTitleElem = this.elem.querySelector(`.${SUBTITLE_CLASS}`);
        if (this.subTitleElem) {
            this.state.subtitle = this.subTitleElem.textContent;
        }

        this.iconElem = this.elem.querySelector(`.${ICON_CLASS}`);
        if (this.iconElem) {
            this.iconUseElem = this.iconElem.querySelector('use');
        }

        if (this.iconUseElem) {
            this.icon = this.iconUseElem.href.baseVal;
            if (this.icon.startsWith('#')) {
                this.state.icon = this.icon.substring(1);
            }
        }
    }

    renderAttributes(state, prevState) {
        if (state.attrs === prevState.attrs) {
            return;
        }

        const prevAttrs = prevState.attrs ?? {};
        const attrs = state.attrs ?? {};
        for (const name in prevAttrs) {
            if (!(name in attrs)) {
                this.elem.removeAttribute(name);
            }
        }
        setAttributes(this.elem, attrs);
    }

    renderTitle(state, prevState) {
        if (state.title === prevState.title) {
            return;
        }

        if (!this.titleElem) {
            this.titleElem = createElement('span', { props: { className: TITLE_CLASS } });
            this.elem.append(this.titleElem);
        }

        this.titleElem.textContent = state.title;
    }

    renderSubTitle(state, prevState) {
        if (state.subtitle === prevState.subtitle) {
            return;
        }

        if (!this.subTitleElem) {
            this.subTitleElem = createElement('span', { props: { className: SUBTITLE_CLASS } });
            this.elem.append(this.subTitleElem);
        }

        const subtitle = state.subtitle ?? '';
        removeChilds(this.subTitleElem);
        if (Array.isArray(subtitle)) {
            const subTitleElems = subtitle.map((textContent) => (
                createElement('span', { props: { textContent } })
            ));

            this.subTitleElem.append(...subTitleElems);
        } else {
            this.subTitleElem.textContent = subtitle;
        }

        this.elem.classList.toggle(WIDE_CLASS, (subtitle.length > SUBTITLE_LIMIT));
    }

    renderIcon(state, prevState = {}) {
        if (state.icon === prevState.icon) {
            return;
        }

        if (!this.iconElem) {
            this.iconElem = createElement('span', { props: { className: ICON_CLASS } });
            this.elem.append(this.iconElem);
        }

        if (!this.iconUseElem) {
            this.iconUseElem = svg('use');
            this.iconSVGElem = svg('svg', { class: ICON_CONTENT_CLASS }, this.iconUseElem);
            this.iconElem.append(this.iconSVGElem);
        }

        this.iconUseElem.href.baseVal = (state.icon) ? `#${state.icon}` : '';
    }

    renderSelectControls(state, prevState) {
        if (
            state.listMode === prevState.listMode
            && state.selected === prevState.selected
        ) {
            return;
        }

        const selectMode = state.listMode === 'select';

        if (selectMode && !this.checkbox) {
            this.checkbox = Checkbox.create({
                className: CHECKBOX_CLASS,
            });
            this.checkbox.input.tabIndex = (state.type === 'static') ? 0 : -1;
            this.elem.append(this.checkbox.elem);
        }

        this.checkbox?.show(selectMode);

        const selected = selectMode && !!state.selected;
        this.elem.classList.toggle(SELECTED_CLASS, selected);
        this.checkbox?.check(selected);
    }

    /**
     * Render specified state
     * @param {object} state - tile state object
     */
    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state specified');
        }

        this.renderAttributes(state, prevState);
        this.renderTitle(state, prevState);
        this.renderSubTitle(state, prevState);
        this.renderIcon(state, prevState);
        this.renderSelectControls(state, prevState);

        this.elem.classList.toggle(SORT_CLASS, state.listMode === 'sort');
    }
}
