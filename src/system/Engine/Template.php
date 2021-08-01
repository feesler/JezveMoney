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

        foreach ($data as $key => $value) {
            ${$key} = $value;
        }

        include $this->filename;

        return ob_get_clean();
    }
}
