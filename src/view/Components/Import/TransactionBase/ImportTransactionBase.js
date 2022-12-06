import {
    createElement,
    isFunction,
    Component,
} from 'jezvejs';
import { Icon } from 'jezvejs/Icon';

/** CSS classes */
const TOGGLE_BUTTON_CLASS = 'btn icon-btn toggle-btn';
const TOGGLE_ICON_CLASS = 'icon toggle-icon';
/* Similar transaction */
const SIMILAR_CLASS = 'similar';
const SIMILAR_TITLE_CLASS = 'similar__title';
const SIMILAR_LINK_CLASS = 'similar__link';
/* Menu */
const MENU_CLASS = 'popup-menu';
const MENU_BUTTON_CLASS = 'btn icon-btn popup-menu-btn';
const MENU_ICON_CLASS = 'icon popup-menu-btn__icon';

/** Strings */
const STR_SIMILAR_FOUND = 'Similar transaction found: ';
const STR_SIMILAR_LINK = 'Edit';

/** Base import transaction class */
export class ImportTransactionBase extends Component {
    get enabled() {
        return this.state.transaction.enabled;
    }

    get collapsed() {
        return this.state.collapsed;
    }

    createMenuButton() {
        const { createContainer } = window.app;

        const icon = Icon.create({
            icon: 'ellipsis',
            className: MENU_ICON_CLASS,
        });

        this.menuBtn = createElement('button', {
            props: { className: MENU_BUTTON_CLASS, type: 'button' },
            children: icon.elem,
        });
        this.menuContainer = createContainer(MENU_CLASS, [
            this.menuBtn,
        ]);
    }

    /** Returns toggle expand/collapse button */
    createToggleButton(events = null) {
        const icon = Icon.create({
            icon: 'toggle-ext',
            className: TOGGLE_ICON_CLASS,
        });

        return createElement('button', {
            props: { className: TOGGLE_BUTTON_CLASS, type: 'button' },
            children: icon.elem,
            events,
        });
    }

    createSimilarTransactionInfo(transaction) {
        if (!transaction) {
            return null;
        }

        const { baseURL } = window.app;
        const url = `${baseURL}transactions/update/${transaction.id}`;

        return createElement('div', {
            props: { className: SIMILAR_CLASS },
            children: [
                createElement('div', {
                    props: {
                        className: SIMILAR_TITLE_CLASS,
                        textContent: STR_SIMILAR_FOUND,
                    },
                }),
                createElement('a', {
                    props: {
                        className: SIMILAR_LINK_CLASS,
                        href: url,
                        textContent: STR_SIMILAR_LINK,
                    },
                }),
            ],
        });
    }

    /** Enable/disable component */
    enable(value = true) {
        this.state.transaction.enable(value);
        this.render();
    }

    /** Toggle select/deselect component */
    toggleSelect() {
        this.state.transaction.toggleSelect();
        this.render();
    }

    /** Toggle collapse/expand button 'click' event handler */
    toggleCollapse() {
        const value = !this.state.transaction.collapsed;
        this.state.transaction.collapse(value);
        this.render();

        if (isFunction(this.props.onCollapse)) {
            this.props.onCollapse(this, value);
        }
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
