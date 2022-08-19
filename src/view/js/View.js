import { ge, copyObject, onReady } from 'jezvejs';
import { Header } from '../Components/Header/Header.js';
import { createMessage } from './app.js';

const HIDDEN_GROUP_TITLE = 'Hidden';

/**
 * Base View class
 */
export class View {
    constructor(props = {}) {
        this.props = copyObject(props);

        onReady(() => this.onReady());
    }

    /**
     * Document ready event handler
     */
    onReady() {
        this.header = Header.create();
        this.onStart();

        const { message } = window.app;
        if (message) {
            createMessage(message.title, message.type);
        }
    }

    /**
     * View initialization event handler
     */
    onStart() { }

    /**
     * Clear validation state of block
     * @param {string|Element} block - block to clear validation state
     */
    clearBlockValidation(block) {
        const blockElem = (typeof block === 'string') ? ge(block) : block;
        if (blockElem && blockElem.classList) {
            blockElem.classList.remove('invalid-block');
        }
    }

    /**
     * Set invalid state for block
     * @param {string|Element} block - block to invalidate
     */
    invalidateBlock(block) {
        const blockElem = (typeof block === 'string') ? ge(block) : block;
        if (blockElem && blockElem.classList) {
            blockElem.classList.add('invalid-block');
        }
    }

    /**
     * Obtain request data of specified form element
     * @param {HTMLFormElement} form - form element to obtain data from
     */
    getFormData(form) {
        if (!form || !form.elements) {
            return null;
        }

        const res = {};
        for (let i = 0; i < form.elements.length; i += 1) {
            const inputEl = form.elements[i];
            if (inputEl.disabled || inputEl.name === '') {
                continue;
            }

            if ((inputEl.type === 'checkbox' || inputEl.type === 'radio')
                && !inputEl.checked) {
                continue;
            }

            res[inputEl.name] = inputEl.value;
        }

        return res;
    }

    /** Initialize currency DropDown */
    initCurrencyList(ddlist) {
        if (!ddlist) {
            return;
        }

        window.app.model.currency.forEach(
            (curr) => ddlist.addItem({ id: curr.id, title: curr.name }),
        );
    }

    /** Initialize acconts DropDown */
    initAccountsList(ddlist) {
        if (!ddlist) {
            return;
        }

        window.app.checkUserAccountModels();

        const { visibleUserAccounts, hiddenUserAccounts } = window.app.model;

        visibleUserAccounts.forEach(
            (item) => ddlist.addItem({ id: item.id, title: item.name }),
        );
        if (hiddenUserAccounts.length === 0) {
            return;
        }

        const group = ddlist.addGroup(HIDDEN_GROUP_TITLE);
        hiddenUserAccounts.forEach(
            (item) => ddlist.addItem({
                id: item.id,
                title: item.name,
                group,
            }),
        );
    }

    /** Initialize DropDown for debt account tile */
    initPersonsList(ddlist) {
        if (!ddlist) {
            return;
        }

        window.app.checkPersonModels();

        const { visiblePersons, hiddenPersons } = window.app.model;

        visiblePersons.forEach(
            (person) => ddlist.addItem({ id: person.id, title: person.name }),
        );
        if (hiddenPersons.length === 0) {
            return;
        }

        const group = ddlist.addGroup(HIDDEN_GROUP_TITLE);
        hiddenPersons.forEach(
            (person) => ddlist.addItem({
                id: person.id,
                title: person.name,
                group,
            }),
        );
    }
}
