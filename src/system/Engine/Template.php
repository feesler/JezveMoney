<?php

namespace JezveMoney\Core;

/**
 * Template class
 */
class Template
{
    protected $filename = null;

    public $action = null;
    public $actionParam = null;
    public $cssArr = [];
    public $jsArr = [];
    public $cssAdmin = [];
    public $jsAdmin = [];

    public $user_id = 0;
    public $user_name = null;
    public $adminUser = false;
    public $locale = [];

    public $userTheme = null;
    public $themes = [];
    public $themeColor = null;
    public $themeClass = null;

    /**
     * @param string $filename template file name
     */
    public function __construct(string $filename)
    {
        $this->filename = $filename;
    }

    /**
     * Renders template with specified data and returns result
     *
     * @param array $data
     *
     * @return string
     */
    public function render(array $data = [])
    {
        ob_start();

        foreach ($data as $__key => $__value) {
            ${$__key} = $__value;
        }
        unset($__key);
        unset($__value);

        include $this->filename;

        return ob_get_clean();
    }
}
