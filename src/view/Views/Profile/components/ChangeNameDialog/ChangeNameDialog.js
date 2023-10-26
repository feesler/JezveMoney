import { isFunction } from '@jezvejs/types';

import { __ } from '../../../../utils/utils.js';
import { App } from '../../../../Application/App.js';
import { API } from '../../../../API/index.js';

import { InputField } from '../../../../Components/Form/Fields/InputField/InputField.js';
import { ProfileDialog } from '../ProfileDialog/ProfileDialog.js';

/* CSS classes */
const DIALOG_CLASS = 'name-dialog';

const defaultProps = {
    onNameChanged: null,
};

export class ChangeNameDialog extends ProfileDialog {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });
    }

    init() {
        this.initDialog({
            id: 'chname_popup',
            containerId: 'changename',
            action: 'profile/changename/',
            title: __('profile.changeName'),
            className: DIALOG_CLASS,
        });

        // Name field
        this.nameField = InputField.create({
            id: 'nameField',
            inputId: 'nameInp',
            className: 'form-row',
            name: 'name',
            title: __('profile.newName'),
            validate: true,
            feedbackMessage: __('profile.invalidName'),
            onInput: (e) => this.onNameInput(e),
        });

        this.form.prepend(this.nameField.elem);

        this.reset();
    }

    /** Reset dialog state */
    reset() {
        super.reset();

        this.setState({
            name: App.model.profile.name,
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
        if (this.state.name === App.model.profile.name) {
            this.popup.close();
            return;
        }

        await super.handleFormRequest();
    }

    /** Render component state */
    renderDialog(state) {
        this.nameField.setState((nameState) => ({
            ...nameState,
            value: state.name,
            valid: state.validation.name,
        }));
    }
}
