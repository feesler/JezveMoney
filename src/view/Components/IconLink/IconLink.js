import { isFunction, Component } from 'jezvejs';

/**
 * IconLink component
 */
export class IconLink extends Component {
    /**
     * Create new IconLink from specified element
     */
    static fromElement(props) {
        let res;

        try {
            res = new IconLink(props);
            res.parse();
        } catch (e) {
            res = null;
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

        this.buttonElem = this.elem.querySelector('button,a');
        if (this.buttonElem && isFunction(this.props.onclick)) {
            this.buttonElem.addEventListener('click', this.props.onclick);
        }
        if (this.buttonElem.tagName === 'A') {
            this.url = this.buttonElem.href;
        }

        this.iconElem = this.buttonElem.querySelector('.iconlink__icon');
        this.contentElem = this.buttonElem.querySelector('.iconlink__content');
        if (!this.contentElem) {
            throw new Error('Invalid structure of iconlink element');
        }

        this.titleElem = this.contentElem.querySelector('.iconlink__title');
        if (this.titleElem) {
            this.title = this.titleElem.textContent;
        } else {
            this.title = this.contentElem.textContent;
        }

        this.subtitleElem = this.contentElem.querySelector('.iconlink__subtitle');
        if (this.subtitleElem) {
            this.subtitle = this.subtitleElem.textContent;
        }
    }

    /** Set title text */
    enable(value) {
        if (value) {
            this.elem.removeAttribute('disabled');
            this.buttonElem.removeAttribute('disabled');
        } else {
            this.elem.setAttribute('disabled', '');
            this.buttonElem.setAttribute('disabled', '');
        }
    }

    /** Set title text */
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

    /** Set URL for link element */
    setURL(url) {
        if (typeof url !== 'string') {
            throw new Error('Invalid URL specified');
        }

        if (this.buttonElem.tagName !== 'A' || this.url === url) {
            return;
        }

        this.url = url;
        this.buttonElem.href = this.url;
    }
}
