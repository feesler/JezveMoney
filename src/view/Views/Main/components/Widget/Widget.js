import {
    Component,
    asArray,
    createElement,
    getClassName,
} from 'jezvejs';
import { Icon } from 'jezvejs/Icon';

import { getApplicationURL } from '../../../../utils/utils.js';

import './Widget.scss';

/* CSS classes */
const WIDGET_CLASS = 'widget';
const HEADER_CLASS = 'widget_title';
const HEADER_LINK_CLASS = 'widget_title-link';
const GLYPH_CLASS = 'glyph';

const defaultProps = {
    header: null,
    headerLink: null,
    content: null,
};

/**
 * Base widget component
 */
export class Widget extends Component {
    static userProps = {
        elem: ['id'],
    };

    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
            className: getClassName(WIDGET_CLASS, props.className),
        });

        this.init();
        this.postInit();
    }

    init() {
        const children = [];

        if (typeof this.props.header === 'string') {
            const titleElem = createElement('span', {
                props: { textContent: this.props.header },
            });

            if (this.props.headerLink) {
                const glyphElem = createElement('div', {
                    props: { className: GLYPH_CLASS },
                    children: Icon.create({
                        icon: 'glyph',
                        className: 'glyph-icon',
                    }).elem,
                });

                this.headerContent = createElement('a', {
                    props: {
                        className: HEADER_LINK_CLASS,
                        href: getApplicationURL(this.props.headerLink),
                    },
                    children: [titleElem, glyphElem],
                });
            } else {
                this.headerContent = titleElem;
            }

            this.headerElem = createElement('header', {
                props: { className: HEADER_CLASS },
                children: this.headerContent,
            });

            children.push(this.headerElem);
        }

        children.push(...asArray(this.props.content));

        this.elem = createElement('section', {
            children,
        });
    }

    postInit() {
        this.setClassNames();
        this.setUserProps();
    }
}
