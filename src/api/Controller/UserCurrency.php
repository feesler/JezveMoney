<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiSortableListController;
use JezveMoney\App\Model\UserCurrencyModel;

/**
 * User currencies API controller
 */
class UserCurrency extends ApiSortableListController
{
    protected $requiredFields = ["curr_id", "flags"];
    protected $defaultValues = [
        "flags" => 0,
    ];

    /**
     * Controller initialization
     */
    public function initAPI()
    {
        parent::initAPI();

        $this->model = UserCurrencyModel::getInstance();
        $this->createErrorMsg = __("ERR_USER_CURRENCY_CREATE");
        $this->updateErrorMsg = __("ERR_USER_CURRENCY_UPDATE");
        $this->deleteErrorMsg = __("ERR_USER_CURRENCY_DELETE");
        $this->changePosErrorMsg = __("ERR_USER_CURRENCY_CHANGE_POS");
    }
}
