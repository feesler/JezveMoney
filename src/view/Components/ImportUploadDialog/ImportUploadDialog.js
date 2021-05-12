import {
    ge,
    isFunction,
    show,
    enable,
} from '../../js/lib/common.js';
import { AppComponent } from '../AppComponent/AppComponent.js';
import { DropDown } from '../../js/lib/dropdown.js';
import { Popup } from '../../js/lib/popup.js';
import { createMessage } from '../../js/app.js';
import { ImportFileUploader } from '../../ImportFileUploader/ImportFileUploader.js';
import { ImportTemplateManager } from '../../ImportTemplateManager/ImportTemplateManager.js';

/**
 * ImportUploadDialog component
 */
export class ImportUploadDialog extends AppComponent {
    constructor(...args) {
        super(...args);

        if (
            !this.parent
            || !this.props
            || !this.props.mainAccount
            || !this.props.currencyModel
            || !this.props.accountModel
            || !this.props.personModel
            || !this.props.rulesModel
            || !this.props.tplModel
        ) {
            throw new Error('Invalid props');
        }

        this.model = {
            currency: this.props.currencyModel,
            accounts: this.props.accountModel,
            persons: this.props.personModel,
            rules: this.props.rulesModel,
            mainAccount: this.props.mainAccount
        };

        if (!isFunction(this.props.onuploaddone)) {
            throw new Error('uploaddone handler not specified');
        }
        this.uploadDoneHandler = this.props.onuploaddone;
        this.accountChangeHandler = this.props.onaccountchange;

        this.importedItems = null;

        this.uploader = new ImportFileUploader({
            elem: 'fileBlock',
            parent: this.parent,
            uploadStarted: this.onUploadStart.bind(this),
            uploaded: this.onUploaded.bind(this)
        });
        this.tplManager = new ImportTemplateManager({
            elem: 'templateBlock',
            parent: this.parent,
            currencyModel: this.props.currencyModel,
            tplModel: this.props.tplModel,
            rulesModel: this.model.rules,
            templateStatus: this.onTemplateStatus.bind(this)
        });

        this.popup = Popup.create({
            id: 'fileupload_popup',
            title: 'Upload',
            content: this.elem,
            onclose: this.onClose.bind(this),
            btn: {
                closeBtn: true
            },
            additional: 'upload-popup'
        });

        this.elem.addEventListener('dragenter', this.onDragEnter.bind(this), false);
        this.elem.addEventListener('dragleave', this.onDragLeave.bind(this), false);
        this.elem.addEventListener('dragover', this.onDragOver.bind(this), false);
        this.elem.addEventListener('drop', this.onDrop.bind(this), false);

        this.accountDropDown = DropDown.create({
            input_id: 'initialAccount',
            onchange: this.onAccountChange.bind(this),
            editable: false
        });

        this.initialAccField = ge('initialAccField');
        this.controlsBlock = this.elem.querySelector('.upload-dialog-controls');
        this.submitUploadedBtn = ge('submitUploadedBtn');
        if (!this.initialAccField
            || !this.accountDropDown
            || !this.controlsBlock
            || !this.submitUploadedBtn) {
            throw new Error('Failed to initialize upload file dialog');
        }

        this.submitUploadedBtn.addEventListener('click', this.onSubmit.bind(this));
    }

    /** Show/hide dialog */
    show(val) {
        this.popup.show(val);
    }

    /** Hide dialog */
    hide() {
        this.popup.hide();
    }

    /** Reset dialog */
    reset() {
        this.uploader.reset();
        this.tplManager.reset();
        this.enableUpload(false);

        this.importedItems = null;
    }

    /** Hide dialog */
    onClose() {
        this.reset();
    }

    /** File 'dragenter' event handler */
    onDragEnter(e) {
        e.stopPropagation();
        e.preventDefault();

        if (e.target === this.uploader.elem) {
            this.uploader.elem.classList.add('drag-over');
        }
    }

    /** File 'dragenter' event handler */
    onDragLeave(e) {
        if (e.target === this.uploader.elem) {
            this.uploader.elem.classList.remove('drag-over');
        }
    }

    /** File 'dragend' event handler */
    onDragOver(e) {
        e.stopPropagation();
        e.preventDefault();
    }

    /** File 'drop' event handler */
    onDrop(e) {
        var files;

        e.stopPropagation();
        e.preventDefault();

        this.uploader.elem.classList.remove('drag-over');

        files = e.dataTransfer.files;
        if (!files.length) {
            return;
        }

        this.uploader.setFile(files[0]);
    }

    /** Enable/disable upload button */
    enableUpload(val) {
        enable(this.initialAccountSel, !!val);
        show(this.initialAccField, !!val);

        enable(this.submitUploadedBtn, !!val);
        show(this.controlsBlock, !!val);
    }

    /** Initial account select 'change' event handler */
    onAccountChange(selectedAccount) {
        let account = null;

        if (selectedAccount) {
            account = this.model.accounts.getItem(selectedAccount.id);
        }
        if (!account) {
            throw new Error('Account not found');
        }

        this.model.mainAccount = account;

        if (isFunction(this.accountChangeHandler)) {
            this.accountChangeHandler(account.id);
        }
    }

    /** Submit event handler */
    onSubmit() {
        try {
            this.importedItems = this.tplManager.applyTemplate();
        } catch (e) {
            createMessage(e.message, 'msg_error');
            this.importedItems = null;
        }

        this.importDone();
    }

    /**
     * Import data request callback
     * @param {Array} data - data from uploader file
     */
    onUploadStart() {
        this.tplManager.setLoading(true);
        this.tplManager.show();
    }

    /**
     * Import data request callback
     * @param {Array} data - data from uploader file
     */
    onUploaded(data) {
        try {
            if (!data) {
                throw new Error('Invalid import data');
            }

            this.tplManager.setRawData(data);
        } catch (e) {
            createMessage(e.message, 'msg_error');
            this.importedItems = null;
            this.importDone();
        }
    }

    /**
     * Template status handler
     * @param {boolean} status - is valid template flag
     */
    onTemplateStatus(status) {
        this.enableUpload(status);
    }

    /** Hide import file form */
    importDone() {
        this.uploadDoneHandler(this.importedItems);
        this.reset();
    }
}
