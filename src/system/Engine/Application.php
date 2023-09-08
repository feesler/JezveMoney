<?php

namespace JezveMoney\Core;

use JezveMoney\App\Model\ScheduledTransactionModel;

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

    /**
     * Updates reminders for scheduled transactions
     */
    public function updateReminders()
    {
        $scheduleModel = ScheduledTransactionModel::getInstance();
        $scheduleModel->updateAllReminders();
    }
}
