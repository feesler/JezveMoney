<?php

namespace JezveMoney\App\Item;

use DateInterval;
use DateTime;
use DateTimeZone;

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
    public $interval_offset = 0;
    public $createdate = 0;
    public $updatedate = 0;

    private static $durationMap = [
        INTERVAL_DAY => "D",
        INTERVAL_WEEK => "W",
        INTERVAL_MONTH => "M",
        INTERVAL_YEAR => "Y",
    ];

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
        $res->interval_offset = intval($row["interval_offset"]);
        $res->createdate = strtotime($row["createdate"]);
        $res->updatedate = strtotime($row["updatedate"]);

        return $res;
    }

    /**
     * Returns timestamp for first interval of specified scheduled transaction
     *
     * @return int|null
     */
    public function getFirstInterval()
    {
        $dateInfo = getDateIntervalStart($this->start_date, $this->interval_type);
        return $dateInfo["time"];
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

        $date = new DateTime("@" . $timestamp, new DateTimeZone('UTC'));
        $date->setTime(0, 0);

        if ($this->interval_type === INTERVAL_MONTH) {
            $maxDate = new DateTime("@" . $timestamp, new DateTimeZone('UTC'));
            $maxDate->setTime(0, 0);
            $maxDate->modify("last day of next month");

            $dateInfo = getdate($date->getTimestamp());
            $res = mktime(0, 0, 0, $dateInfo["mon"] + $this->interval_step, 1, $dateInfo["year"]);
            $res = min($res, $maxDate->getTimestamp());
        } else {
            $duration = "P" . $this->interval_step . self::$durationMap[$this->interval_type];
            $date->add(new DateInterval($duration));
            $res = $date->getTimestamp();
        }

        if ($this->end_date && $this->end_date < $res) {
            return null;
        }

        $dateInfo = getDateIntervalStart($res, $this->interval_type);
        return $dateInfo["time"];
    }

    /**
     * Returns reminder timestamp for for specified interval of scheduled transaction
     *
     * @param int $timestamp interval timestamp
     *
     * @return int|null
     */
    public function getReminderDate(int $timestamp)
    {
        $date = new DateTime("@" . $timestamp, new DateTimeZone('UTC'));
        $offset = $this->interval_offset;

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

        return $date->getTimestamp();
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
        $endDate = isset($params["endDate"]) ? intval($params["endDate"]) : time();

        $res = [];
        $interval = $this->getFirstInterval();
        while (
            $interval
            && ($limit === 0 || count($res) < $limit)
            && $interval <= $endDate
        ) {
            if ($interval >= $this->start_date) {
                $date = $this->getReminderDate($interval);
                if ($date > $endDate) {
                    break;
                }

                $res[] = $date;
            }

            $interval = $this->getNextInterval($interval);
        }

        return $res;
    }
}
