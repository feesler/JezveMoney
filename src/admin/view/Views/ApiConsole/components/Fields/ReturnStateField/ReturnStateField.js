import { OptionalInputField } from '../OptionalInputField/OptionalInputField.js';

export class ReturnStateField extends OptionalInputField {
    constructor(props = {}) {
        super({
            ...props,
            title: 'Return state',
            name: 'returnState',
            className: 'form-row',
        });
    }
}
