import { isFunction } from 'jezvejs';
import { Component } from 'jezvejs/Component';

/**
 * TileInfoItem component
 */
export class TileInfoItem extends Component {
    /**
     * Create new TileInfoItem from specified element
     */
    static fromElement(props) {
        let res;

        try {
            res = new TileInfoItem(props);
            res.parse();
        } catch {
            return null;
        }

        return res;
    }

    /**
     * Parse DOM to obtain child elements and build state of component
     */
    parse() {
        if (!(this.elem instanceof Element)) {
            throw new Error('Invalid element specified');
        }

        this.buttonElem = this.elem.querySelector('button');
        if (this.buttonElem && isFunction(this.props.onclick)) {
            this.buttonElem.addEventListener('click', this.props.onclick);
        }

        this.titleElem = this.buttonElem.querySelector('span');
        if (this.titleElem) {
            this.title = this.titleElem.textContent;
        }
    }

    /**
     * Set title of component
     * @param {string|null} title - title to set
     */
    setTitle(title) {
        if (typeof title !== 'string') {
            throw new Error('Invalid title specified');
        }

        if (this.title === title) {
            return;
        }

        this.title = title;
        this.titleElem.textContent = this.title;
    }
}
