import { getClassNames } from '@jezvejs/dom';
import { DropDown } from 'jezvejs/DropDown';

import { __ } from '../../../../utils/utils.js';
import { App } from '../../../../Application/App.js';

import { Field } from '../../../Common/Field/Field.js';

/* CSS classes */
const FIELD_CLASS = 'horizontal-field';

/**
 * Locale select field component
 */
export class LocaleSelectField extends Field {
    constructor(props = {}) {
        const currentLocale = App.getCurrrentLocale();

        const localeSelect = DropDown.create({
            ...props,
            onChange: (locale) => (locale && App.setLocale(locale.id)),
            data: App.locales.map((locale) => ({
                id: locale,
                title: locale,
                selected: locale === currentLocale,
            })),
        });

        super({
            ...props,
            className: getClassNames(FIELD_CLASS, props.className),
            title: __('settings.language'),
            content: localeSelect.elem,
        });
    }
}
