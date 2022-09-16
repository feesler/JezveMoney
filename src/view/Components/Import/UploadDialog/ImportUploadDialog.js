import {
    ge,
    isFunction,
    show,
    enable,
    Component,
    DropDown,
    Popup,
} from 'jezvejs';
import { ImportFileUploader } from '../FileUploader/ImportFileUploader.js';
import { ImportTemplateManager } from '../TemplateManager/ImportTemplateManager.js';
import { LoadingIndicator } from '../../LoadingIndicator/LoadingIndicator.js';
import './style.scss';

/**
 * ImportUploadDialog component
 */
export class ImportUploadDialog extends Component {
    constructor(...args) {
        super(...args);

        if (!this.props?.mainAccount) {
            throw new Error('Invalid props');
        }
        if (!isFunction(this.props.onUploadDone)) {
            throw new Error('uploaddone handler not specified');
        }

        this.state = {
            mainAccount: this.props.mainAccount,
            importedItems: null,
        };

        this.uploader = new ImportFileUploader({
            elem: 'fileBlock',
            onUploadStart: () => this.onUploadStart(),
            onUploadError: (message) => this.onUploadError(message),
            onUploaded: (data) => this.onUploaded(data),
        });
        this.tplManager = new ImportTemplateManager({
            elem: 'templateBlock',
            mainAccount: this.state.mainAccount,
            onStatus: (status) => this.onTemplateStatus(status),
            onUpdate: () => this.onTemplateUpdate(),
        });

        this.popup = Popup.create({
            id: 'fileupload_popup',
            title: 'Upload',
            content: this.elem,
            onclose: () => this.onClose(),
            btn: {
                closeBtn: true,
            },
            className: 'upload-popup',
        });
        show(this.elem, true);

        this.elem.addEventListener('dragenter', (e) => this.onDragEnter(e), false);
        this.elem.addEventListener('dragleave', (e) => this.onDragLeave(e), false);
        this.elem.addEventListener('dragover', (e) => this.onDragOver(e), false);
        this.elem.addEventListener('drop', (e) => this.onDrop(e), false);

        this.accountDropDown = DropDown.create({
            elem: 'initialAccount',
            onchange: (account) => this.onAccountChange(account),
        });

        this.initialAccField = ge('initialAccField');
        this.controlsBlock = this.elem.querySelector('.upload-dialog > .form-controls');
        this.submitUploadedBtn = ge('submitUploadedBtn');
        if (!this.initialAccField
            || !this.accountDropDown
            || !this.controlsBlock
            || !this.submitUploadedBtn) {
            throw new Error('Failed to initialize upload file dialog');
        }

        window.app.initAccountsList(this.accountDropDown);
        this.accountDropDown.selectItem(this.state.mainAccount.id.toString());

        this.submitUploadedBtn.addEventListener('click', () => this.onSubmit());

        this.uploadProgress = LoadingIndicator.create({ fixed: false });
        this.elem.append(this.uploadProgress.elem);
    }

    /** Show/hide dialog */
    show(val) {
        this.popup.show(val);
        this.uploadProgress.hide();
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

        this.state.importedItems = null;
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
        e.stopPropagation();
        e.preventDefault();

        this.uploader.elem.classList.remove('drag-over');

        const { files } = e.dataTransfer;
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

    /** Main account update handler */
    setMainAccount(account) {
        if (!account) {
            throw new Error('Invalid account');
        }

        if (this.state.mainAccount.id === account.id) {
            return;
        }

        this.accountDropDown.selectItem(account.id.toString());
        this.onAccountChange(account);
    }

    /** Initial account select 'change' event handler */
    onAccountChange(selectedAccount) {
        let account = null;

        if (selectedAccount) {
            account = window.app.model.accounts.getItem(selectedAccount.id);
        }
        if (!account) {
            throw new Error('Account not found');
        }

        this.state.mainAccount = account;

        this.tplManager.setMainAccount(account);

        if (isFunction(this.props.onAccountChange)) {
            this.props.onAccountChange(account.id);
        }
    }

    /** Submit event handler */
    onSubmit() {
        this.uploadProgress.show();

        setTimeout(() => this.processItems(), 100);
    }

    /** Convert uploaded data to import items */
    processItems() {
        try {
            this.state.importedItems = this.tplManager.applyTemplate();
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
            this.state.importedItems = null;
        }

        if (!this.state.importedItems) {
            this.uploadProgress.hide();
            return;
        }

        this.importDone();
    }

    /** Upload started handler */
    onUploadStart() {
        this.tplManager.setLoading();
        this.tplManager.show();
    }

    /** Upload error handler */
    onUploadError(message) {
        this.tplManager.reset();
        window.app.createMessage(message, 'msg_error');
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
            this.onUploadError(e.message);
            this.state.importedItems = null;
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

    /** Template update handler */
    onTemplateUpdate() {
        if (isFunction(this.props.onTemplateUpdate)) {
            this.props.onTemplateUpdate();
        }
    }

    /** Hide import file form */
    importDone() {
        this.props.onUploadDone(this.state.importedItems);
        this.reset();
    }
}
