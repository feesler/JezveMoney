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
        $this->createErrorMsg = __("userCurrencies.errors.create");
        $this->updateErrorMsg = __("userCurrencies.errors.update");
        $this->deleteErrorMsg = __("userCurrencies.errors.delete");
        $this->changePosErrorMsg = __("userCurrencies.errors.changePos");
    }
}
