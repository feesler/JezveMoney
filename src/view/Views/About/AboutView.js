import 'jezvejs/style';
import { createElement } from '@jezvejs/dom';

// Application
import { App } from '../../Application/App.js';
import '../../Application/Application.scss';
import { __ } from '../../utils/utils.js';

// Common components
import { Logo } from '../../Components/Common/Logo/Logo.js';
import { AppView } from '../../Components/Layout/AppView/AppView.js';

import { createParagraph } from './helpers.js';
import './AboutView.scss';

/* CSS classes */
const LOGO_CLASS = 'about-logo';
const LOGO_CONTAINER_CLASS = 'logo-container';
const DESCR_CONTAINER_CLASS = 'descr-container';

/**
 * About view
 */
class AboutView extends AppView {
    /**
     * View initialization
     */
    onStart() {
        this.loadElementsByIds([
            'contentContainer',
        ]);

        // Logo
        const logo = Logo.create({
            className: LOGO_CLASS,
            icon: 'logo_u',
            type: 'static',
        });
        const logoContainer = createElement('div', {
            props: { className: LOGO_CONTAINER_CLASS },
            children: logo.elem,
        });
        this.contentContainer.prepend(logoContainer);

        // Description
        const descrContainer = createElement('div', {
            props: {
                className: DESCR_CONTAINER_CLASS,
            },
            children: [
                createParagraph(__('about.description')),
                createParagraph(__('about.evolution')),
            ],
        });
        this.contentContainer.append(descrContainer);
    }
}

App.createView(AboutView);
