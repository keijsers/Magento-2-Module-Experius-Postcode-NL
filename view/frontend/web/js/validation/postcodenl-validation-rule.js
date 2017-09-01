define([
    'jquery',
    'Magento_Ui/js/lib/validation/validator',
    'uiRegistry',
    'experius_postcode'
], function ($, validator, uiRegistry, postcode) {
    'use strict';

    return function (target) {

        validator.addRule(
            'validate-postcode-housenumber-combination',
            function (value, params) {
                return false;
            }, $.mage.__('Enter Your message here')
        );

        return target;
    };
});