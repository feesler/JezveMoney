import { isFunction } from '@jezvejs/types';
import { Component } from 'jezvejs';
import {
    createElement,
    setEvents,
    removeEvents,
} from '@jezvejs/dom';
import { Button } from 'jezvejs/Button';
import { Popup } from 'jezvejs/Popup';

// Application
import { __ } from '../../../../../utils/utils.js';
import { App } from '../../../../../Application/App.js';

// Common components
import { LoadingIndicator } from '../../../../../Components/Common/LoadingIndicator/LoadingIndicator.js';

// Local components
import { ImportFileUploader } from '../FileUploader/ImportFileUploader.js';
import { ImportTemplateManager } from '../TemplateManager/ImportTemplateManager.js';
import {
    TPL_SELECT_STATE,
    TPL_CREATE_STATE,
    TPL_UPDATE_STATE,
} from '../TemplateManager/reducer.js';

import './ImportUploadDialog.scss';

/** CSS classes */
const DIALOG_CLASS = 'upload-dialog';
const UPLOAD_POPUP_CLASS = 'upload-popup';
const DRAG_OVER_CLASS = 'drag-over';
const CONVERT_TITLE_CLASS = 'upload-popup__convert-title';
const BACK_BTN_CLASS = 'btn back-btn circle-btn';
const TPL_FORM_TITLE_CLASS = 'template-form-title';

/** States */
const UPLOAD_STATE = 1;
const CONVERT_STATE = 2;

const defaultProps = {
    mainAccount: null,
    onClose: null,
    onUploadDone: null,
};

/**
 * ImportUploadDialog component
 */
export class ImportUploadDialog extends Component {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        if (!this.props?.mainAccount) {
            throw new Error('Invalid props');
        }
        if (!isFunction(this.props.onUploadDone)) {
            throw new Error('uploaddone handler not specified');
        }

        this.state = {
            mainAccount: this.props.mainAccount,
            importedItems: null,
            loading: false,
        };

        this.dragEnterHandler = (e) => this.onDragEnter(e);
        this.dragLeaveHandler = (e) => this.onDragLeave(e);
        this.dragOverHandler = (e) => this.onDragOver(e);
        this.dropHandler = (e) => this.onDrop(e);
        this.fileDropEvents = {
            dragenter: this.dragEnterHandler,
            dragleave: this.dragLeaveHandler,
            dragover: this.dragOverHandler,
            drop: this.dropHandler,
        };

        this.init();
    }

    init() {
        this.uploader = ImportFileUploader.create({
            elem: 'fileBlock',
            onUploadStart: () => this.onUploadStart(),
            onUploadError: (message) => this.onUploadError(message),
            onUploaded: (data, filename) => this.onUploaded(data, filename),
        });

        this.tplManager = ImportTemplateManager.create({
            elem: 'templateBlock',
            mainAccount: this.state.mainAccount,
            onChangeState: (state) => this.onConvertStateChange(state),
            onUpdate: () => this.onTemplateUpdate(),
            onAccountChange: (account) => this.onAccountChange(account),
            onSubmit: () => this.onSubmit(),
        });

        this.uploadProgress = LoadingIndicator.create({ fixed: false });

        this.elem = createElement('div', {
            props: { id: 'uploadDialog', className: DIALOG_CLASS },
            children: [
                this.uploader.elem,
                this.tplManager.elem,
                this.uploadProgress.elem,
            ],
        });

        this.popup = Popup.create({
            id: 'fileupload_popup',
            title: __('import.upload'),
            content: this.elem,
            closeButton: true,
            onClose: () => this.onClose(),
            className: UPLOAD_POPUP_CLASS,
        });

        this.setUploadState();
    }

    setDragHandlers() {
        setEvents(this.elem, this.fileDropEvents, false);
    }

    removeDragHandlers() {
        removeEvents(this.elem, this.fileDropEvents, false);
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
            convertState: TPL_SELECT_STATE,
            importedItems: null,
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
        if (isFunction(this.props.onClose)) {
            this.props.onClose();
        }
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

    /** Main account update handler */
    setMainAccount(account) {
        if (!account) {
            throw new Error('Invalid account');
        }

        if (this.state.mainAccount.id === account.id) {
            return;
        }

        this.state.mainAccount = account;
        this.tplManager.setMainAccount(account);
    }

    /** Initial account select 'change' event handler */
    onAccountChange(selectedAccount) {
        const account = App.model.accounts.getItem(selectedAccount);
        if (!account) {
            throw new Error('Account not found');
        }

        this.state.mainAccount = account;

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
            App.createErrorNotification(e.message);
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
        App.createErrorNotification(message);
    }

    /**
     * Import data request callback
     * @param {Array} data - data from uploader file
     */
    onUploaded(data, filename) {
        try {
            if (!data) {
                throw new Error('Invalid import data');
            }

            this.setConvertState();
            this.tplManager.setRawData({ data, filename });
            this.setLoading(false);
        } catch (e) {
            this.onUploadError(e.message);
            this.state.importedItems = null;
            this.importDone();
        }
    }

    /** Convert state change handler */
    onConvertStateChange(state) {
        this.setState({ ...this.state, convertState: state });
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

    renderDialogTitle(state, prevState) {
        if (
            state.id === prevState.id
            && state.convertState === prevState.convertState
        ) {
            return;
        }

        if (state.id === UPLOAD_STATE) {
            this.popup.setTitle(__('import.upload'));
            return;
        }
        if (state.id !== CONVERT_STATE) {
            return;
        }

        const backButton = Button.create({
            icon: 'back',
            className: BACK_BTN_CLASS,
            onClick: () => this.setUploadState(),
        });

        let title;
        if (state.convertState === TPL_SELECT_STATE) {
            title = __('import.convert');
        } else if (state.convertState === TPL_CREATE_STATE) {
            title = __('import.templates.create');
        } else if (state.convertState === TPL_UPDATE_STATE) {
            title = __('import.templates.update');
        }

        const titleElem = createElement('div', {
            props: {
                className: TPL_FORM_TITLE_CLASS,
                textContent: title,
            },
        });

        const convertTitle = createElement('div', {
            props: { className: CONVERT_TITLE_CLASS },
            children: [backButton.elem, titleElem],
        });

        this.popup.setTitle(convertTitle);
    }

    render(state, prevState) {
        if (state.loading) {
            this.uploadProgress.show();
        }

        this.renderDialogTitle(state, prevState);

        if (state.id !== prevState.id) {
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
        }

        if (!state.loading) {
            this.uploadProgress.hide();
        }
    }
}
