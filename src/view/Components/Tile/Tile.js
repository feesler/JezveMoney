import {
    isObject,
    ce,
    svg,
    Component,
} from 'jezvejs';
import './style.scss';

/** CSS classes */
const TILE_CLASS = 'tile';
const WIDE_CLASS = 'tile--wide';
const TITLE_CLASS = 'tile__title';
const SUBTITLE_CLASS = 'tile__subtitle';
const ICON_CLASS = 'tile__icon';
const ICON_CONTENT_CLASS = 'tile__icon-content';

const SUBTITLE_LIMIT = 11;

/**
 * Tile component
 */
export class Tile extends Component {
    /**
     * Create new Tile from specified element
     */
    static fromElement(props) {
        const res = new Tile(props);
        res.parse();

        return res;
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
            this.title = this.titleElem.textContent;
        }

        this.subTitleElem = this.elem.querySelector(`.${SUBTITLE_CLASS}`);
        if (this.subTitleElem) {
            this.subtitle = this.subTitleElem.textContent;
        }

        this.iconElem = this.elem.querySelector(`.${ICON_CLASS}`);
        if (this.iconElem) {
            this.iconUseElem = this.iconElem.querySelector('use');
        }

        if (this.iconUseElem) {
            this.icon = this.iconUseElem.href.baseVal;
            if (this.icon.startsWith('#')) {
                this.icon = this.icon.substr(1);
            }
        }
    }

    /**
     * Set title of tile
     * @param {string|null} title - title to set, if null is set then title removed
     */
    setTitle(title) {
        if (title !== null && typeof title !== 'string') {
            throw new Error('Invalid title specified');
        }

        if (this.title === title) {
            return;
        }
        this.title = title;

        if (!this.titleElem) {
            this.titleElem = ce('span', { className: TITLE_CLASS });
            this.elem.appendChild(this.titleElem);
        }

        this.titleElem.textContent = this.title;
    }

    /**
     * Set subtitle of tile
     * @param {string|null} icon - subtitle to set, if null is set then subtitle removed
     */
    setSubTitle(subTitle) {
        if (subTitle !== null && typeof subTitle !== 'string') {
            throw new Error('Invalid subtitle specified');
        }

        if (this.subtitle === subTitle) {
            return;
        }
        this.subtitle = subTitle;

        if (!this.subTitleElem) {
            this.subTitleElem = ce('span', { className: SUBTITLE_CLASS });
            this.elem.appendChild(this.subTitleElem);
        }

        this.subTitleElem.textContent = this.subtitle;

        if (this.subtitle.length > SUBTITLE_LIMIT) {
            this.elem.classList.add(WIDE_CLASS);
        } else {
            this.elem.classList.remove(WIDE_CLASS);
        }
    }

    /**
     * Set icon of tile
     * @param {string|null} icon - icon to set, if null is set then icon removed
     */
    setIcon(icon) {
        if (icon !== null && typeof icon !== 'string') {
            throw new Error('Invalid icon specified');
        }

        if (this.icon === icon) {
            return;
        }
        this.icon = icon;

        if (!this.iconElem) {
            this.iconElem = ce('span', { className: ICON_CLASS });
            this.elem.appendChild(this.iconElem);
        }

        if (!this.iconUseElem) {
            this.iconUseElem = svg('use');
            this.iconSVGElem = svg('svg', { class: ICON_CONTENT_CLASS }, this.iconUseElem);
            this.iconElem.appendChild(this.iconSVGElem);
        }

        this.iconUseElem.href.baseVal = (this.icon) ? `#${this.icon}` : '';
    }

    /**
     * Render specified state
     * @param {object} state - tile state object
     */
    render(state) {
        if (!isObject(state)) {
            throw new Error('Invalid state specified');
        }

        this.setTitle(('title' in state) ? state.title : null);
        this.setSubTitle(('subtitle' in state) ? state.subtitle : null);
        this.setIcon(('icon' in state) ? state.icon : null);
    }
}
