<?php

const DAYS_IN_WEEK = 7;
const MONTHS_IN_YEAR = 12;
const WEEKS_IN_YEAR = 52;
const MAX_DAYS_IN_MONTH = 31;
const MAX_DAYS_IN_YEAR = 366;

const DATE_FORMAT_PATTERNS = [
    "ru" => "dd.MM.yyyy",
    "lt" => "yyyy-MM-dd",
    "fr" => "dd/MM/yyyy",
    "ar" => "dyyyy/M/",
    "es" => "d/M/yy",
    "zh" => "yyyy/M/d",
    "hr" => "dd. MM. yyyy.",
    "uk" => "dd.MM.yy",
    "nl" => "dd-MM-yyyy",
    "en" => "M/d/yy",
    "fi" => "d.M.yyyy",
    "hu" => "yyyy. MM. dd.",
    "it" => "dd/MM/yy",
    "ja" => "yyyy/MM/dd",
    "ko" => "yy. MM. dd.",
    "ms" => "d/MM/yy",
    "pl" => "d.MM.yyyy",
    "sr" => "d.MM.yy.",
    "sk" => "d. MM. yyyy.",
    "sl" => "d. MM. yy",
    "te" => "dd-MM-yy",
];

// Date interval types
define("INTERVAL_NONE", 0);
define("INTERVAL_DAY", 1);
define("INTERVAL_WEEK", 2);
define("INTERVAL_MONTH", 3);
define("INTERVAL_YEAR", 4);

const INTERVAL_DURATION_MAP = [
    INTERVAL_DAY => "D",
    INTERVAL_WEEK => "W",
    INTERVAL_MONTH => "M",
    INTERVAL_YEAR => "Y",
];

const INTERVAL_DAYS_MAP = [
    INTERVAL_NONE => 0,
    INTERVAL_DAY => 1,
    INTERVAL_WEEK => 7,
    INTERVAL_MONTH => 30,
    INTERVAL_YEAR => 365,
];

/**
 * Returns date format string for specified locale
 *
 * @param string $locale
 *
 * @return string
 */
function getDateFormatPattern(string $locale)
{
    return DATE_FORMAT_PATTERNS[strtolower($locale)] ?? DATE_FORMAT_PATTERNS[DEFAULT_DATE_LOCALE];
}

/**
 * Returns timestamp for the start of day
 *
 * @param int|DateTime|null $value timestamp or DateTime object to process
 *
 * @return int
 */
function cutDate(mixed $value)
{
    $timestamp = null;
    if ($value instanceof DateTime) {
        $timestamp = $value->getTimestamp();
    } elseif (is_int($value)) {
        $timestamp = $value;
    } else {
        throw new \Error("Invalid value");
    }

    $date = new DateTime("@" . $timestamp, new DateTimeZone('UTC'));
    $date->setTime(0, 0);

    return $date->getTimestamp();
}

/**
 * Returns fixed year for week number
 *
 * @param mixed $info
 *
 * @return int
 */
function getFixedWeekYear(mixed $info)
{
    $fixedYear = $info["year"];
    if ($info["mon"] === 1 && $info["week"] >= WEEKS_IN_YEAR - 2) {
        $fixedYear--;
    } elseif ($info["mon"] === MONTHS_IN_YEAR && $info["week"] === 1) {
        $fixedYear++;
    }

    return $fixedYear;
}

/**
 * Returns date info for specified timestamp and group type
 *
 * @param int $time timestamp
 * @param int $intervalType date interval type
 *
 * @return array
 */
function getDateInfo(int $time, int $intervalType)
{
    $info = getdate($time);
    $info["week"] = intval(date("W", $time));
    $info["wday"] = ($info["wday"] === 0) ? 6 : ($info["wday"] - 1);
    $res = [
        "time" => $time,
        "info" => $info,
    ];

    if ($intervalType === INTERVAL_DAY) {
        $res["id"] = $info["mday"] . "." . $info["mon"] . "." . $info["year"];
    } elseif ($intervalType === INTERVAL_WEEK) {
        $fixedYear = getFixedWeekYear($info);
        $res["id"] = $info["week"] . "." . $fixedYear;
    } elseif ($intervalType === INTERVAL_MONTH) {
        $res["id"] = $info["mon"] . "." . $info["year"];
    } elseif ($intervalType === INTERVAL_YEAR) {
        $res["id"] = $info["year"];
    }

    return $res;
}

/**
 * Returns difference between dates for specified interval type
 *
 * @param mixed $itemA
 * @param mixed $itemB
 * @param int $intervalType date interval type
 *
 * @return int
 */
function getDateDiff(mixed $itemA, mixed $itemB, int $intervalType)
{
    $itemA = $itemA ?? 0;
    $itemB = $itemB ?? 0;

    $itemA = is_int($itemA) ? getDateInfo($itemA, $intervalType) : $itemA;
    $itemB = is_int($itemB) ? getDateInfo($itemB, $intervalType) : $itemB;

    if (!is_array($itemA) || !is_array($itemB)) {
        throw new \Error("Invalid parameters");
    }

    if ($intervalType == INTERVAL_DAY) {
        $timeA = new DateTime("@" . $itemA["time"], new DateTimeZone('UTC'));
        $timeB = new DateTime("@" . $itemB["time"], new DateTimeZone('UTC'));

        $timeDiff = $timeA->diff($timeB, true);

        return $timeDiff->days;
    }

    if ($intervalType == INTERVAL_WEEK) {
        $yearA = getFixedWeekYear($itemA["info"]);
        $yearB = getFixedWeekYear($itemB["info"]);
        $weekA = $itemA["info"]["week"];
        $weekB = $itemB["info"]["week"];

        return (
            ($yearB - $yearA) * WEEKS_IN_YEAR
            + ($weekB - $weekA)
        );
    }

    if ($intervalType == INTERVAL_MONTH) {
        return (
            ($itemB["info"]["year"] - $itemA["info"]["year"]) * MONTHS_IN_YEAR
            + ($itemB["info"]["mon"] - $itemA["info"]["mon"])
        );
    }

    if ($intervalType == INTERVAL_YEAR) {
        return $itemB["info"]["year"] - $itemA["info"]["year"];
    }

    throw new \Error("Invalid date interval type");
}

/**
 * Returns date info object for start of specified interval type
 *
 * @param mixed $dateInfo timestamp or date info object
 * @param int $intervalType date interval type
 *
 * @return array
 */
function getDateIntervalStart(mixed $dateInfo, int $intervalType)
{
    if ($intervalType !== INTERVAL_NONE && !isset(INTERVAL_DURATION_MAP[$intervalType])) {
        throw new \Error("Invalid interval type");
    }

    $dateInfo = is_int($dateInfo) ? getDateInfo($dateInfo, $intervalType) : $dateInfo;

    $date = new DateTime("@" . $dateInfo["time"], new DateTimeZone('UTC'));
    $info = $dateInfo["info"];
    $date->setTime(0, 0);

    if ($intervalType === INTERVAL_WEEK) {
        $date->sub(new DateInterval("P" . $info["wday"] . "D"));
    }

    if ($intervalType === INTERVAL_MONTH) {
        $date->setDate($info["year"], $info["mon"], 1);
    }

    if ($intervalType === INTERVAL_YEAR) {
        $date->setDate($info["year"], 1, 1);
    }

    $timestamp = $date->getTimestamp();
    return getDateInfo($timestamp, $intervalType);
}

/**
 * Returns date offset inside of specified interval type
 *
 * @param mixed $dateInfo timestamp or date info object
 * @param int $intervalType date interval type
 *
 * @return int
 */
function getDateIntervalOffset(mixed $dateInfo, int $intervalType)
{
    if ($intervalType !== INTERVAL_NONE && !isset(INTERVAL_DURATION_MAP[$intervalType])) {
        throw new \Error("Invalid interval type");
    }

    $dateInfo = is_int($dateInfo) ? getDateInfo($dateInfo, $intervalType) : $dateInfo;
    $info = $dateInfo["info"];

    if ($intervalType === INTERVAL_WEEK) {
        return $info["wday"];
    }

    if ($intervalType === INTERVAL_MONTH) {
        return $info["mday"];
    }

    if ($intervalType === INTERVAL_YEAR) {
        return ($info["mon"] * 100) + $info["mday"];
    }

    return 0;
}

/**
 * Increases timestamp up to next interval and returns result
 *  or null in case invalid data
 *
 * @param int|null $timestamp timestamp to find next date interval for
 * @param int $intervalType type of interval
 * @param int $step count of intervals to add
 *
 * @return int
 */
function stepInterval(?int $timestamp, int $intervalType, int $step = 1)
{
    if (!$timestamp) {
        throw new \Error("Invalid timestamp");
    }
    if ($intervalType === INTERVAL_NONE) {
        return $timestamp;
    }
    if (!isset(INTERVAL_DURATION_MAP[$intervalType])) {
        throw new \Error("Invalid interval type");
    }
    if ($step < 0) {
        throw new \Error("Invalid interval step");
    }

    $date = new DateTime("@" . $timestamp, new DateTimeZone('UTC'));
    $date->setTime(0, 0);

    if ($step === 0) {
        return $date->getTimestamp();
    }

    if ($intervalType === INTERVAL_MONTH) {
        $dateInfo = getdate($date->getTimestamp());
        $maxDate = mktime(0, 0, 0, $dateInfo["mon"] + $step + 1, 0, $dateInfo["year"]);
        $res = mktime(0, 0, 0, $dateInfo["mon"] + $step, 1, $dateInfo["year"]);
        return min($res, $maxDate);
    }

    $duration = "P" . $step . INTERVAL_DURATION_MAP[$intervalType];
    $date->add(new DateInterval($duration));
    return $date->getTimestamp();
}

/**
 * Returns timestamp for the start next interval of specified type
 *  or null in case invalid data
 *
 * @param int|null $timestamp timestamp to find next date interval for
 * @param int $intervalType type of interval
 * @param int $step count of intervals to add
 *
 * @return int|null
 */
function getNextDateInterval(?int $timestamp, int $intervalType, int $step = 1)
{
    $res = stepInterval($timestamp, $intervalType, $step);
    if (!$res) {
        return null;
    }

    $dateInfo = getDateIntervalStart($res, $intervalType);
    return $dateInfo["time"];
}

/**
 * Returns count of days for specified interval type and step
 *
 * @param int $intervalType interval type
 * @param int $step interval step
 *
 * @return int
 */
function getIntervalDays(int $intervalType, int $step = 1)
{
    if (!isset(INTERVAL_DAYS_MAP[$intervalType])) {
        throw new \Error("Invalid interval type");
    }
    if ($step < 1) {
        return 0;
    }

    return INTERVAL_DAYS_MAP[$intervalType] * $step;
}
