import {
    ce,
    isFunction,
    Component,
} from 'jezvejs';
import { Collapsible } from 'jezvejs/Collapsible';
import { OriginalImportData } from '../OriginalData/OriginalImportData.js';

/** CSS classes */
const TOGGLE_BUTTON_CLASS = 'btn icon-btn toggle-btn';
const TOGGLE_ICON_CLASS = 'icon toggle-icon';

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
            { className: TOGGLE_BUTTON_CLASS, type: 'button' },
            window.app.createIcon('toggle-ext', TOGGLE_ICON_CLASS),
            { click: () => this.toggleCollapse() },
        );
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
