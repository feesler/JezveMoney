import 'jezvejs/style';
import {
    ge,
    show,
    enable,
    insertAfter,
    setEvents,
} from 'jezvejs';
import { Spinner } from 'jezvejs/Spinner';
import { Application } from '../../js/Application.js';
import { View } from '../../js/View.js';
import { API } from '../../js/api/index.js';
import { PersonList } from '../../js/model/PersonList.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { IconLink } from '../../Components/IconLink/IconLink.js';
import '../../css/app.scss';

const TITLE_PERSON_DELETE = 'Delete person';
const MSG_PERSON_DELETE = 'Are you sure want to delete selected person?<br>Debt operations will be converted into expense or income.';
const MSG_EMPTY_NAME = 'Input name.';
const MSG_EXISTING_NAME = 'Person with this name already exist.';

/**
 * Create/update person view
 */
class PersonView extends View {
    constructor(...args) {
        super(...args);

        this.state = {
            validation: {
                name: true,
            },
            submitStarted: false,
        };

        if (this.props.person) {
            this.state.original = this.props.person;
            this.state.data = { ...this.state.original };
        }

        window.app.loadModel(PersonList, 'persons', window.app.props.persons);
    }

    /**
     * View initialization
     */
    onStart() {
        this.form = ge('personForm');
        this.nameInp = ge('pname');
        this.nameFeedback = ge('namefeedback');
        this.submitBtn = ge('submitBtn');
        this.cancelBtn = ge('cancelBtn');
        if (
            !this.form
            || !this.nameInp
            || !this.nameFeedback
            || !this.submitBtn
            || !this.cancelBtn
        ) {
            throw new Error('Failed to initialize Person view');
        }

        setEvents(this.form, { submit: (e) => this.onSubmit(e) });
        setEvents(this.nameInp, { input: (e) => this.onNameInput(e) });

        this.spinner = Spinner.create();
        this.spinner.hide();
        insertAfter(this.spinner.elem, this.cancelBtn);

        // Update mode
        if (this.state.original.id) {
            this.deleteBtn = IconLink.fromElement({
                elem: 'del_btn',
                onClick: () => this.confirmDelete(),
            });
        }
    }

    /** Name input event handler */
    onNameInput() {
        this.setState({
            ...this.state,
            validation: {
                ...this.state.validation,
                name: true,
            },
            data: {
                ...this.state.data,
                name: this.nameInp.value,
            },
        });
    }

    /** Form submit event handler */
    onSubmit(e) {
        e.preventDefault();

        if (this.state.submitStarted) {
            return;
        }

        const { name } = this.state.data;
        const validation = {
            valid: true,
            name: true,
        };

        if (name.length === 0) {
            validation.name = MSG_EMPTY_NAME;
            validation.valid = false;
            this.nameInp.focus();
        } else {
            const person = window.app.model.persons.findByName(name);
            if (person && this.state.original.id !== person.id) {
                validation.name = MSG_EXISTING_NAME;
                validation.valid = false;
                this.nameInp.focus();
            }
        }

        if (validation.valid) {
            this.submitPerson();
        } else {
            this.setState({ ...this.state, validation });
        }
    }

    startSubmit() {
        this.setState({ ...this.state, submitStarted: true });
    }

    cancelSubmit() {
        this.setState({ ...this.state, submitStarted: false });
    }

    async submitPerson() {
        if (this.state.submitStarted) {
            return;
        }

        this.startSubmit();

        const isUpdate = this.state.original.id;
        const data = {
            name: this.state.data.name,
            flags: this.state.original.flags,
        };

        if (isUpdate) {
            data.id = this.state.original.id;
        }

        try {
            if (isUpdate) {
                await API.person.update(data);
            } else {
                await API.person.create(data);
            }

            const { baseURL } = window.app;
            window.location = `${baseURL}persons/`;
        } catch (e) {
            this.cancelSubmit();
            window.app.createMessage(e.message, 'msg_error');
        }
    }

    async deletePerson() {
        const { original } = this.state;
        if (this.state.submitStarted || !original.id) {
            return;
        }

        this.startSubmit();

        try {
            await API.person.del({ id: original.id });

            const { baseURL } = window.app;
            window.location = `${baseURL}persons/`;
        } catch (e) {
            this.cancelSubmit();
            window.app.createMessage(e.message, 'msg_error');
        }
    }

    /** Show person delete confirmation popup */
    confirmDelete() {
        if (!this.state.data.id) {
            return;
        }

        ConfirmDialog.create({
            id: 'delete_warning',
            title: TITLE_PERSON_DELETE,
            content: MSG_PERSON_DELETE,
            onconfirm: () => this.deletePerson(),
        });
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (this.deleteBtn) {
            this.deleteBtn.enable(!state.submitStarted);
        }

        // Name input
        if (state.validation.name === true) {
            window.app.clearBlockValidation('name-inp-block');
        } else {
            this.nameFeedback.textContent = state.validation.name;
            window.app.invalidateBlock('name-inp-block');
        }
        enable(this.nameInp, !state.submitStarted);
        enable(this.submitBtn, !state.submitStarted);
        show(this.cancelBtn, !state.submitStarted);

        this.spinner.show(state.submitStarted);
    }
}

window.app = new Application(window.appProps);
window.app.createView(PersonView);
