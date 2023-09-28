import { DropDown } from 'jezvejs/DropDown';

const exportFileFormats = [
    { id: 'csv', title: 'CSV' },
    { id: 'xlsx', title: 'Excel' },
];

/**
 * Export file format DropDown component
 */
export class ExportFileFormatSelect extends DropDown {
    constructor(props = {}) {
        super({
            ...props,
            data: exportFileFormats,
        });
    }
}
