import { ge, copyObject } from 'jezvejs';
import { View } from './View.js';
import { ConfirmDialog } from '../Components/ConfirmDialog/ConfirmDialog.js';
import { IconLink } from '../Components/IconLink/IconLink.js';
import '../css/lib/common.css';
import '../css/app.css';
import '../css/tiles.css';
import '../css/lib/iconlink.css';

const singlePersonDeleteTitle = 'Delete person';
const singlePersonDeleteMsg = 'Are you sure want to delete selected person?<br>Debt operations will be converted into expense or income.';

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
        this.form.addEventListener('submit', this.onSubmit.bind(this));

        this.nameInp = ge('pname');
        if (!this.nameInp) {
            throw new Error('Failed to initialize Person view');
        }

        this.nameInp.addEventListener('input', this.onNameInput.bind(this));

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
            title: singlePersonDeleteTitle,
            content: singlePersonDeleteMsg,
            onconfirm: () => this.delForm.submit(),
        });
    }
}

window.view = new PersonView(window.app);
