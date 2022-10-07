import {
    createElement,
    svg,
    setAttributes,
    Component,
} from 'jezvejs';
import './style.scss';

/** CSS classes */
export const TILE_CLASS = 'tile';
const WIDE_CLASS = 'tile_wide';
const SELECTED_CLASS = 'tile_selected';
const TITLE_CLASS = 'tile__title';
const SUBTITLE_CLASS = 'tile__subtitle';
const ICON_CLASS = 'tile__icon';
const ICON_CONTENT_CLASS = 'tile__icon-content';

const SUBTITLE_LIMIT = 11;

const defaultProps = {
    attrs: {},
    title: '',
    subtitle: null,
    icon: null,
    selected: false,
};

/**
 * Tile component
 */
export class Tile extends Component {
    static create(props) {
        const res = new Tile(props);
        res.init();

        return res;
    }

    static fromElement(props) {
        const res = new Tile(props);
        res.parse();

        return res;
    }

    constructor(...args) {
        super(...args);

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        this.state = {
            ...this.props,
        };
    }

    init() {
        this.elem = createElement('div', { props: { className: TILE_CLASS } });

        this.setClassNames();
        this.render(this.state);
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
                this.state.icon = this.icon.substr(1);
            }
        }

        this.setClassNames();
        this.render(this.state);
    }

    /**
     * Set title of tile
     * @param {string|null} title - title to set, if null is set then title removed
     */
    setTitle(title) {
        if (title !== null && typeof title !== 'string') {
            throw new Error('Invalid title specified');
        }
        if (this.state.title === title) {
            return;
        }

        this.setState({ ...this.state, title });
    }

    /**
     * Set subtitle of tile
     * @param {string|null} subtitle - subtitle to set, if null is set then subtitle removed
     */
    setSubTitle(subtitle) {
        if (subtitle !== null && typeof subtitle !== 'string') {
            throw new Error('Invalid subtitle specified');
        }
        if (this.state.subtitle === subtitle) {
            return;
        }

        this.setState({ ...this.state, subtitle });
    }

    /**
     * Set icon of tile
     * @param {string|null} icon - icon to set, if null is set then icon removed
     */
    setIcon(icon) {
        if (icon !== null && typeof icon !== 'string') {
            throw new Error('Invalid icon specified');
        }
        if (this.state.icon === icon) {
            return;
        }

        this.setState({ ...this.state, icon });
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
        this.subTitleElem.textContent = subtitle;

        if (subtitle.length > SUBTITLE_LIMIT) {
            this.elem.classList.add(WIDE_CLASS);
        } else {
            this.elem.classList.remove(WIDE_CLASS);
        }
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

        if (state.selected) {
            this.elem.classList.add(SELECTED_CLASS);
        } else {
            this.elem.classList.remove(SELECTED_CLASS);
        }
    }
}
