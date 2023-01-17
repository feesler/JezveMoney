<?php

namespace JezveMoney\Core;

/**
 * Controllers router class
 */
class Router
{
    protected $routeNamespace = "";
    protected $routes = [];
    protected $aliasMap = [];
    protected $actionsMap = [];
    protected $onStartHandler = null;
    protected $onBeforeActionHandler = null;
    protected $onAfterActionHandler = null;

    /**
     * Sets controllers namespace
     *
     * @param string $namespace
     */
    public function setNamespace(string $namespace)
    {
        if (is_string($namespace)) {
            $this->routeNamespace = $namespace;
        }
    }

    /**
     * Sets routes map
     *
     * @param array $map
     */
    public function setRoutes(array $map)
    {
        if (is_array($map)) {
            $this->routes = $map;
        }
    }

    /**
     * Sets route aliases
     *
     * @param array $map
     */
    public function setAliases(array $map)
    {
        if (is_array($map)) {
            $this->aliasMap = $map;
        }
    }

    /**
     * Sets actions map
     *
     * @param array $map
     */
    public function setActionsMap(array $map)
    {
        if (is_array($map)) {
            $this->actionsMap = $map;
        }
    }

    /**
     * Sets 'controller initialization' callback
     *
     * @param callable $handler
     */
    public function onStart(callable $handler)
    {
        if (is_callable($handler)) {
            $this->onStartHandler = $handler;
        }
    }

    /**
     * Sets 'before action' callback
     *
     * @param callable $handler
     */
    public function onBeforeAction(callable $handler)
    {
        if (is_callable($handler)) {
            $this->onBeforeActionHandler = $handler;
        }
    }

    /**
     * Sets 'after action' callback
     *
     * @param callable $handler
     */
    public function onAfterAction(callable $handler)
    {
        if (is_callable($handler)) {
            $this->onAfterActionHandler = $handler;
        }
    }

    /**
     * Handles routes
     */
    public function route()
    {
        $controller = null;
        $action = null;

        // Parse route
        $route = (isset($_GET["route"])) ? $_GET["route"] : "";

        $route = trim($route, "/\\");
        $routeParts = explode("/", $route);

        // Prepare controller
        $contrStr = array_shift($routeParts);
        if (!$contrStr) {
            $contrStr = "main";
        }

        // Check aliases
        if (isset($this->aliasMap[$contrStr])) {
            $aliasReplace = $this->aliasMap[$contrStr];
            wlog("Found alias for " . $contrStr . " : " . $aliasReplace);

            $unshiftParts = array_reverse(explode("/", $aliasReplace));
            foreach ($unshiftParts as $uPart) {
                array_unshift($routeParts, $uPart);
            }
            wlog("Rewrite route as: " . implode("/", $routeParts));

            $contrStr = array_shift($routeParts);
        }

        if (!isset($this->routes[$contrStr])) {
            setLocation(BASEURL);
        }

        $contClass = $this->routeNamespace . "\\" . $this->routes[$contrStr];

        $controller = new $contClass();

        if (is_callable($this->onStartHandler)) {
            call_user_func_array($this->onStartHandler, [$controller, $contrStr, $routeParts]);
        }

        // Prepare action
        $action = array_shift($routeParts);
        if (!$action) {
            $action = "index";
        }

        // Rewrite action if needed
        if (isset($this->actionsMap[$action])) {
            $action = $this->actionsMap[$action];
        }

        $actionParam = null;
        if (!method_exists($controller, $action)) {
            $actionParam = $action;
            $action = "index";
        }

        $controller->action = $action;

        if (is_null($actionParam)) {
            $actionParam = array_shift($routeParts);
        }
        $controller->actionParam = $actionParam;

        if (is_callable($this->onBeforeActionHandler)) {
            call_user_func_array($this->onBeforeActionHandler, [$controller, $contrStr, $action, $routeParts]);
        }

        $controller->runAction($action);

        if (is_callable($this->onAfterActionHandler)) {
            call_user_func_array($this->onAfterActionHandler, [$controller, $contrStr, $action, $routeParts]);
        }
    }
}
