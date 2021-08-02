<?php

namespace JezveMoney\Core;

class Template
{
    protected $filename;

    public function __construct($filename)
    {
        $this->filename = $filename;
    }

    public function render($data = [])
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
