import {
    show,
    isFunction,
    Component,
    createElement,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { Checkbox } from 'jezvejs/Checkbox';
import { Input } from 'jezvejs/Input';
import { InputGroup } from 'jezvejs/InputGroup';

import { __, getApplicationURL } from '../../../../../utils/utils.js';
import { API } from '../../../../../API/index.js';
import { App } from '../../../../../Application/App.js';

/** CSS classes */
const SECTION_CLASS = 'upload-form__browser';
const FORM_CONTAINER_CLASS = 'upload-form__inner';
const FORM_CLASS = 'upload-form';
const FILE_BROWSER_CLASS = 'upload-form__file';
const FILE_BUTTON_CLASS = 'browse-btn';
const FORM_DESCR_CLASS = 'upload-form__descr';
const FILE_NAME_CLASS = 'upload-form__filename';
const OPTIONS_CONTAINER_CLASS = 'upload-form__options';

/**
 * ImportFileUploader component
 */
export class ImportFileUploader extends Component {
    constructor(...args) {
        super(...args);

        this.state = {
            filename: null,
            isEncoded: true,
            useServer: false,
        };

        this.init();
    }

    init() {
        const useServer = (App.isAdminUser() || App.isTesterUser());

        // Select file button
        this.fileButton = Button.create({
            className: FILE_BUTTON_CLASS,
            title: __('import.selectFile'),
        });

        this.inputElem = createElement('input', {
            props: { id: 'fileInp', type: 'file' },
            events: { change: () => this.onChangeUploadFile() },
        });

        this.fileBrowser = createElement('label', {
            props: { id: 'fileBrowser', className: FILE_BROWSER_CLASS },
            children: [
                this.inputElem,
                this.fileButton.elem,
            ],
        });

        // File name label
        this.filenameElem = createElement('div', {
            props: { className: FILE_NAME_CLASS },
        });

        // Upload file form
        this.formElem = createElement('form', {
            props: {
                id: 'fileimportfrm',
                className: FORM_CLASS,
                method: 'post',
                encoding: 'multipart/form-data',
                action: getApplicationURL('api/import/upload'),
            },
            children: [
                this.fileBrowser,
                createElement('div', {
                    props: {
                        className: FORM_DESCR_CLASS,
                        textContent: __('import.selectFileDescription'),
                    },
                }),
                this.filenameElem,
            ],
        });
        const formContent = [this.formElem];

        // Address on server input group
        if (useServer) {
            this.serverAddressInput = Input.create({
                id: 'serverAddress',
                className: 'input-group__input',
                onInput: () => this.onInputServerAddress(),
            });

            this.serverUploadBtn = Button.create({
                id: 'serverUploadBtn',
                className: 'submit-btn input-group__btn',
                title: __('import.upload'),
                onClick: () => this.uploadFromServer(),
            });

            this.serverAddressBlock = InputGroup.create({
                id: 'serverAddressBlock',
                children: [
                    this.serverAddressInput.elem,
                    this.serverUploadBtn.elem,
                ],
            });
            this.serverAddressBlock.hide();
            formContent.push(this.serverAddressBlock.elem);
        }

        this.formContainer = createElement('div', {
            props: { className: FORM_CONTAINER_CLASS },
            children: formContent,
        });

        // Encoding checkbox
        this.isEncodeCheck = Checkbox.create({
            id: 'isEncodeCheck',
            label: __('import.cp1251Encoding'),
            checked: true,
            onChange: (checked) => this.onCheckEncode(checked),
        });
        const optionsContent = [this.isEncodeCheck.elem];

        // 'Use address on server' checkbox
        if (useServer) {
            this.useServerCheck = Checkbox.create({
                id: 'useServerCheck',
                label: __('import.useServer'),
                onChange: (checked) => this.onCheckServer(checked),
            });
            optionsContent.push(this.useServerCheck.elem);
        }

        // Options container
        this.optionsContainer = createElement('div', {
            props: { className: OPTIONS_CONTAINER_CLASS },
            children: optionsContent,
        });

        this.elem = createElement('section', {
            props: { id: 'fileBlock', className: SECTION_CLASS },
            children: [
                this.formContainer,
                this.optionsContainer,
            ],
        });
    }

    onCheckEncode(checked) {
        if (this.state.isEncoded === checked) {
            return;
        }

        this.state.isEncoded = checked;
        this.render(this.state);
    }

    /**
     * File input 'change' event handler
     * Update displayng file name and show control of form
     */
    onChangeUploadFile() {
        this.setFile(this.inputElem.files[0]);
    }

    /** Set upload file */
    setFile(file) {
        if (!file) {
            return;
        }

        this.state.filename = file.name;
        this.render(this.state);

        this.uploadFile(file);
    }

    /** Reset file upload form */
    reset() {
        this.formElem.reset();
        this.state = {
            ...this.state,
            filename: null,
        };
        this.render(this.state);
    }

    /**
     * Import data request callback
     * @param {string} response - data for import request
     */
    onImportSuccess(data) {
        try {
            if (!Array.isArray(data)) {
                throw new Error(__('import.uploadError'));
            }

            if (isFunction(this.props.onUploaded)) {
                this.props.onUploaded(data, this.state.filename);
            }
        } catch (e) {
            this.onImportError(e.message);
        }
    }

    /** Import error callback */
    onImportError(message) {
        this.reset();

        if (isFunction(this.props.onUploadError)) {
            this.props.onUploadError(message);
        }
    }

    /** Upload file to server */
    async uploadFile(file) {
        if (!file) {
            return;
        }

        const { isEncoded } = this.state;
        const fileType = file.name.substring(file.name.lastIndexOf('.') + 1);
        const data = new FormData();
        data.append('file', file);

        this.sendUploadRequest(data, {
            'X-File-Type': fileType,
            'X-File-Tpl': 0,
            'X-File-Encode': isEncoded ? 1 : 0,
        });
    }

    /** Use server checkbox 'change' event handler */
    onCheckServer(useServer) {
        this.setUseServerAddress(useServer);
    }

    onInputServerAddress() {
        this.state.filename = this.serverAddressInput.value;
        this.render(this.state);
    }

    setUseServerAddress(value) {
        if (this.state.useServer === value) {
            return;
        }
        this.state.useServer = value;
        this.render(this.state);
    }

    /** Send file upload request using address on server */
    async uploadFromServer() {
        const { useServer, isEncoded } = this.state;
        if (!useServer) {
            return;
        }

        const { filename } = this.state;
        if (!filename?.length) {
            return;
        }

        const reqParams = {
            filename,
            template: 0,
            encode: isEncoded ? 1 : 0,
        };

        this.sendUploadRequest(reqParams);
    }

    async sendUploadRequest(data, headers = {}) {
        if (isFunction(this.props.onUploadStart)) {
            this.props.onUploadStart();
        }

        try {
            const result = await API.import.upload(data, { headers });
            this.onImportSuccess(result.data);
        } catch (e) {
            this.onImportError(e.message);
        }
    }

    /** Render component */
    render(state) {
        this.filenameElem.textContent = state.filename ?? '';

        if (this.useServerCheck) {
            this.useServerCheck.check(state.useServer);

            this.serverAddressBlock.show(state.useServer);
            show(this.formElem, !state.useServer);
            this.serverAddressInput.value = (state.useServer) ? state.filename : '';
        }
    }
}
