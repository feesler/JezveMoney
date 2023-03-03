<?php

namespace JezveMoney\Core;

/**
 * Application class
 */
class Application
{
    use Singleton;

    public function getVersion()
    {
        return \Composer\InstalledVersions::getVersion("henryfeesler/jezvemoney");
    }
}
