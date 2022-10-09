import {
    ge,
    setEvents,
    isFunction,
} from 'jezvejs';
import { API } from '../../../js/api/index.js';
import { ProfileDialog } from '../ProfileDialog/ProfileDialog.js';

/* CSS classes */
const DIALOG_CLASS = 'name-dialog';
/* Strings */
const DIALOG_TITLE = 'Change name';

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
            title: DIALOG_TITLE,
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

        if (
            !state.name
            || state.name.length === 0
            || state.name === window.app.model.profile.name
        ) {
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

    /** Render component state */
    renderDialog(state) {
        this.nameInp.value = state.name;
        if (state.validation.name) {
            window.app.clearBlockValidation('name-inp-block');
        } else {
            window.app.invalidateBlock('name-inp-block');
        }
    }
}
