<?php

namespace JezveMoney\Core;

/**
 * Template class
 */
class Template
{
    protected $filename;

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
