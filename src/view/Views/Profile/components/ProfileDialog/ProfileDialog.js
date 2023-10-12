import {
    show,
    isFunction,
    Component,
    createElement,
} from 'jezvejs';
import { Popup } from 'jezvejs/Popup';

import { App } from '../../../../Application/App.js';
import { __, getApplicationURL } from '../../../../utils/utils.js';

import { LoadingIndicator } from '../../../../Components/Common/LoadingIndicator/LoadingIndicator.js';
import { FormControls } from '../../../../Components/Form/FormControls/FormControls.js';

import './ProfileDialog.scss';

/* CSS classes */
const DIALOG_CLASS = 'profile-dialog';

/**
 * Base Profile dialog component
 */
export class ProfileDialog extends Component {
    constructor(props = {}) {
        super(props);

        this.init();
    }

    initDialog(options = {}) {
        const {
            id,
            title,
            className,
            containerId,
            action,
        } = options;

        this.form = createElement('form', {
            props: {
                method: 'post',
                action: getApplicationURL(action),
            },
            events: { submit: (e) => this.onSubmit(e) },
        });

        this.elem = createElement('div', {
            props: {
                id: containerId,
                className: 'profile-form-container',
            },
            children: [
                this.form,
            ],
        });

        // Submit controls
        this.formControls = FormControls.create({
            submitTitle: __('actions.submit'),
            cancelTitle: null,
        });
        this.form.append(this.formControls.elem);

        this.popup = Popup.create({
            id,
            title,
            className: [DIALOG_CLASS, className],
            content: this.elem,
            closeButton: true,
            onClose: () => this.onClose(),
        });
        show(this.elem, true);

        this.loadingIndicator = LoadingIndicator.create({ fixed: false });
        this.elem.append(this.loadingIndicator.elem);
    }

    /** Show/hide dialog */
    show(val) {
        this.render(this.state);
        this.popup.show(val);
    }

    /** Hide dialog */
    hide() {
        this.popup.hide();
    }

    /** Reset dialog state */
    reset() {
        this.form.reset();
    }

    startLoading() {
        this.setState({ ...this.state, loading: true });
    }

    stopLoading() {
        this.setState({ ...this.state, loading: false });
    }

    validateForm() {
        return { valid: true };
    }

    onClose() {
        this.reset();
        if (isFunction(this.props.onClose)) {
            this.props.onClose();
        }
    }

    onSubmit(e) {
        e.preventDefault();

        const validation = this.validateForm(this.state);
        if (validation.valid) {
            this.handleFormRequest();
        } else {
            this.setState({ ...this.state, validation });
        }
    }

    async sendFormRequest() {
        return { result: 'ok' };
    }

    async handleFormRequest() {
        this.startLoading();

        try {
            const result = await this.sendFormRequest();
            this.popup.close();

            if (result.msg) {
                App.createSuccessNotification(result.msg);
            }
        } catch (e) {
            App.createErrorNotification(e.message);
        }

        this.stopLoading();
    }

    renderDialog() {
    }

    render(state) {
        if (state.loading) {
            this.loadingIndicator.show();
        }

        this.renderDialog(state);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}
