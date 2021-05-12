import {
    isObject,
    ce,
    svg,
} from '../../js/lib/common.js';
import { Component } from '../../js/lib/component.js';

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
        if (
            !(this.elem instanceof Element)
            || !this.elem.classList
            || !this.elem.classList.contains('tile')
        ) {
            throw new Error('Invalid element specified');
        }

        this.titleElem = this.elem.querySelector('.tile__title');
        if (this.titleElem) {
            this.title = this.titleElem.textContent;
        }

        this.subTitleElem = this.elem.querySelector('.tile__subtitle');
        if (this.subTitleElem) {
            this.subtitle = this.subTitleElem.textContent;
        }

        this.iconElem = this.elem.querySelector('.tile__icon');
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
            this.titleElem = ce('span', { className: 'tile__title' });
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
            this.subTitleElem = ce('span', { className: 'tile__subtitle' });
            this.elem.appendChild(this.subTitleElem);
        }

        this.subTitleElem.textContent = this.subtitle;
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
            this.iconElem = ce('span', { className: 'tile__icon' });
            this.elem.appendChild(this.iconElem);
        }

        if (!this.iconUseElem) {
            this.iconUseElem = svg('use');
            this.iconSVGElem = svg('svg', { width: '60px', height: '54px' }, this.iconUseElem);
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
