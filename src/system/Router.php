<?php

namespace JezveMoney\Core;

class Router
{
    protected $routeNamespace = "";
    protected $routes = [];
    protected $aliasMap = [];
    protected $actionsMap = [];
    protected $onStartHandler = null;
    protected $onBeforeActionHandler = null;
    protected $onAfterActionHandler = null;


    public function setNamespace($namespace)
    {
        if (is_string($namespace)) {
            $this->routeNamespace = $namespace;
        }
    }


    public function setRoutes($map)
    {
        if (is_array($map)) {
            $this->routes = $map;
        }
    }


    public function setAliases($map)
    {
        if (is_array($map)) {
            $this->aliasMap = $map;
        }
    }


    public function setActionsMap($map)
    {
        if (is_array($map)) {
            $this->actionsMap = $map;
        }
    }


    public function onStart($handler)
    {
        if (is_callable($handler)) {
            $this->onStartHandler = $handler;
        }
    }


    public function onBeforeAction($handler)
    {
        if (is_callable($handler)) {
            $this->onBeforeActionHandler = $handler;
        }
    }


    public function onAfterAction($handler)
    {
        if (is_callable($handler)) {
            $this->onAfterActionHandler = $handler;
        }
    }


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

        if (method_exists($controller, $action)) {
            $controller->$action();
        }

        if (is_callable($this->onAfterActionHandler)) {
            call_user_func_array($this->onAfterActionHandler, [$controller, $contrStr, $action, $routeParts]);
        }
    }
}
