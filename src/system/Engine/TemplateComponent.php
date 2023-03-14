<?php

namespace JezveMoney\Core;

use JezveMoney\Core\Template;

/**
 * Base template component class
 */
abstract class TemplateComponent
{
    protected static $template = null;
    protected static $filename = null;

    /**
     * Renders component with specified data
     *
     * @param array $data array of variables for component
     *
     * @return string
     */
    public static function render(array $data)
    {
        return self::renderTemplate($data);
    }

    /**
     * Renders template with specified data
     *
     * @param array $data array of variables for template
     *
     * @return string
     */
    protected static function renderTemplate(array $data)
    {
        if (!static::$template) {
            static::$template = new Template(TPL_PATH . "Component/" . static::$filename);
        }

        return static::$template->render($data);
    }
}
