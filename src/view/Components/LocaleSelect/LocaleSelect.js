import { DropDown } from 'jezvejs/DropDown';

/**
 * Locale DropDown component
 */
export class LocaleSelect extends DropDown {
    constructor(props = {}) {
        const currentLocale = window.app.getCurrrentLocale();

        super({
            ...props,
            onChange: (locale) => (locale && window.app.setLocale(locale.id)),
            data: window.app.locales.map((locale) => ({
                id: locale,
                title: locale,
                selected: locale === currentLocale,
            })),
        });
    }
}
