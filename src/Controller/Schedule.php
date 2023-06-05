<?php

namespace JezveMoney\App\Controller;

use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\CategoryModel;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\IconModel;
use JezveMoney\App\Model\ScheduledTransactionModel;
use JezveMoney\App\Model\TransactionModel;
use JezveMoney\App\Model\UserCurrencyModel;
use JezveMoney\Core\ListViewController;
use JezveMoney\Core\Template;
use JezveMoney\Core\Message;

/**
 * Schedule controller
 */
class Schedule extends ListViewController
{
    protected $accModel = null;
    protected $currModel = null;
    protected $userCurrModel = null;
    protected $catModel = null;

    /**
     * Controller initialization
     */
    protected function onStart()
    {
        $this->model = ScheduledTransactionModel::getInstance();
        $this->accModel = AccountModel::getInstance();
        $this->currModel = CurrencyModel::getInstance();
        $this->userCurrModel = UserCurrencyModel::getInstance();
        $this->catModel = CategoryModel::getInstance();
        TransactionModel::getInstance();
    }

    /**
     * /schedule/ route handler
     * Renders schedule list view
     */
    public function index()
    {
        $this->template = new Template(VIEW_TPL_PATH . "Schedule.tpl");
        $data = [
            "titleString" => __("APP_NAME") . " | " . __("SCHEDULE"),
        ];

        $pagination = [
            "onPage" => 10,
            "page" => 1,
            "pagesCount" => 1,
            "total" => 0,
        ];
        $requestDefaults = [
            "onPage" => 10,
            "desc" => true
        ];

        $request = $this->model->getRequestFilters($_GET, $requestDefaults);

        // Obtain requested view mode
        $showDetails = false;
        if (isset($_GET["mode"]) && $_GET["mode"] == "details") {
            $showDetails = true;
        }

        $itemsCount = $this->model->getCount();
        $pagination["total"] = $itemsCount;

        // Build data for paginator
        if ($request["onPage"] > 0) {
            $pageCount = ceil($itemsCount / $request["onPage"]);
            $pagination["pagesCount"] = $pageCount;
            $page_num = isset($request["page"]) ? intval($request["page"]) : 0;
            $pagination["page"] = $page_num + 1;
        }

        $detailsId = $this->getRequestedItem();

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $this->accModel->getData(["owner" => "all", "visibility" => "all"]),
            "persons" => $this->personMod->getData(["visibility" => "all"]),
            "currency" => $this->currModel->getData(),
            "categories" => $this->catModel->getData(),
            "schedule" => $this->model->getData(),
            "view" => [
                "pagination" => $pagination,
                "mode" => $showDetails ? "details" : "classic",
                "detailsId" => $detailsId,
                "detailsItem" => $this->model->getItem($detailsId),
            ],
        ];

        $this->initResources("ScheduleView");
        $this->render($data);
    }

    /**
     * Controller error handler
     *
     * @param string|null $msg message string
     */
    protected function fail(?string $msg = null)
    {
        if (!is_null($msg)) {
            Message::setError($msg);
        }

        setLocation(BASEURL . "schedule/");
    }

    /**
     * Returns transaction type from request
     *
     * @param array $request request data
     * @param int $default default transaction type
     *
     * @return int
     */
    protected function getRequestedType(array $request, int $default)
    {
        if (!is_array($request) || !isset($request["type"])) {
            return $default;
        }
        $res = intval($request["type"]);
        if (!$res) {
            $res = TransactionModel::stringToType($request["type"]);
        }
        if (!$res) {
            $this->fail(__("ERR_TRANSACTION_TYPE"));
        }

        return $res;
    }

    /**
     * /schedule/create/ route handler
     * Renders create scheduled transaction view
     */
    public function create()
    {
        if ($this->isPOST()) {
            $this->fail(__("ERR_INVALID_REQUEST"));
        }

        $this->template = new Template(VIEW_TPL_PATH . "ScheduleItem.tpl");
        $data = [
            "headString" => __("SCHED_TRANS_CREATE"),
            "titleString" => __("APP_NAME") . " | " . __("SCHED_TRANS_CREATE"),
        ];


        $userAccounts = $this->accModel->getUserAccounts();
        $persons = $this->personMod->getData(["visibility" => "all", "sort" => "visibility"]);
        $iconModel = IconModel::getInstance();
        $defMsg = __("ERR_TRANS_CREATE");

        $dateInfo = getDateInfo(time(), INTERVAL_MONTH);

        $tr = [
            "type" => $this->getRequestedType($_GET, EXPENSE),
            "src_amount" => 0,
            "dest_amount" => 0,
            "category_id" => 0,
            "comment" => "",
            "start_date" => $dateInfo["time"],
            "end_date" => null,
            "interval_type" => INTERVAL_MONTH,
            "interval_step" => 1,
            "interval_offset" => $dateInfo["info"]["mday"] - 1,
        ];

        // Check availability of selected type of transaction
        $trAvailable = false;
        $creditCardAccounts = null;
        if ($tr["type"] == EXPENSE || $tr["type"] == INCOME) {
            $trAvailable = count($userAccounts) > 0;
        } elseif ($tr["type"] == TRANSFER) {
            $trAvailable = count($userAccounts) > 1;
        } elseif ($tr["type"] == DEBT) {
            $trAvailable = is_array($persons) && count($persons) > 0;
        } elseif ($tr["type"] == LIMIT_CHANGE) {
            $creditCardAccounts = $this->accModel->getUserAccounts([
                "type" => ACCOUNT_TYPE_CREDIT_CARD,
            ]);
            $trAvailable = count($creditCardAccounts) > 0;
        }

        // Check specified account
        $accountRequested = isset($_GET["acc_id"]);
        $acc_id = ($accountRequested) ? intval($_GET["acc_id"]) : 0;
        // Redirect if invalid account is specified
        if ($acc_id) {
            $account = $this->accModel->getItem($acc_id);
            if (!$account || $account->owner_id != $this->owner_id) {
                $this->fail($defMsg);
            }
        }
        // Use first account if nothing is specified
        if (!$acc_id && !$accountRequested) {
            if ($tr["type"] == LIMIT_CHANGE) {
                if (is_array($creditCardAccounts) && count($creditCardAccounts) > 0) {
                    $acc_id = $creditCardAccounts[0]->id;
                }
            } elseif (count($userAccounts) > 0) {
                $acc_id = $userAccounts[0]->id;
            }
        }

        // Check person parameter
        $person_id = 0;
        if (isset($_GET["person_id"]) && $tr["type"] == DEBT) {
            $person_id = intval($_GET["person_id"]);
        }
        if (!$person_id && count($persons) > 0) {
            $person_id = $persons[0]->id;
        }
        if ($person_id) {
            $person = $this->personMod->getItem($person_id);
            if (!$person) {
                $this->fail(__("ERR_PERSON_NOT_FOUND"));
            }
        }

        $debtType = true;
        $noAccount = ($acc_id == 0);
        $debtAcc = $this->accModel->getItem($acc_id);

        // Prepare person account
        $person_curr = ($debtAcc) ? $debtAcc->curr_id : $this->currModel->getIdByPos(0);
        $person_acc = $this->accModel->getPersonAccount($person_id, $person_curr);
        $person_acc_id = ($person_acc) ? $person_acc->id : 0;

        if ($tr["type"] == DEBT) {
            $tr["src_id"] = $person_acc_id;
            $tr["dest_id"] = $acc_id;
            $tr["src_curr"] = ($debtAcc) ? $debtAcc->curr_id : $person_curr;
            $tr["dest_curr"] = ($debtAcc) ? $debtAcc->curr_id : $person_curr;
            $tr["person_id"] = $person_id;
            $tr["debtType"] = $debtType;
            $tr["acc_id"] = $acc_id;
            $tr["lastAcc_id"] = $acc_id;
            $tr["noAccount"] = $noAccount;
        } else {
            // set source and destination accounts
            $src_id = 0;
            $dest_id = 0;
            if ($tr["type"] == EXPENSE || $tr["type"] == TRANSFER) {
                $src_id = ($acc_id ? $acc_id : $this->accModel->getAnother());
            } elseif ($tr["type"] == INCOME) {       // income
                $dest_id = ($acc_id ? $acc_id : $this->accModel->getAnother());
            } elseif ($tr["type"] == LIMIT_CHANGE) {
                $dest_id = $acc_id;
            }

            if ($tr["type"] == TRANSFER) {
                $dest_id = $this->accModel->getAnother($src_id);
            }

            $tr["src_id"] = $src_id;
            $tr["dest_id"] = $dest_id;
            $tr["src_curr"] = 0;
            $tr["dest_curr"] = 0;

            if ($src_id != 0) {
                $accObj = $this->accModel->getItem($src_id);
                if ($accObj) {
                    $tr["src_curr"] = $accObj->curr_id;
                }
            }

            if ($dest_id != 0) {
                $accObj = $this->accModel->getItem($dest_id);
                if ($accObj) {
                    $tr["dest_curr"] = $accObj->curr_id;
                }
            }

            if ($tr["type"] == EXPENSE) {
                $tr["dest_curr"] = $tr["src_curr"];
            } elseif ($tr["type"] == INCOME || $tr["type"] == LIMIT_CHANGE) {
                $tr["src_curr"] = $tr["dest_curr"];
            }

            if ($tr["type"] == TRANSFER && !$trAvailable) {
                $tr["dest_curr"] = $tr["src_curr"];
            }
        }

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $this->accModel->getData(["owner" => "all", "visibility" => "all"]),
            "currency" => $this->currModel->getData(),
            "userCurrencies" => $this->userCurrModel->getData(),
            "icons" => $iconModel->getData(),
            "persons" => $this->personMod->getData(["visibility" => "all"]),
            "categories" => $this->catModel->getData(),
            "nextAddress" => $this->getNextAddress(),
            "view" => [
                "mode" => $this->action,
                "scheduleItem" => $tr,
                "trAvailable" => $trAvailable,
            ]
        ];

        $this->initResources("ScheduleItemView");
        $this->render($data);
    }

    /**
     * /schedule/update/ route handler
     * Renders update scheduled transaction view
     */
    public function update()
    {
        if ($this->isPOST()) {
            $this->fail(__("ERR_INVALID_REQUEST"));
        }

        $this->template = new Template(VIEW_TPL_PATH . "ScheduleItem.tpl");
        $data = [
            "headString" => __("SCHED_TRANS_UPDATE"),
            "titleString" => __("APP_NAME") . " | " . __("SCHED_TRANS_UPDATE"),
        ];

        $itemId = intval($this->actionParam);
        if (!$itemId) {
            $this->fail(__("ERR_SCHED_TRANS_UPDATE"));
        }

        $item = $this->model->getItem($itemId);
        if (!$item) {
            $this->fail(__("ERR_SCHED_TRANS_UPDATE"));
        }
        $tr = (array)$item;

        // check type change request
        $requestedType = $this->getRequestedType($_GET, $tr["type"]);

        if ($tr["type"] == DEBT) {
            $src = $this->accModel->getItem($tr["src_id"]);
            $dest = $this->accModel->getItem($tr["dest_id"]);

            $debtType = (!is_null($src) && $src->owner_id !== $this->owner_id);

            $person_id = ($debtType) ? $src->owner_id : $dest->owner_id;
            $person = $this->personMod->getItem($person_id);
            if (!$person) {
                throw new \Error(__("ERR_PERSON_NOT_FOUND"));
            }

            $debtAcc = $debtType ? $dest : $src;
            $noAccount = is_null($debtAcc);

            $acc_id = ($noAccount)
                ? $this->accModel->getAnother()
                : $debtAcc->id;

            $tr["person_id"] = $person_id;
            $tr["debtType"] = $debtType;
            $tr["acc_id"] = $acc_id;
            $tr["lastAcc_id"] = $acc_id;
            $tr["noAccount"] = $noAccount;
        }

        $iconModel = IconModel::getInstance();

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $this->accModel->getData(["owner" => "all", "visibility" => "all"]),
            "currency" => $this->currModel->getData(),
            "userCurrencies" => $this->userCurrModel->getData(),
            "icons" => $iconModel->getData(),
            "persons" => $this->personMod->getData(["visibility" => "all"]),
            "categories" => $this->catModel->getData(),
            "nextAddress" => $this->getNextAddress(),
            "view" => [
                "mode" => $this->action,
                "scheduleItem" => $tr,
                "trAvailable" => true,
                "requestedType" => $requestedType,
            ],
        ];

        $this->initResources("ScheduleItemView");
        $this->render($data);
    }
}
