import {
    ge,
    isFunction,
    Component,
    setEvents,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import './style.scss';

const TOOLBAR_ACTIVE_CLASS = 'sidebar_active';

/**
 * Toolbar component
 */
export class Toolbar extends Component {
    constructor(...args) {
        super(...args);

        if (isFunction(this.props.onShow)) {
            this.onShowHandler = this.props.onShow;
        }
        if (isFunction(this.props.onHide)) {
            this.onHideHandler = this.props.onHide;
        }
        if (isFunction(this.props.onDelete)) {
            this.onDeleteHandler = this.props.onDelete;
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

        setEvents(this.elem, { click: () => this.onClick() });

        const editBtn = ge('edit_btn');
        if (editBtn) {
            this.updateBtn = Button.fromElement(editBtn);
        }

        const exportBtn = ge('export_btn');
        if (exportBtn) {
            this.exportBtn = Button.fromElement(exportBtn);
        }

        const showBtn = ge('show_btn');
        if (showBtn) {
            this.showBtn = Button.fromElement(showBtn, {
                onClick: () => this.onShowClick(),
            });
        }

        const hideBtn = ge('hide_btn');
        if (hideBtn) {
            this.hideBtn = Button.fromElement(hideBtn, {
                onClick: () => this.onHideClick(),
            });
        }

        const deleteBtn = ge('del_btn');
        if (deleteBtn) {
            this.deleteBtn = Button.fromElement('del_btn', {
                onClick: () => this.onDeleteClick(),
            });
        }
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
