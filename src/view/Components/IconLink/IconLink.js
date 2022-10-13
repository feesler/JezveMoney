import {
    isFunction,
    createElement,
    addChilds,
    removeChilds,
    enable,
    Component,
} from 'jezvejs';
import './style.scss';

/* CSS classes */
const CONTAINER_CLASS = 'iconlink';
const ICON_CONTAINER_CLASS = 'iconlink__icon';
const ICON_CLASS = 'iconlink__icon-content';
const CONTENT_CLASS = 'iconlink__content';
const TITLE_CLASS = 'iconlink__title';
const SUBTITLE_CLASS = 'iconlink__subtitle';

const defaultProps = {
    type: 'button', // button or link
    enabled: true,
    url: null,
    title: null,
    subtitle: null,
    icon: null,
    onClick: null,
};

/**
 * IconLink component
 */
export class IconLink extends Component {
    static create(props) {
        const instance = new IconLink(props);
        instance.init();

        return instance;
    }

    static fromElement(props) {
        const instance = new IconLink(props);
        instance.parse();

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
        this.iconElem = createElement('span', {
            props: { className: ICON_CONTAINER_CLASS },
        });

        if (this.props.icon) {
            this.icon = window.app.createIcon(this.props.icon, ICON_CLASS);
            this.iconElem.append(this.icon);
        }

        this.contentElem = createElement('div', {
            props: { className: CONTENT_CLASS },
        });

        const isLink = (this.props.type === 'link');
        if (isLink) {
            this.elem = createElement('a', {
                props: { className: CONTAINER_CLASS },
                children: [this.iconElem, this.contentElem],
            });
        } else {
            this.elem = createElement('button', {
                props: { className: CONTAINER_CLASS, type: 'button' },
                children: [this.iconElem, this.contentElem],
            });
        }

        this.setClassNames();
        this.setHandlers();
        this.render(this.state);
    }

    parse() {
        if (!this.elem) {
            throw new Error('Invalid element specified');
        }

        this.state = {};

        if (this.elem.tagName === 'A') {
            this.state.url = this.elem.href;
        }

        this.iconElem = this.elem.querySelector(`.${ICON_CONTAINER_CLASS}`);
        this.contentElem = this.elem.querySelector(`.${CONTENT_CLASS}`);
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

        this.setClassNames();
        this.setHandlers();
    }

    setHandlers() {
        if (!isFunction(this.props.onClick)) {
            return;
        }

        this.elem.addEventListener('click', (e) => this.props.onClick(e));
    }

    /** Set title text */
    enable(value) {
        if (this.state.enabled === !!value) {
            return;
        }

        this.state.enabled = !!value;
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

        enable(this.elem, state.enabled);

        if (this.elem.tagName === 'A') {
            this.elem.href = state.url;
        }

        if (state.subtitle) {
            this.titleElem = createElement('span', {
                props: { className: SUBTITLE_CLASS, textContent: state.title },
            });
            this.subtitleElem = createElement('span', {
                props: { className: SUBTITLE_CLASS, textContent: state.subtitle },
            });
        } else {
            this.titleElem = createElement('span', { props: { textContent: state.title } });
            this.subtitleElem = null;
        }
        addChilds(this.contentElem, [this.titleElem, this.subtitleElem]);
    }
}
