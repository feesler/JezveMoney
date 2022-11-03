import {
    isFunction,
    createElement,
    removeChilds,
    enable,
    Component,
} from 'jezvejs';
import './style.scss';

/* CSS classes */
const CONTAINER_CLASS = 'iconbutton';
const ICON_CONTAINER_CLASS = 'iconbutton__icon';
const ICON_CLASS = 'iconbutton__icon-content';
const CONTENT_CLASS = 'iconbutton__content';
const TITLE_CLASS = 'iconbutton__title';
const SUBTITLE_CLASS = 'iconbutton__subtitle';

const defaultProps = {
    type: 'button', // button or link
    enabled: true,
    url: null,
    title: null,
    subtitle: null,
    icon: null,
    onClick: null,
    id: null,
};

/**
 * IconButton component
 */
export class IconButton extends Component {
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
    }

    init() {
        this.iconElem = createElement('span', {
            props: { className: ICON_CONTAINER_CLASS },
        });

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

        this.postInit();
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
            throw new Error('Invalid structure of iconbutton element');
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

        this.postInit();
    }

    postInit() {
        if (this.props.id) {
            this.elem.id = this.props.id;
        }

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

        this.setState({ ...this.state, enabled: !!value });
    }

    /** Set icon */
    setIcon(icon) {
        if (icon && typeof icon !== 'string') {
            throw new Error('Invalid icon specified');
        }

        if (this.state.icon === icon) {
            return;
        }

        this.setState({ ...this.state, icon });
    }

    /** Set title text */
    setTitle(title) {
        if (typeof title !== 'string') {
            throw new Error('Invalid title specified');
        }

        if (this.state.title === title) {
            return;
        }

        this.setState({ ...this.state, title });
    }

    /** Set subtitle text */
    setSubtitle(subtitle) {
        if (subtitle && typeof subtitle !== 'string') {
            throw new Error('Invalid subtitle specified');
        }

        if (this.state.subtitle === subtitle) {
            return;
        }

        this.setState({ ...this.state, subtitle });
    }

    /** Set URL for link element */
    setURL(url) {
        if (typeof url !== 'string') {
            throw new Error('Invalid URL specified');
        }

        if (this.state.url === url) {
            return;
        }

        this.setState({ ...this.state, url });
    }

    renderIcon(state) {
        removeChilds(this.iconElem);
        if (!state.icon) {
            return;
        }

        this.icon = window.app.createIcon(state.icon, ICON_CLASS);
        this.iconElem.append(this.icon);
    }

    /** Render component */
    render(state, prevState = {}) {
        removeChilds(this.contentElem);

        enable(this.elem, state.enabled);

        if (state.icon !== prevState.icon) {
            this.renderIcon(state);
        }

        if (this.elem.tagName === 'A') {
            this.elem.href = state.url;
        }

        this.titleElem = createElement('span', {
            props: {
                className: (state.subtitle) ? TITLE_CLASS : '',
                textContent: state.title,
            },
        });
        this.contentElem.append(this.titleElem);

        if (state.subtitle) {
            this.subtitleElem = createElement('span', {
                props: { className: SUBTITLE_CLASS, textContent: state.subtitle },
            });
            this.contentElem.append(this.subtitleElem);
        }
    }
}
