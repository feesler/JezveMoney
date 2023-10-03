import { Component, createElement, isFunction } from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { Popup } from 'jezvejs/Popup';

// Application
import { App } from '../../../Application/App.js';
import { __, getExportURL } from '../../../utils/utils.js';

// Common components
import { Field } from '../../Common/Field/Field.js';
import { DateFormatSelect } from '../../Form/Inputs/Date/DateFormatSelect/DateFormatSelect.js';
import { NumberFormatSelect } from '../../Form/Inputs/NumberFormatSelect/NumberFormatSelect.js';

// Local components
import { ExportFileFormatSelect } from './components/ExportFileFormatSelect/ExportFileFormatSelect.js';

import './ExportDialog.scss';

/* CSS classes */
const DIALOG_CLASS = 'export-dialog';
const FILE_FORMAT_SELECT_CLASS = 'file-format-select';
const DATE_LOCALE_SELECT_CLASS = 'date-locale-select';
const NUMBER_LOCALE_SELECT_CLASS = 'number-locale-select';
const DOWNLOAD_BUTTON_CLASS = 'link-btn download-btn';
const FIELD_CLASS = 'horizontal-field form-row';

const defaultProps = {
    filter: {},
    fileFormat: 'csv',
    dateLocale: App.dateFormatLocale,
    numberLocale: App.decimalFormatLocale,
    onDownload: null,
    onCancel: null,
};

/**
 * Export settings dialog component
 */
export class ExportDialog extends Component {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        this.state = {
            ...this.props,
        };

        this.init();
        this.render(this.state);
    }

    init() {
        // Content
        // File format
        this.fileFormatSelect = ExportFileFormatSelect.create({
            className: FILE_FORMAT_SELECT_CLASS,
            onItemSelect: (sel) => this.onFileFormatSelect(sel),
        });
        const fileFormatField = Field.create({
            className: FIELD_CLASS,
            title: __('export.fileFormat'),
            content: this.fileFormatSelect.elem,
        });

        // Date format
        this.dateLocaleSelect = DateFormatSelect.create({
            className: DATE_LOCALE_SELECT_CLASS,
            onItemSelect: (sel) => this.onDateFormatSelect(sel),
        });
        const dateLocaleField = Field.create({
            className: FIELD_CLASS,
            title: __('export.dateLocale'),
            content: this.dateLocaleSelect.elem,
        });

        // Numbers format
        this.numberLocaleSelect = NumberFormatSelect.create({
            className: NUMBER_LOCALE_SELECT_CLASS,
            onItemSelect: (sel) => this.onNumberFormatSelect(sel),
        });
        const numberLocaleField = Field.create({
            className: FIELD_CLASS,
            title: __('export.numberLocale'),
            content: this.numberLocaleSelect.elem,
        });

        // Footer
        // Download button
        this.downloadButton = Button.create({
            type: 'link',
            className: DOWNLOAD_BUTTON_CLASS,
            title: __('export.download'),
            onClick: (e) => this.onDownload(e),
        });

        this.dialog = Popup.create({
            id: this.props.id,
            title: __('export.dialogTitle'),
            className: DIALOG_CLASS,
            closeButton: true,
            content: [
                fileFormatField.elem,
                createElement('hr', { props: { className: 'form-separator' } }),
                dateLocaleField.elem,
                numberLocaleField.elem,
            ],
            footer: this.downloadButton.elem,
            onClose: () => this.onCancel(),
        });
        if (!this.dialog) {
            throw new Error('Failed to create dialog');
        }

        this.elem = this.dialog.elem;
    }

    reset() {
        this.setState({
            ...this.props,
        });
    }

    show(value = true) {
        this.dialog.show(value);
    }

    hide() {
        this.dialog.hide();
        this.reset();
    }

    setFilter(filter) {
        this.setState({ ...this.state, filter });
    }

    onDownload(e) {
        if (isFunction(this.props.onDownload)) {
            this.props.onDownload(e);
        }
    }

    onCancel() {
        if (isFunction(this.props.onCancel)) {
            this.props.onCancel();
        }
    }

    onFileFormatSelect({ id }) {
        this.setState({ ...this.state, fileFormat: id });
    }

    onDateFormatSelect({ id }) {
        this.setState({ ...this.state, dateLocale: id });
    }

    onNumberFormatSelect({ id }) {
        this.setState({ ...this.state, numberLocale: id });
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.fileFormatSelect.setSelection(state.fileFormat);
        this.dateLocaleSelect.setSelection(state.dateLocale);
        this.numberLocaleSelect.setSelection(state.numberLocale);

        const url = getExportURL({
            ...(state.filter ?? {}),
            fileFormat: state.fileFormat,
            dateLocale: state.dateLocale,
            numberLocale: state.numberLocale,
        });
        this.downloadButton.setURL(url.toString());
    }
}
