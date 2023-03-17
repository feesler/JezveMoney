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

    /**
     * Initializes application resources
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
     * Initializes application resources
     *
     * @param string $viewName view name
     */
    protected function initResources(string $viewName)
    {
        $manifest = JSON::fromFile(VIEW_PATH . "manifest.json", true);
        if (!isset($manifest[$viewName])) {
            throw new \Error("Invalid view name");
        }

        $viewResources = $manifest[$viewName];
        foreach ($viewResources as $resource) {
            if (str_ends_with($resource, ".js")) {
                if (str_starts_with($resource, JS_PATH)) {
                    $resource = substr($resource, strlen(JS_PATH));
                    $this->jsArr[] = $resource;
                } elseif (str_starts_with($resource, ADMIN_JS_PATH)) {
                    $resource = substr($resource, strlen(ADMIN_JS_PATH));
                    $this->jsAdmin[] = $resource;
                }
            } elseif (str_ends_with($resource, ".css")) {
                if (str_starts_with($resource, CSS_PATH)) {
                    $resource = substr($resource, strlen(CSS_PATH));
                    $this->cssArr[] = $resource;
                } elseif (str_starts_with($resource, ADMIN_CSS_PATH)) {
                    $resource = substr($resource, strlen(ADMIN_CSS_PATH));
                    $this->cssAdmin[] = $resource;
                }
            } else {
                throw new \Error("Invalid type of resource");
            }
        }
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
