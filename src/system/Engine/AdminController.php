<?php

namespace JezveMoney\Core;

abstract class AdminController extends TemplateController
{
    protected $cssAdmin = [];
    protected $jsAdmin = [];
    protected $jsAdminModule = [];
    protected $themesPath = "admin/view/css/themes/";

    public function initDefResources()
    {
        $this->cssArr = [];
        $this->cssAdmin = [];
        $this->jsArr = [
            "polyfill/index.js",
        ];
        $this->jsAdmin = [];
    }


    protected function render($data = [])
    {
        $this->template->cssAdmin = (array)$this->cssAdmin;
        $this->template->jsAdmin = (array)$this->jsAdmin;

        parent::render($data);
    }
}
