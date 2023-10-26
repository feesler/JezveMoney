import {
    createElement,
    createSVGElement,
    removeChilds,
} from '@jezvejs/dom';
import { Component } from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import './Tile.scss';

/** CSS classes */
const TILE_CLASS = 'tile';
const WIDE_CLASS = 'tile_wide';
const SELECTED_CLASS = 'tile_selected';
const SORT_CLASS = 'tile_sort';
const TITLE_CLASS = 'tile__title';
const SUBTITLE_CLASS = 'tile__subtitle';
const ICON_CLASS = 'tile__icon';
const ICON_CONTENT_CLASS = 'tile__icon-content';
const CHECKBOX_CLASS = 'tile__checkbox';

const SUBTITLE_LIMIT = 13;

const defaultProps = {
    type: 'static', // 'static', 'button' or 'link'
    link: null,
    title: '',
    subtitle: null,
    icon: null,
    selected: false,
    listMode: 'list',
};

/**
 * Tile component
 */
export class Tile extends Component {
    static userProps = {
        elem: ['id'],
    };

    static get selector() {
        return `.${TILE_CLASS}`;
    }

    static get sortSelector() {
        return `.${TILE_CLASS}.${SORT_CLASS}`;
    }

    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        this.state = {
            ...this.props,
        };

        this.init();
    }

    get id() {
        return this.state.id;
    }

    getTagName(type) {
        const tagsMap = {
            link: 'a',
            button: 'button',
            static: 'div',
        };

        if (typeof tagsMap[type] !== 'string') {
            throw new Error('Invalid type');
        }

        return tagsMap[type];
    }

    init() {
        const { type } = this.props;
        const tagName = this.getTagName(type);
        const props = { className: TILE_CLASS };

        if (type === 'button') {
            props.type = type;
        } else if (type === 'link' && this.props.link) {
            props.href = this.props.link;
        }
        this.elem = createElement(tagName, { props });

        this.setClassNames();
        this.setUserProps();
        this.render(this.state);
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
        removeChilds(this.subTitleElem);
        if (Array.isArray(subtitle)) {
            const subTitleElems = subtitle.map((textContent) => (
                createElement('span', { props: { textContent } })
            ));

            this.subTitleElem.append(...subTitleElems);
        } else {
            this.subTitleElem.textContent = subtitle;
        }

        this.elem.classList.toggle(WIDE_CLASS, (subtitle.length > SUBTITLE_LIMIT));
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
            this.iconUseElem = createSVGElement('use');
            this.iconSVGElem = createSVGElement('svg', {
                attrs: { class: ICON_CONTENT_CLASS },
                children: this.iconUseElem,
            });
            this.iconElem.append(this.iconSVGElem);
        }

        this.iconUseElem.href.baseVal = (state.icon) ? `#${state.icon}` : '';
    }

    renderSelectControls(state, prevState) {
        if (
            state.listMode === prevState.listMode
            && state.selected === prevState.selected
        ) {
            return;
        }

        const selectMode = state.listMode === 'select';

        if (selectMode && !this.checkbox) {
            this.checkbox = Checkbox.create({
                className: CHECKBOX_CLASS,
            });
            this.checkbox.input.tabIndex = (state.type === 'static') ? 0 : -1;
            this.elem.append(this.checkbox.elem);
        }

        this.checkbox?.show(selectMode);

        const selected = selectMode && !!state.selected;
        this.elem.classList.toggle(SELECTED_CLASS, selected);
        this.checkbox?.check(selected);
    }

    /**
     * Render specified state
     * @param {object} state - tile state object
     */
    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state specified');
        }

        this.renderTitle(state, prevState);
        this.renderSubTitle(state, prevState);
        this.renderIcon(state, prevState);
        this.renderSelectControls(state, prevState);

        this.elem.classList.toggle(SORT_CLASS, state.listMode === 'sort');
    }
}
