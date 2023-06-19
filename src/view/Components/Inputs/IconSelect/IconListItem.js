import {
    createElement,
    show,
    Component,
} from 'jezvejs';
import { Icon } from 'jezvejs/Icon';

/* CSS classes */
const LIST_ITEM_CLASS = 'dd__list-item dd__icon-list-item';
const ICON_CONTAINER_CLASS = 'dd__icon-list-item__icon';
const ICON_CLASS = 'icon';
const TITLE_CLASS = 'dd__icon-list-item__title';
const LIST_ITEM_ACTIVE_CLASS = 'dd__list-item_active';
const SELECTED_LIST_ITEM_CLASS = 'dd__list-item_selected';

const defaultProps = {
    selected: false,
    active: false,
    hidden: false,
    disabled: false,
    multi: false,
    group: null,
};

export class IconListItem extends Component {
    static get selector() {
        return 'li';
    }

    constructor(props = {}) {
        super(props);

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        if (typeof this.props.id === 'undefined' || this.props.id === null) {
            throw new Error('Invalid id');
        }

        this.state = { ...this.props };

        this.init();
        this.render(this.state);
    }

    get id() {
        return this.state.id;
    }

    init() {
        this.icon = Icon.create({
            icon: this.props.file,
            className: ICON_CLASS,
        });
        this.iconElem = createElement('span', {
            props: { className: ICON_CONTAINER_CLASS },
            children: [this.icon.elem],
        });

        this.titleElem = createElement('span', {
            props: { className: TITLE_CLASS },
        });

        this.contentElem = createElement('div', {
            props: { className: LIST_ITEM_CLASS },
            children: [this.iconElem, this.titleElem],
        });

        this.elem = createElement('li', {
            children: this.contentElem,
        });
    }

    render(state) {
        const noIcon = parseInt(state.id, 10) === 0;
        show(this.titleElem, noIcon);
        show(this.iconElem, !noIcon);
        if (noIcon) {
            this.titleElem.textContent = state.title;
        } else {
            this.icon.setIcon(state.file);
        }

        const selected = (this.props.multi && state.selected);
        this.contentElem.classList.toggle(SELECTED_LIST_ITEM_CLASS, selected);
        this.contentElem.classList.toggle(LIST_ITEM_ACTIVE_CLASS, state.active);

        this.enable(!state.disabled);
        this.show(!state.hidden);
    }
}
