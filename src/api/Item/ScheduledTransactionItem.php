<?php

namespace JezveMoney\App\Item;

use DateInterval;
use DateTime;
use DateTimeZone;
use JezveMoney\App\Model\IntervalOffsetModel;
use JezveMoney\App\Model\UserSettingsModel;

class ScheduledTransactionItem
{
    public $id = 0;
    public $user_id = 0;
    public $type = 0;
    public $src_id = 0;
    public $dest_id = 0;
    public $src_amount = 0;
    public $dest_amount = 0;
    public $src_curr = 0;
    public $dest_curr = 0;
    public $category_id = 0;
    public $comment = null;
    public $start_date = 0;
    public $end_date = null;
    public $interval_type = 0;
    public $interval_step = 0;
    public $interval_offset = [];
    public $createdate = 0;
    public $updatedate = 0;

    /**
     * Converts table row from database to ScheduledTransactionItem object
     *
     * @param array|null $row
     *
     * @return ScheduledTransactionItem|null
     */
    public static function fromTableRow(?array $row)
    {
        if (is_null($row)) {
            return null;
        }

        $res = new static();
        $res->id = intval($row["id"]);
        $res->user_id = intval($row["user_id"]);
        $res->src_id = intval($row["src_id"]);
        $res->dest_id = intval($row["dest_id"]);
        $res->type = intval($row["type"]);
        $res->src_amount = floatval($row["src_amount"]);
        $res->dest_amount = floatval($row["dest_amount"]);
        $res->src_curr = intval($row["src_curr"]);
        $res->dest_curr = intval($row["dest_curr"]);
        $res->category_id = intval($row["category_id"]);
        $res->comment = $row["comment"];
        $res->start_date = strtotime($row["start_date"]);
        $res->end_date = ($row["end_date"]) ? strtotime($row["end_date"]) : null;
        $res->interval_type = intval($row["interval_type"]);
        $res->interval_step = intval($row["interval_step"]);
        $res->createdate = strtotime($row["createdate"]);
        $res->updatedate = strtotime($row["updatedate"]);

        $res->loadIntervalOffsets();

        return $res;
    }

    /**
     * Sets interval offset property of item
     */
    public function loadIntervalOffsets()
    {
        $offsetsModel = IntervalOffsetModel::getInstance();
        $this->interval_offset = $offsetsModel->getOffsetsBySchedule($this->id);
    }

    /**
     * Returns timestamp for the beginning of interval for specified date
     *
     * @param int $timestamp
     *
     * @return int|null
     */
    public function getInterval(int $timestamp)
    {
        $dateInfo = getDateIntervalStart($timestamp, $this->interval_type);
        return $dateInfo["time"];
    }

    /**
     * Returns timestamp for first interval of scheduled transaction
     *
     * @return int|null
     */
    public function getFirstInterval()
    {
        return $this->getInterval($this->start_date);
    }

    /**
     * Returns timestamp for next interval of specified scheduled transaction
     *  or null in case no more intervals available
     *
     * @param int $timestamp
     *
     * @return int|null
     */
    public function getNextInterval(int $timestamp)
    {
        if (
            ($this->interval_type === INTERVAL_NONE)
            || ($this->interval_step === 0)
            || ($this->end_date && $this->end_date < $timestamp)
        ) {
            return null;
        }

        $res = getNextDateInterval($timestamp, $this->interval_type, $this->interval_step);
        if ($this->end_date && $this->end_date < $res) {
            return null;
        }

        return $res;
    }

    /**
     * Returns reminder timestamp for specified interval of scheduled transaction
     *
     * @param int $timestamp interval timestamp
     *
     * @return int[]
     */
    public function getReminderDates(int $timestamp)
    {
        $res = [];

        $offsets = asArray($this->interval_offset);
        if (count($offsets) === 0) {
            $offsets[] = getDateIntervalOffset($this->start_date, $this->interval_type);
        }

        foreach ($offsets as $offset) {
            $date = new DateTime("@" . $timestamp, new DateTimeZone('UTC'));

            if (
                $this->interval_type !== INTERVAL_NONE
                && $offset > 0
            ) {
                if ($this->interval_type === INTERVAL_WEEK) {
                    $offset = ($offset === 0) ? 6 : ($offset - 1);
                }

                $duration = "P" . $offset . "D";
                $date->add(new DateInterval($duration));
            }

            $res[] = $date->getTimestamp();
        }

        return $res;
    }

    /**
     * Returns array of reminder timestamps
     *
     * @param array $params options
     *
     * @return int[]
     */
    public function getReminders(array $params = [])
    {
        $limit = isset($params["limit"]) ? intval($params["limit"]) : 100;
        $startDate = isset($params["startDate"])
            ? intval($params["startDate"])
            : $this->start_date;

        $startDate = max(cutDate($startDate), $this->start_date);

        $itemEndDate = $this->end_date;
        if ($this->interval_type === INTERVAL_NONE) {
            $itemEndDate = $this->start_date;
        }

        $endDate = isset($params["endDate"])
            ? intval($params["endDate"])
            : ($this->end_date ?? cutDate(UserSettingsModel::clientTime()));

        if ($itemEndDate) {
            $endDate = min($itemEndDate, $endDate);
        }

        $res = [];
        $interval = $this->getInterval($startDate);

        while (
            $interval
            && ($limit === 0 || count($res) < $limit)
            && $interval <= $endDate
        ) {
            if ($interval >= $startDate) {
                $dates = $this->getReminderDates($interval);
                foreach ($dates as $date) {
                    if ($date <= $endDate) {
                        $res[] = $date;
                    }
                }
            }

            $interval = $this->getNextInterval($interval);
        }

        return $res;
    }
}
