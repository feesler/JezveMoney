import { isFunction, Component } from 'jezvejs';

/**
 * TileInfoItem component
 */
export class TileInfoItem extends Component {
    static fromElement(props) {
        const res = new TileInfoItem(props);
        res.parse();
        return res;
    }

    /** Parse DOM to obtain child elements and build state of component */
    parse() {
        if (!(this.elem)) {
            throw new Error('Invalid element specified');
        }

        this.labelElem = this.elem.firstElementChild;

        this.buttonElem = this.elem.querySelector('button');
        if (this.buttonElem && isFunction(this.props.onclick)) {
            this.buttonElem.addEventListener('click', this.props.onclick);
        }
    }

    /**
     * Set label of component
     * @param {string|null} label - label to set
     */
    setLabel(label) {
        if (typeof label !== 'string') {
            throw new Error('Invalid label specified');
        }

        if (this.label === label) {
            return;
        }

        this.label = label;
        this.labelElem.textContent = this.label;
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
        this.buttonElem.textContent = this.title;
    }
}
