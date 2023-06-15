import { getClassNames } from 'jezvejs';
import { DropDown } from 'jezvejs/DropDown';

import { __ } from '../../utils/utils.js';
import { Field } from '../Field/Field.js';

/* CSS classes */
const FIELD_CLASS = 'horizontal-field';

/**
 * Locale select field component
 */
export class LocaleSelectField extends Field {
    constructor(props = {}) {
        const currentLocale = window.app.getCurrrentLocale();

        const localeSelect = DropDown.create({
            ...props,
            onChange: (locale) => (locale && window.app.setLocale(locale.id)),
            data: window.app.locales.map((locale) => ({
                id: locale,
                title: locale,
                selected: locale === currentLocale,
            })),
        });

        super({
            ...props,
            className: getClassNames(FIELD_CLASS, props.className),
            title: __('LANGUAGE'),
            content: localeSelect.elem,
        });
    }
}
