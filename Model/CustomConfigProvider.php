<?php

/**
 * A Magento 2 module named Experius/Postcode
 * Copyright (C) 2016 Experius
 * 
 * This file included in Experius/Postcode is licensed under OSL 3.0
 * 
 * http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 * Please see LICENSE.txt for the full text of the OSL 3.0 license
 */

namespace Experius\Postcode\Model;

use Magento\Checkout\Model\ConfigProviderInterface;

class CustomConfigProvider implements ConfigProviderInterface
{
    
    protected $postcodeHelper;
    
    public function __construct(
        \Experius\Postcode\Helper\Data $postcodeHelper
    ){
        $this->postcodeHelper = $postcodeHelper;
    }
    
    /**
     * {@inheritdoc}
     */
    public function getConfig()
    {        
        $config = [
            'experius_postcode' => [
                'settings' => $this->postcodeHelper->getJsinit(false)
            ]
        ];
        return $config;
    }
}
