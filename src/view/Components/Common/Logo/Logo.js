import { createElement, getClassName } from '@jezvejs/dom';
import { Button } from 'jezvejs/Button';

import { App } from '../../../Application/App.js';

import './Logo.scss';

/* CSS classes */
const LOGO_CLASS = 'logo';

const defaultProps = {
    icon: 'header-logo',
    type: 'link',
    url: App.getURL(),
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
