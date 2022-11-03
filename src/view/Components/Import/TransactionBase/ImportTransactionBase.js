import {
    createElement,
    isFunction,
    show,
    Component,
} from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import { Collapsible } from 'jezvejs/Collapsible';
import { OriginalImportData } from '../OriginalData/OriginalImportData.js';

/** CSS classes */
const TOGGLE_BUTTON_CLASS = 'btn icon-btn toggle-btn';
const TOGGLE_ICON_CLASS = 'icon toggle-icon';
/* Select controls */
const SELECT_CONTROLS_CLASS = 'select-controls';
const SELECTED_CLASS = 'import-item_selected';
/* Similar transaction */
const SIMILAR_CLASS = 'similar';
const SIMILAR_TITLE_CLASS = 'similar__title';
const SIMILAR_LINK_CLASS = 'similar__link';

/** Strings */
const STR_SIMILAR_FOUND = 'Similar transaction found: ';
const STR_SIMILAR_LINK = 'Edit';
const STR_ENABLE_ITEM = 'Enable';
const STR_DISABLE_ITEM = 'Disable';

/** Base import transaction class */
export class ImportTransactionBase extends Component {
    get enabled() {
        return this.state.transaction.enabled;
    }

    get collapsed() {
        return this.state.collapsed;
    }

    initContainer(className, children) {
        const { originalData } = this.props.data.props;
        if (!originalData) {
            this.elem = window.app.createContainer(className, children);
            return;
        }

        const origDataContainer = OriginalImportData.create({
            ...originalData,
        });

        const content = [origDataContainer.elem];

        const { similarTransaction } = this.props.data.state;
        if (similarTransaction) {
            const infoElem = this.createSimilarTransactionInfo(similarTransaction);
            content.push(infoElem);
        }

        this.toggleExtBtn = this.createToggleButton();
        this.controls.append(this.toggleExtBtn);

        this.collapse = Collapsible.create({
            toggleOnClick: false,
            className,
            header: children,
            content,
        });
        this.elem = this.collapse.elem;
    }

    /** Returns toggle expand/collapse button */
    createToggleButton() {
        return createElement('button', {
            props: { className: TOGGLE_BUTTON_CLASS, type: 'button' },
            children: window.app.createIcon('toggle-ext', TOGGLE_ICON_CLASS),
            events: { click: () => this.toggleCollapse() },
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

    createSelectControls() {
        const { createContainer } = window.app;

        if (this.selectControls) {
            return;
        }

        this.checkbox = Checkbox.create();
        this.selectControls = createContainer(SELECT_CONTROLS_CLASS, [
            this.checkbox.elem,
        ]);

        this.mainContainer.prepend(this.selectControls);
    }

    renderSelectControls(state, prevState = {}) {
        if (state.transaction.state.selectMode === prevState?.transaction?.state?.selectMode) {
            return;
        }

        const { selectMode, selected } = state.transaction.state;
        if (selectMode) {
            this.createSelectControls();
        }

        show(this.selectControls, selectMode);

        if (selectMode) {
            this.elem.classList.toggle(SELECTED_CLASS, !!selected);
            this.checkbox.check(!!selected);
        }
    }

    /** Remove item */
    remove() {
        if (isFunction(this.props.onRemove)) {
            this.props.onRemove(this);
        }
    }

    getEnableMenuItemTitle(state = this.state) {
        const { enabled } = state.transaction;
        return (enabled) ? STR_DISABLE_ITEM : STR_ENABLE_ITEM;
    }

    /** Enable/disable component */
    enable(value = true) {
        this.state.transaction.enable(value);
        this.render();

        if (isFunction(this.props.onEnable)) {
            this.props.onEnable(this, value);
        }
    }

    /** Toggle select/deselect component */
    toggleSelect() {
        this.state.transaction.toggleSelect();
        this.render();

        if (isFunction(this.props.onSelect)) {
            this.props.onSelect(this, this.state.transaction.selected);
        }
    }

    /** Enable/disable menu item 'click' event handler */
    onToggleEnable() {
        const value = !this.enabled;
        this.enable(value);
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
