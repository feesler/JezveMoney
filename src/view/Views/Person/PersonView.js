import 'jezvejs/style';
import { ge } from 'jezvejs';
import { Application } from '../../js/Application.js';
import { View } from '../../js/View.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { IconLink } from '../../Components/IconLink/IconLink.js';
import '../../css/app.css';

const TITLE_PERSON_DELETE = 'Delete person';
const MSG_PERSON_DELETE = 'Are you sure want to delete selected person?<br>Debt operations will be converted into expense or income.';

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
        };

        if (this.props.person) {
            this.state.original = this.props.person;
            this.state.data = { ...this.state.original };
        }
    }

    /**
     * View initialization
     */
    onStart() {
        this.form = ge('personForm');
        if (!this.form) {
            throw new Error('Failed to initialize Person view');
        }
        this.form.addEventListener('submit', (e) => this.onSubmit(e));

        this.nameInp = ge('pname');
        if (!this.nameInp) {
            throw new Error('Failed to initialize Person view');
        }

        this.nameInp.addEventListener('input', () => this.onNameInput());

        // Update mode
        if (this.state.original.id) {
            this.deleteBtn = IconLink.fromElement({
                elem: 'del_btn',
                onclick: () => this.confirmDelete(),
            });
            this.delForm = ge('delform');
            if (!this.delForm) {
                throw new Error('Failed to initialize Person view');
            }
        }
    }

    /**
     * Person name input event handler
     */
    onNameInput() {
        this.state.validation.name = true;
        this.state.data.name = this.nameInp.value;
        this.render(this.state);
    }

    /**
     * Form submit event handler
     */
    onSubmit(e) {
        const { name } = this.state.data;
        let valid = true;

        if (name.length === 0) {
            this.state.validation.name = false;
            this.nameInp.focus();
            valid = false;
        }

        if (!valid) {
            e.preventDefault();
            this.render(this.state);
        }
    }

    /**
     * Show person delete confirmation popup
     */
    confirmDelete() {
        if (!this.state.data.id) {
            return;
        }

        ConfirmDialog.create({
            id: 'delete_warning',
            title: TITLE_PERSON_DELETE,
            content: MSG_PERSON_DELETE,
            onconfirm: () => this.delForm.submit(),
        });
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        // Name input
        if (state.validation.name) {
            this.clearBlockValidation('name-inp-block');
        } else {
            this.invalidateBlock('name-inp-block');
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(PersonView);
