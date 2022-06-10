import 'jezvejs/style';
import { ge, copyObject } from 'jezvejs';
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

        this.model = {};

        if (this.props.person) {
            this.model.original = this.props.person;
            this.model.data = copyObject(this.model.original);
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
        if (this.model.original.id) {
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
        this.clearBlockValidation('name-inp-block');
    }

    /**
     * Form submit event handler
     */
    onSubmit(e) {
        let valid = true;

        if (!this.nameInp.value || this.nameInp.value.length < 1) {
            this.invalidateBlock('name-inp-block');
            this.nameInp.focus();
            valid = false;
        }

        if (!valid) {
            e.preventDefault();
        }
    }

    /**
     * Show person delete confirmation popup
     */
    confirmDelete() {
        if (!this.model.data.id) {
            return;
        }

        ConfirmDialog.create({
            id: 'delete_warning',
            title: TITLE_PERSON_DELETE,
            content: MSG_PERSON_DELETE,
            onconfirm: () => this.delForm.submit(),
        });
    }
}

window.app = new Application(window.appProps);
window.app.createView(PersonView);
