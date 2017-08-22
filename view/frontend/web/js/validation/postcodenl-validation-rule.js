define([
    "jquery",
    "experius_postcode", // Custom knockout view model
    'jquery/validate',
    "validation",
    "mage/translate"
], function($,experiusPostcode) {
    "use strict";

    $.validator.addMethod('validate-postcode-housenumber-combination', function (value) {
    }, $.mage.__('No address could be found.'));

});