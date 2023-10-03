import { createElement, getClassName } from 'jezvejs';
import { Button } from 'jezvejs/Button';

import { getApplicationURL } from '../../../utils/utils.js';

import './Logo.scss';

/* CSS classes */
const LOGO_CLASS = 'logo';

const defaultProps = {
    icon: 'header-logo',
    type: 'link',
    url: getApplicationURL(),
};

/**
 * Application logo component
 */
export class Logo extends Button {
    constructor(props = {}) {
        const btnProps = {
            ...defaultProps,
            ...props,
            className: getClassName(LOGO_CLASS, props.className),
        };

        if (!btnProps.title) {
            btnProps.title = createElement('span', {
                props: { textContent: 'Jezve' },
                children: createElement('b', { props: { textContent: 'Money' } }),
            });
        }

        super(btnProps);
    }
}
