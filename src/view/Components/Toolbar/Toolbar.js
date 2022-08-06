import { isFunction, Component } from 'jezvejs';
import { IconLink } from '../IconLink/IconLink.js';
import './style.scss';

const TOOLBAR_ACTIVE_CLASS = 'sidebar_active';

/**
 * Toolbar component
 */
export class Toolbar extends Component {
    constructor(...args) {
        super(...args);

        if (isFunction(this.props.onshow)) {
            this.onShowHandler = this.props.onshow;
        }
        if (isFunction(this.props.onhide)) {
            this.onHideHandler = this.props.onhide;
        }
        if (isFunction(this.props.ondelete)) {
            this.onDeleteHandler = this.props.ondelete;
        }
    }

    /**
     * Create new Toolbar from specified element
     */
    static create(props) {
        const res = new Toolbar(props);
        res.parse();

        return res;
    }

    /**
     * Parse DOM to obtain child elements and build state of component
     */
    parse() {
        if (!(this.elem instanceof Element)) {
            throw new Error('Invalid element specified');
        }

        this.elem.addEventListener('click', () => this.onClick());

        this.updateBtn = IconLink.fromElement({ elem: 'edit_btn' });
        this.exportBtn = IconLink.fromElement({ elem: 'export_btn' });
        this.showBtn = IconLink.fromElement({
            elem: 'show_btn',
            onclick: () => this.onShowClick(),
        });
        this.hideBtn = IconLink.fromElement({
            elem: 'hide_btn',
            onclick: () => this.onHideClick(),
        });
        this.deleteBtn = IconLink.fromElement({
            elem: 'del_btn',
            onclick: () => this.onDeleteClick(),
        });
    }

    show(value = true) {
        super.show(value);

        if (!value) {
            this.elem.classList.remove(TOOLBAR_ACTIVE_CLASS);
        }
    }

    /**
     * Toolbar 'click' event handler
     */
    onClick() {
        this.elem.classList.toggle(TOOLBAR_ACTIVE_CLASS);
    }

    /**
     * Show button 'click' event handler
     */
    onShowClick() {
        if (isFunction(this.onShowHandler)) {
            this.onShowHandler();
        }
    }

    /**
     * Hide button 'click' event handler
     */
    onHideClick() {
        if (isFunction(this.onHideHandler)) {
            this.onHideHandler();
        }
    }

    /**
     * Delete button 'click' event handler
     */
    onDeleteClick() {
        if (isFunction(this.onDeleteHandler)) {
            this.onDeleteHandler();
        }
    }
}
