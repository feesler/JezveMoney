<?php

namespace JezveMoney\Core;

/**
 * Base admin controller class
 */
abstract class AdminController extends TemplateController
{
    protected $cssAdmin = [];
    protected $jsAdmin = [];
    protected $jsAdminModule = [];
    protected $themesPath = "admin/view/css/themes/";

    /**
     * Initialize application resources
     */
    public function initDefResources()
    {
        $this->setupLocales();

        $this->cssArr = [];
        $this->cssAdmin = [];
        $this->jsArr = [
            "polyfill/index.js",
            "locale/" . $this->locale . ".js",
        ];
        $this->jsAdmin = [];
    }

    /**
     * Renders template with specified data
     *
     * @param array $data
     */
    protected function render(array $data = [])
    {
        $this->template->cssAdmin = (array)$this->cssAdmin;
        $this->template->jsAdmin = (array)$this->jsAdmin;

        parent::render($data);
    }
}
