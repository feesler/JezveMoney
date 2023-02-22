import {
    createElement,
    enable,
    isFunction,
    Component,
} from 'jezvejs';
import { DropDown } from 'jezvejs/DropDown';
import { MenuButton } from 'jezvejs/MenuButton';
import { PopupMenu } from 'jezvejs/PopupMenu';
import { __ } from '../../../../js/utils.js';
import { ToggleButton } from '../../../ToggleButton/ToggleButton.js';
import './style.scss';

/** CSS classes */
const SELECT_CLASS = 'template-select';
const CONTENT_CLASS = 'template-select__content';
const TITLE_CLASS = 'template-select__title';
const CONTROLS_CLASS = 'template-select__controls';
const UPDATE_BUTTON_CLASS = 'update-btn';
const DEL_BUTTON_CLASS = 'delete-btn';

const defaultProps = {
    disabled: false,
    showMenu: false,
    template: null,
    templates: null,
    onChange: null,
    onUpdate: null,
    onDelete: null,
};

/**
 * Import template select component
 * @param {Object} props
 */
export class TemplateSelect extends Component {
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

    /** Component initialization */
    init() {
        this.titleElem = createElement('div', { props: { className: TITLE_CLASS } });

        this.menuButton = MenuButton.create({
            onClick: (e) => this.onToggleMenu(e),
        });
        this.toggleExtBtn = ToggleButton.create();

        this.controls = window.app.createContainer(CONTROLS_CLASS, [
            this.menuButton.elem,
            this.toggleExtBtn.elem,
        ]);
        this.contentElem = window.app.createContainer(CONTENT_CLASS, [
            this.titleElem,
            this.controls,
        ]);
        this.elem = window.app.createContainer(SELECT_CLASS, [
            this.contentElem,
        ]);

        this.templateDropDown = DropDown.create({
            elem: this.contentElem,
            listAttach: true,
            enableFilter: true,
            noResultsMessage: __('NOT_FOUND'),
            onChange: (tpl) => this.onChange(tpl),
        });
    }

    createContextMenu() {
        if (this.contextMenu) {
            return;
        }

        this.contextMenu = PopupMenu.create({
            fixed: false,
            onClose: () => this.showMenu(false),
            items: [{
                icon: 'update',
                title: __('UPDATE'),
                className: UPDATE_BUTTON_CLASS,
                onClick: (e) => this.onUpdate(e),
            }, {
                icon: 'del',
                title: __('DELETE'),
                className: DEL_BUTTON_CLASS,
                onClick: (e) => this.onDelete(e),
            }],
        });
    }

    /**
     * Enables/disables component
     * @param {boolean} value - component enable flag. Default is true
     */
    enable(value = true) {
        this.setState({ ...this.state, disabled: !value });
    }

    /**
     * Shows/hides menu
     * @param {boolean} value - menu show flag. Default is true
     */
    showMenu(value = true) {
        this.setState({ ...this.state, showMenu: !!value });
    }

    /** Menu button 'click' event handler */
    onToggleMenu(e) {
        e.stopPropagation();
        this.templateDropDown.showList(false);

        if (this.state.disabled) {
            return;
        }

        this.showMenu(!this.state.showMenu);
    }

    /** DropDown 'change' event handler */
    onChange(template) {
        if (!isFunction(this.props.onChange)) {
            return;
        }

        this.props.onChange(template);
    }

    /** Update menu item 'click' event handler */
    onUpdate(e) {
        e.stopPropagation();
        this.showMenu(false);

        if (!isFunction(this.props.onUpdate)) {
            return;
        }
        this.props.onUpdate(this.state.template?.id);
    }

    /** Delete menu item 'click' event handler */
    onDelete(e) {
        e.stopPropagation();
        this.showMenu(false);

        if (!isFunction(this.props.onDelete)) {
            return;
        }

        this.props.onDelete(this.state.template?.id);
    }

    renderContextMenu(state) {
        if (!state.showMenu) {
            this.contextMenu?.detach();
            return;
        }
        if (!this.menuButton.elem) {
            this.contextMenu?.detach();
            return;
        }

        if (!this.contextMenu) {
            this.createContextMenu();
        }

        this.contextMenu.attachAndShow(this.menuButton.elem);
    }

    renderSelect(state, prevState) {
        if (
            state.template === prevState?.template
            && state.templates === prevState?.templates
        ) {
            return;
        }

        this.templateDropDown.removeAll();

        if (Array.isArray(state.templates)) {
            const templateItems = state.templates.map((item) => ({
                id: item.id,
                title: item.name,
            }));
            this.templateDropDown.append(templateItems);
        }

        if (state.template?.id) {
            this.templateDropDown.setSelection(state.template?.id);
        }
    }

    /** Render component state */
    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.renderSelect(state, prevState);
        this.renderContextMenu(state);

        this.titleElem.textContent = state.template?.name;

        this.templateDropDown.enable(!state.disabled);
        enable(this.elem, !state.disabled);
        enable(this.menuButton.button, !state.disabled);
        enable(this.toggleExtBtn.elem, !state.disabled);
    }
}
