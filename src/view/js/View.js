import { ge, copyObject, onReady } from 'jezvejs';
import { Header } from '../Components/Header/Header.js';
import { createMessage } from './app.js';

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
}
