import {
    ge,
    createElement,
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

/** CSS classes */
const UPLOAD_POPUP_CLASS = 'upload-popup';
const DRAG_OVER_CLASS = 'drag-over';
const CONVERT_TITLE_CLASS = 'upload-popup__convert-title';
const BACK_BTN_CLASS = 'back-btn';
const BACK_ICON_CLASS = 'icon back-icon';
/** Strings */
const TITLE_UPLOAD = 'Upload';
const TITLE_CONVERT = 'Convert';
/** States */
const UPLOAD_STATE = 1;
const CONVERT_STATE = 2;

/**
 * ImportUploadDialog component
 */
export class ImportUploadDialog extends Component {
    static create(props) {
        return new ImportUploadDialog(props);
    }

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
            uploadEnabled: false,
            loading: false,
        };

        this.dragEnterHandler = (e) => this.onDragEnter(e);
        this.dragLeaveHandler = (e) => this.onDragLeave(e);
        this.dragOverHandler = (e) => this.onDragOver(e);
        this.dropHandler = (e) => this.onDrop(e);

        this.init();
    }

    init() {
        this.uploader = ImportFileUploader.create({
            elem: 'fileBlock',
            onUploadStart: () => this.onUploadStart(),
            onUploadError: (message) => this.onUploadError(message),
            onUploaded: (data) => this.onUploaded(data),
        });
        this.tplManager = ImportTemplateManager.create({
            elem: 'templateBlock',
            mainAccount: this.state.mainAccount,
            onStatus: (status) => this.onTemplateStatus(status),
            onUpdate: () => this.onTemplateUpdate(),
        });

        this.popup = Popup.create({
            id: 'fileupload_popup',
            title: TITLE_UPLOAD,
            content: this.elem,
            onclose: () => this.onClose(),
            btn: {
                closeBtn: true,
            },
            className: UPLOAD_POPUP_CLASS,
        });
        show(this.elem, true);

        this.accountDropDown = DropDown.create({
            elem: 'initialAccount',
            onchange: (account) => this.onAccountChange(account),
        });

        this.initialAccField = ge('initialAccField');
        this.controlsBlock = ge('uploadControls');
        this.submitUploadedBtn = ge('submitUploadedBtn');
        if (
            !this.initialAccField
            || !this.accountDropDown
            || !this.controlsBlock
            || !this.submitUploadedBtn
        ) {
            throw new Error('Failed to initialize upload file dialog');
        }

        window.app.initAccountsList(this.accountDropDown);
        this.accountDropDown.selectItem(this.state.mainAccount.id.toString());

        this.submitUploadedBtn.addEventListener('click', () => this.onSubmit());

        this.uploadProgress = LoadingIndicator.create({ fixed: false });
        this.elem.append(this.uploadProgress.elem);

        this.setUploadState();
    }

    setDragHandlers() {
        this.elem.addEventListener('dragenter', this.dragEnterHandler, false);
        this.elem.addEventListener('dragleave', this.dragLeaveHandler, false);
        this.elem.addEventListener('dragover', this.dragOverHandler, false);
        this.elem.addEventListener('drop', this.dropHandler, false);
    }

    removeDragHandlers() {
        this.elem.removeEventListener('dragenter', this.dragEnterHandler, false);
        this.elem.removeEventListener('dragleave', this.dragLeaveHandler, false);
        this.elem.removeEventListener('dragover', this.dragOverHandler, false);
        this.elem.removeEventListener('drop', this.dropHandler, false);
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
        this.setState({
            ...this.state,
            id: UPLOAD_STATE,
            importedItems: null,
            uploadEnabled: false,
            loading: false,
        });
    }

    setLoading(value) {
        this.setState({ ...this.state, loading: !!value });
    }

    setUploadState() {
        this.setState({ ...this.state, id: UPLOAD_STATE });
    }

    setConvertState() {
        this.setState({ ...this.state, id: CONVERT_STATE });
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
            this.uploader.elem.classList.add(DRAG_OVER_CLASS);
        }
    }

    /** File 'dragenter' event handler */
    onDragLeave(e) {
        if (e.target === this.uploader.elem) {
            this.uploader.elem.classList.remove(DRAG_OVER_CLASS);
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

        this.uploader.elem.classList.remove(DRAG_OVER_CLASS);

        const { files } = e.dataTransfer;
        if (!files.length) {
            return;
        }

        this.uploader.setFile(files[0]);
    }

    /** Enable/disable upload button */
    enableUpload(val) {
        this.setState({
            ...this.state,
            loading: false,
            uploadEnabled: !!val,
        });
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
        this.setLoading(true);

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
            this.setLoading(false);
            return;
        }

        this.importDone();
    }

    /** Upload started handler */
    onUploadStart() {
        this.setLoading(true);
    }

    /** Upload error handler */
    onUploadError(message) {
        this.setLoading(false);
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

            this.setConvertState();
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

    setState(state) {
        if (this.state === state) {
            return;
        }

        this.render(state, this.state);
        this.state = state;
    }

    renderDialogTitle(state, prevState) {
        if (state.id === prevState.id) {
            return;
        }

        if (state.id === UPLOAD_STATE) {
            this.popup.setTitle(TITLE_UPLOAD);
        } else if (state.id === CONVERT_STATE) {
            const icon = window.app.createIcon('back', BACK_ICON_CLASS);
            const backButton = createElement('button', {
                props: { className: BACK_BTN_CLASS },
                children: icon,
                events: { click: () => this.setUploadState() },
            });

            const titleElem = createElement('div', { props: { textContent: TITLE_CONVERT } });
            const convertTitle = createElement('div', {
                props: { className: CONVERT_TITLE_CLASS },
                children: [backButton, titleElem],
            });

            this.popup.setTitle(convertTitle);
        }
    }

    render(state, prevState) {
        if (state.loading) {
            this.uploadProgress.show();
        }

        this.renderDialogTitle(state, prevState);

        if (state.id === UPLOAD_STATE) {
            this.setDragHandlers();

            this.uploader.reset();
            this.tplManager.reset();

            this.uploader.show();
            this.tplManager.hide();
        } else if (state.id === CONVERT_STATE) {
            this.removeDragHandlers();

            this.uploader.hide();
            this.tplManager.show();
        }

        const uploadEnabled = state.id === CONVERT_STATE && state.uploadEnabled;
        this.accountDropDown.enable(uploadEnabled);
        show(this.initialAccField, uploadEnabled);
        enable(this.submitUploadedBtn, uploadEnabled);
        show(this.controlsBlock, uploadEnabled);

        if (!state.loading) {
            this.uploadProgress.hide();
        }
    }
}
