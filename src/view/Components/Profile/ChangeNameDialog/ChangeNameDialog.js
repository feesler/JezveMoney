import {
    ge,
    show,
    isFunction,
    setEvents,
    Component,
} from 'jezvejs';
import { Popup } from 'jezvejs/Popup';
import { API } from '../../../js/api/index.js';
import { LoadingIndicator } from '../../LoadingIndicator/LoadingIndicator.js';
import './style.scss';

/* CSS classes */
const DIALOG_CLASS = 'name-dialog';
/* Strings */
const DIALOG_TITLE = 'Change name';

const defaultProps = {
    onNameChanged: null,
};

export class ChangeNameDialog extends Component {
    static create(props) {
        return new ChangeNameDialog(props);
    }

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
        this.form = this.elem?.querySelector('form');
        this.nameInp = ge('newname');
        if (!this.elem || !this.form || !this.nameInp) {
            throw new Error('Failed to initialize Change name dialog');
        }

        setEvents(this.form, { submit: (e) => this.onSubmit(e) });
        setEvents(this.nameInp, { input: (e) => this.onNameInput(e) });

        this.popup = Popup.create({
            id: 'chname_popup',
            title: DIALOG_TITLE,
            content: this.elem,
            className: DIALOG_CLASS,
            btn: {
                okBtn: { value: 'Submit', onclick: (e) => this.onSubmit(e) },
                closeBtn: true,
            },
            onclose: () => this.reset(),
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
        this.setState({
            name: window.app.model.profile.name,
            validation: {
                name: true,
            },
            loading: false,
        });
    }

    startLoading() {
        this.setState({ ...this.state, loading: true });
    }

    stopLoading() {
        this.setState({ ...this.state, loading: false });
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

    /** Change name form submit event handler */
    onSubmit(e) {
        e.preventDefault();

        const validation = {
            valid: true,
            name: true,
        };

        if (
            !this.state.name
            || this.state.name.length === 0
            || this.state.name === window.app.model.profile.name
        ) {
            validation.name = false;
            validation.valid = false;
        }

        if (validation.valid) {
            this.requestNameChange(this.nameInp.value);
        } else {
            this.setState({ ...this.state, validation });
        }
    }

    /** Send request to API to change user name */
    async requestNameChange() {
        this.startLoading();

        try {
            const result = await API.profile.changeName(this.state.name);

            if (isFunction(this.props.onNameChanged)) {
                this.props.onNameChanged(result.data.name);
            }

            this.popup.close();

            if (result.msg) {
                window.app.createMessage(result.msg, 'msg_success');
            }
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
        }

        this.stopLoading();
    }

    /** Render component state */
    render(state) {
        if (state.loading) {
            this.loadingIndicator.show();
        }

        this.nameInp.value = state.name;
        if (state.validation.name) {
            window.app.clearBlockValidation('name-inp-block');
        } else {
            window.app.invalidateBlock('name-inp-block');
        }

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}
