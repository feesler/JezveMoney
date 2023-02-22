import {
    ge,
    setEvents,
    isFunction,
} from 'jezvejs';
import { __ } from '../../../../js/utils.js';
import { API } from '../../../../js/api/index.js';
import { ProfileDialog } from '../ProfileDialog/ProfileDialog.js';

/* CSS classes */
const DIALOG_CLASS = 'name-dialog';

const defaultProps = {
    onNameChanged: null,
};

export class ChangeNameDialog extends ProfileDialog {
    constructor(...args) {
        super(...args);

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        this.init();
    }

    init() {
        this.elem = ge('changename');
        this.nameInp = ge('newname');
        if (!this.elem || !this.nameInp) {
            throw new Error('Failed to initialize Change name dialog');
        }
        setEvents(this.nameInp, { input: (e) => this.onNameInput(e) });

        this.initDialog({
            id: 'chname_popup',
            title: __('PROFILE_CHANGE_NAME'),
            className: DIALOG_CLASS,
        });

        this.reset();
    }

    /** Reset dialog state */
    reset() {
        super.reset();

        this.setState({
            name: window.app.model.profile.name,
            validation: {
                name: true,
            },
            loading: false,
        });
    }

    /** New name input at change name form event handler */
    onNameInput(e) {
        this.setState({
            ...this.state,
            name: e.target.value,
            validation: {
                ...this.state.validation,
                name: true,
            },
        });
    }

    validateForm(state) {
        const res = {
            valid: true,
            name: true,
        };

        if (!state.name || state.name.length === 0) {
            res.name = false;
            res.valid = false;
        }

        return res;
    }

    /** Send request to API to change user name */
    async sendFormRequest() {
        const result = await API.profile.changeName(this.state.name);

        if (isFunction(this.props.onNameChanged)) {
            this.props.onNameChanged(result.data.name);
        }

        return result;
    }

    async handleFormRequest() {
        if (this.state.name === window.app.model.profile.name) {
            this.popup.close();
            return;
        }

        await super.handleFormRequest();
    }

    /** Render component state */
    renderDialog(state) {
        this.nameInp.value = state.name;

        window.app.setValidation('name-inp-block', state.validation.name);
    }
}
