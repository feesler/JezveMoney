import {
    isFunction,
    ce,
    addChilds,
    removeChilds,
} from 'jezvejs';
import { Component } from 'jezvejs/Component';
import './style.css';

const TITLE_CLASS = 'iconlink__title';
const SUBTITLE_CLASS = 'iconlink__subtitle';

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

        this.state = {};

        this.buttonElem = this.elem.querySelector('button,a');
        if (this.buttonElem && isFunction(this.props.onclick)) {
            this.buttonElem.addEventListener('click', this.props.onclick);
        }
        if (this.buttonElem.tagName === 'A') {
            this.state.url = this.buttonElem.href;
        }

        this.iconElem = this.buttonElem.querySelector('.iconlink__icon');
        this.contentElem = this.buttonElem.querySelector('.iconlink__content');
        if (!this.contentElem) {
            throw new Error('Invalid structure of iconlink element');
        }

        this.titleElem = this.contentElem.querySelector(`.${TITLE_CLASS}`);
        if (this.titleElem) {
            this.state.title = this.titleElem.textContent.trim();
        } else {
            this.state.title = this.contentElem.textContent.trim();
        }

        this.subtitleElem = this.contentElem.querySelector(`.${SUBTITLE_CLASS}`);
        if (this.subtitleElem) {
            this.state.subtitle = this.subtitleElem.textContent.trim();
        } else {
            this.state.subtitle = null;
        }

        const disabledAttr = this.elem.getAttribute('disabled');
        this.state.enabled = disabledAttr == null;
    }

    /** Set title text */
    enable(value) {
        const enable = !!value;
        if (this.state.enabled === enable) {
            return;
        }

        this.state.enabled = enable;
        this.render(this.state);
    }

    /** Set title text */
    setTitle(title) {
        if (typeof title !== 'string') {
            throw new Error('Invalid title specified');
        }

        if (this.state.title === title) {
            return;
        }

        this.state.title = title;
        this.render(this.state);
    }

    /** Set subtitle text */
    setSubtitle(subtitle) {
        if (subtitle && typeof subtitle !== 'string') {
            throw new Error('Invalid subtitle specified');
        }

        if (this.state.subtitle === subtitle) {
            return;
        }

        this.state.subtitle = subtitle;
        this.render(this.state);
    }

    /** Set URL for link element */
    setURL(url) {
        if (typeof url !== 'string') {
            throw new Error('Invalid URL specified');
        }

        if (this.state.url === url) {
            return;
        }

        this.state.url = url;
        this.render(this.state);
    }

    /** Render component */
    render(state) {
        removeChilds(this.contentElem);

        if (state.enabled) {
            this.elem.removeAttribute('disabled');
            this.buttonElem.removeAttribute('disabled');
        } else {
            this.elem.setAttribute('disabled', '');
            this.buttonElem.setAttribute('disabled', '');
        }

        if (this.buttonElem.tagName === 'A') {
            this.buttonElem.href = state.url;
        }

        if (state.subtitle) {
            this.titleElem = ce('span', { className: SUBTITLE_CLASS, textContent: state.title });
            this.subtitleElem = ce('span', {
                className: SUBTITLE_CLASS,
                textContent: state.subtitle,
            });
        } else {
            this.titleElem = ce('span', { textContent: state.title });
            this.subtitleElem = null;
        }
        addChilds(this.contentElem, [this.titleElem, this.subtitleElem]);
    }
}
