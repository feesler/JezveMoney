import { copyObject, onReady } from 'jezvejs';
import { Header } from '../Components/Header/Header.js';

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
        window.app.setupTheme();

        this.header = Header.create();
        this.onStart();

        const { message } = window.app;
        if (message) {
            window.app.createMessage(message.title, message.type);
        }
    }

    /**
     * View initialization event handler
     */
    onStart() { }

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

    /** Update state of view and render changes */
    setState(state) {
        if (this.state === state) {
            return;
        }

        this.render(state, this.state);
        this.state = state;
    }

    /** Renders view state to the DOM */
    render() { }
}
