import {
    ce,
    isFunction,
    show,
    setEmptyClick,
    removeEmptyClick,
    Component,
    Collapsible,
} from 'jezvejs';
import { OriginalImportData } from '../OriginalData/OriginalImportData.js';

/** CSS classes */
const DEFAULT_BUTTON_CLASS = 'btn';
const TOGGLE_BUTTON_CLASS = 'toggle-btn';
const DEFAULT_ICON_CLASS = 'icon';
const TOGGLE_ICON_CLASS = 'toggle-icon';
/* Menu */
const MENU_CLASS = 'actions-menu';
const MENU_LIST_CLASS = 'actions-menu-list';
const MENU_BUTTON_CLASS = 'menu-btn';
const MENU_ICON_CLASS = 'menu-icon';

/** Base import transaction class */
export class ImportTransactionBase extends Component {
    get enabled() {
        return this.state.transaction.enabled;
    }

    initContainer(className, children) {
        const { originalData } = this.props.data.props;
        if (originalData) {
            const origDataContainer = OriginalImportData.create({
                ...originalData,
            });

            this.toggleExtBtn = this.createToggleButton();
            this.controls.append(this.toggleExtBtn);

            this.collapse = Collapsible.create({
                toggleOnClick: false,
                className,
                header: children,
                content: origDataContainer.elem,
            });
            this.elem = this.collapse.elem;
        } else {
            this.elem = window.app.createContainer(className, children);
        }
    }

    /** Returns toggle expand/collapse button */
    createToggleButton() {
        return ce(
            'button',
            { className: `${DEFAULT_BUTTON_CLASS} ${TOGGLE_BUTTON_CLASS}`, type: 'button' },
            window.app.createIcon('toggle-ext', `${DEFAULT_ICON_CLASS} ${TOGGLE_ICON_CLASS}`),
            { click: () => this.toggleCollapse() },
        );
    }

    createMenu(content) {
        const { createContainer, createIcon } = window.app;

        this.menuBtn = ce(
            'button',
            { className: `${DEFAULT_BUTTON_CLASS} ${MENU_BUTTON_CLASS}`, type: 'button' },
            createIcon('ellipsis', `${DEFAULT_ICON_CLASS} ${MENU_ICON_CLASS}`),
            { click: () => this.toggleMenu() },
        );

        this.menuList = createContainer(MENU_LIST_CLASS, content);
        show(this.menuList, false);
        this.menu = createContainer(MENU_CLASS, [
            this.menuBtn,
            this.menuList,
        ]);
    }

    hideMenu() {
        show(this.menuList, false);
        removeEmptyClick(this.menuEmptyClickHandler);
    }

    toggleMenu() {
        if (this.menuList.hasAttribute('hidden')) {
            show(this.menuList, true);
            setEmptyClick(this.menuEmptyClickHandler);
        } else {
            this.hideMenu();
        }
    }

    /** Remove item */
    remove() {
        if (isFunction(this.props.onRemove)) {
            this.props.onRemove(this);
        }
    }

    /** Enable checkbox 'change' event handler */
    onRowChecked() {
        const value = this.enableCheck.checked;
        this.state.transaction.enable(value);
        this.render();

        if (isFunction(this.props.onEnable)) {
            this.props.onEnable(this, value);
        }
    }

    /** Toggle collapse/expand button 'click' event handler */
    toggleCollapse() {
        this.collapse?.toggle();
    }

    /** Main account of transaction select 'change' event handler */
    onMainAccountChanged(value) {
        this.setMainAccount(value);
        this.render();
    }

    /** Set type of transaction */
    setTransactionType(value) {
        this.state.transaction.setTransactionType(value);
    }

    /** Set source currency */
    setSourceCurrency(value) {
        this.state.transaction.setSourceCurrency(value);
    }

    /** Set destination currency */
    setDestCurrency(value) {
        this.state.transaction.setDestCurrency(value);
    }

    /** Set main account */
    setMainAccount(value) {
        this.state.transaction.setMainAccount(value);
    }

    /** Set transfer account */
    setTransferAccount(value) {
        this.state.transaction.setTransferAccount(value);
    }

    /** Set person */
    setPerson(value) {
        this.state.transaction.setPerson(value);
    }

    /** Set source amount */
    setSourceAmount(value) {
        this.state.transaction.setSourceAmount(value);
    }

    /** Set destination amount */
    setDestAmount(value) {
        this.state.transaction.setDestAmount(value);
    }

    /** Set date */
    setDate(value) {
        this.state.transaction.setDate(value);
    }

    /** Set comment */
    setComment(value) {
        this.state.transaction.setComment(value);
    }

    /** Return original data object */
    getOriginal() {
        return this.state.transaction.getOriginal();
    }

    /** Return transaction object */
    getData() {
        return this.state.transaction.getData();
    }

    /** Return date string */
    getDate() {
        return this.state.transaction.getDate();
    }
}
