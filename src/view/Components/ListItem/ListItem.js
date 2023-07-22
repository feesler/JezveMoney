import {
    createElement,
    show,
    Component,
    getClassName,
} from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import { MenuButton } from 'jezvejs/MenuButton';
import './ListItem.scss';

/** CSS classes */
const LIST_ITEM_CLASS = 'list-item';
const CONTENT_CLASS = 'list-item__content';
/* Select controls */
const SELECT_CONTROLS_CLASS = 'list-item__select';
/* Controls */
const CONTROLS_CLASS = 'list-item__controls';
/* Other */
const SELECTED_CLASS = 'list-item_selected';
const SORT_CLASS = 'list-item_sort';

const defaultProps = {
    item: null,
    selected: false,
    listMode: 'list',
    showControls: false,
    collapsible: false,
};

/**
 * Base list item component
 */
export class ListItem extends Component {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
            className: getClassName(LIST_ITEM_CLASS, props.className),
        });

        this.state = { ...this.props };

        this.selectControls = null;
        this.controlsElem = null;
        this.contentElem = null;

        this.init();
        this.postInit();
    }

    get id() {
        return this.state.item?.id;
    }

    init() {
        this.contentElem = createElement('div', { props: { className: CONTENT_CLASS } });
        this.elem = createElement('div', {
            children: this.contentElem,
        });
    }

    postInit() {
        this.setClassNames();
        this.render(this.state);
    }

    createSelectControls() {
        if (this.selectControls) {
            return;
        }

        this.checkbox = Checkbox.create();
        this.selectControls = createElement('div', {
            props: { className: SELECT_CONTROLS_CLASS },
            children: this.checkbox.elem,
        });

        this.contentElem.before(this.selectControls);
    }

    createControls() {
        if (this.controlsElem) {
            return;
        }

        this.menuButton = MenuButton.create();
        this.controlsElem = createElement('div', {
            props: { className: CONTROLS_CLASS },
            children: this.menuButton.elem,
        });

        this.contentElem.after(this.controlsElem);
    }

    renderSelectControls(state, prevState) {
        if (
            state.listMode === prevState.listMode
            && state.selected === prevState.selected
        ) {
            return;
        }

        const selectMode = state.listMode === 'select';
        const selected = selectMode && !!state.selected;

        this.createSelectControls();

        this.checkbox?.check(selected);
        if (this.checkbox) {
            this.checkbox.input.tabIndex = (selectMode) ? 0 : -1;
        }
        this.elem.classList.toggle(SELECTED_CLASS, selected);
    }

    renderControls(state, prevState) {
        if (state.showControls === prevState.showControls) {
            return;
        }

        if (state.showControls) {
            this.createControls();
        }

        show(this.controlsElem, state.showControls);
    }

    renderContent() {
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        const { item } = state;
        if (!item) {
            throw new Error('Invalid items');
        }

        this.elem.setAttribute('data-id', item.id);

        this.renderSelectControls(state, prevState);
        this.renderControls(state, prevState);
        this.renderContent(state, prevState);

        const sortMode = state.listMode === 'sort';
        this.elem.classList.toggle(SORT_CLASS, sortMode);
    }
}
