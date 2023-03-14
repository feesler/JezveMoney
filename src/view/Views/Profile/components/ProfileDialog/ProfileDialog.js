import {
    show,
    setEvents,
    isFunction,
    Component,
} from 'jezvejs';
import { Popup } from 'jezvejs/Popup';
import { LoadingIndicator } from '../../../../Components/LoadingIndicator/LoadingIndicator.js';
import './ProfileDialog.scss';

/* CSS classes */
const DIALOG_CLASS = 'profile-dialog';

export class ProfileDialog extends Component {
    initDialog({ id, title, className }) {
        this.form = this.elem?.querySelector('form');
        if (!this.elem || !this.form) {
            throw new Error('Failed to initialize dialog');
        }
        setEvents(this.form, { submit: (e) => this.onSubmit(e) });

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

        this.reset();
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
                window.app.createSuccessNotification(result.msg);
            }
        } catch (e) {
            window.app.createErrorNotification(e.message);
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
