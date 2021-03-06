define([
    'jquery',
    'Magento_Ui/js/form/components/group',
    'Experius_Postcode/js/action/postcode',
    'Magento_Checkout/js/model/quote',
    'Magento_Checkout/js/checkout-data',
    'uiRegistry'
], function($,Abstract,getPostcodeInformation,quote,checkoutData,registry) {
    'use strict';
    return Abstract.extend({
        defaults: {
            checkDelay: 500,
            emailCheckTimeout: 0,
            isLoading: false,
            checkRequest: null,
            isPostcodeCheckComplete: null,
            addressType: 'shipping',
            imports: {
                observeCountry: '${ $.parentName }.country_id:value',
                observeDisableCheckbox: '${ $.parentName }.experius_postcode_fieldset.experius_postcode_disable:value',
                observePostcodeField: '${ $.parentName }.experius_postcode_fieldset.experius_postcode_postcode:value',
                observeHousenumberField: '${ $.parentName }.experius_postcode_fieldset.experius_postcode_housenumber:value',
                observeAdditionDropdown: '${ $.parentName }.experius_postcode_fieldset.experius_postcode_housenumber_addition:value',
                observeStreet: '${ $.parentName }.street:visible'
            },
            visible: true
        },
        getAddressData: function(){
            if(this.addressType=='shipping' && typeof checkoutData.getShippingAddressFromData() !== 'undefined' && checkoutData.getShippingAddressFromData()) {
                return checkoutData.getShippingAddressFromData();
            } else if(this.addressType=='billing' && typeof checkoutData.getBillingAddressFromData() !== 'undefined' && checkoutData.getBillingAddressFromData()){
                return checkoutData.getBillingAddressFromData();
            } else if(this.source) {
                return this.source.get(this.customerScope);
            } else {
                return;
            }
        },
        initialize: function () {
            this._super()
                ._setClasses();

            this.updatePostcode();

            return this;
        },
        initObservable: function () {
            var rules = this.validation = this.validation || {};

            this._super().observe(['isLoading']);

            this.observe('isLoading checked error disabled focused preview visible value warn isDifferedFromDefault notice')
                .observe('isUseDefault')
                .observe({
                    'required': !!rules['required-entry']
                });

            return this;
        },
        observeStreet: function(value){
            if(value===false){

            }
        },
        observeCountry: function (value) {
            if (value) {
                this.toggleFieldsByCountry(this.getAddressData());
            }
        },
        observeDisableCheckbox: function (value) {
            if(value){
                this.showFields();
                this.notice('')
            } else if (registry.get(this.parentName + '.experius_postcode_fieldset.experius_postcode_disable').get('visible')) {
                this.hideFields();
                this.updatePostcode();
            }
        },
        observePostcodeField: function (value) {
            if(value) {
                this.updatePostcode();
            }
        },
        observeHousenumberField: function (value) {
            if(value) {
                this.updatePostcode();
            }
        },
        observeAdditionDropdown: function (value) {
            this.postcodeHouseNumberAdditionHasChanged(value);
            this.updatePreview();
        },
        toggleFieldsByCountry: function(address){
            if(address && address.country_id=='NL' && !address.experius_postcode_disable) {
                this.hideFields();
                this.debug('hide fields based on country value');
                registry.get(this.parentName + '.experius_postcode_fieldset.experius_postcode_disable').set('visible', true);
                this.updatePostcode();
            } else if(address && address.country_id=='NL' && address.experius_postcode_disable){
                this.showFields();
                this.debug('show fields based on country value and disable checkbox');
                registry.get(this.parentName + '.experius_postcode_fieldset.experius_postcode_disable').set('visible',true);
            } else {
                this.showFields();
                this.debug('show fields based on country value');
                registry.get(this.parentName + '.experius_postcode_fieldset.experius_postcode_disable').set('visible',false);
                registry.get(this.parentName + '.experius_postcode_fieldset.experius_postcode_disable').set('value',false);
            }
        },
        updatePostcode: function(){
            var self = this;
            if (self.getSettings().timeout != undefined){
            	clearTimeout(self.getSettings().timeout);
            }
            self.getSettings().timeout = setTimeout(function () {
                self.postcodeHasChanged();
            }, self.checkDelay);
        },
        postcodeHasChanged: function() {

            var self = this;
			
			if (!this.source) {
                return;
            }
		
            var formData = this.source.get(this.customerScope);
            
            if (!formData){
            	return;
            }

            this.debug(formData);

            if(!formData.experius_postcode_disable && formData.country_id=='NL') {
                this.hideFields();
            }

            if(formData.experius_postcode_postcode && formData.experius_postcode_housenumber && formData.experius_postcode_disable !== true && formData.country_id=='NL') {
                this.debug('start postcode lookup');
                clearTimeout(this.emailCheckTimeout);
                this.emailCheckTimeout = setTimeout(function () {
                    self.getPostcodeInformation();
                }, self.checkDelay);
            } else {
                this.debug('postcode or housenumber not set. ' + 'housenumber:' + formData.experius_postcode_housenumber + ' postcode:' + formData.experius_postcode_postcode);
            }
            

        },
        hideFields: function(){

            this.debug('hide magento default fields');

            var self = this;
            $.each(['street','country_id','city','postcode'], function(key,fieldName){

                if(fieldName==='country_id' && self.getSettings().neverHideCountry){
                    // continue;
                } else {

                    $('.' + self.customerScope + '-' + fieldName).addClass('experius-postcode-hide');

                    $('.' + self.customerScope + '-' + fieldName).hide();
					
					var element = registry.get(self.parentName + '.' + fieldName);
                    if (element) {
                		if (element.component.indexOf('/group') !== -1) {
			                $.each(element.elems(), function (index, elem) {
			                    elem.set('visible', false).set('labelVisible', false).set('disabled', true);
			                });
			                var additionalClasses = element.get('additionalClasses');
			                additionalClasses['experius-postcode-hide'] = 'experius-postcode-hide';
			                element.set('additionalClasses', additionalClasses);
			            }else{
                    		element.set('visible', false).set('labelVisible', false).set('disabled', true);
                    	}
                    }

                }
            });

            registry.get(this.parentName + '.experius_postcode_fieldset.experius_postcode_postcode').set('visible',true);
            registry.get(this.parentName + '.experius_postcode_fieldset.experius_postcode_housenumber').set('visible',true);

            if(registry.get(this.parentName + '.experius_postcode_fieldset.experius_postcode_housenumber_addition'))
            {
                registry.get(this.parentName + '.experius_postcode_fieldset.experius_postcode_housenumber_addition').set('visible', false);
            }

        },
        showFields: function(){
            
            this.debug('show magento default fields');

            var self = this;
            $.each(['street','country_id','city','postcode'], function(key,fieldName){

                $('.'+self.customerScope+'-'+fieldName).removeClass('experius-postcode-hide');

                $('.'+self.customerScope+'-'+fieldName).show();

                var element = registry.get(self.parentName + '.' + fieldName);
                if (element) {
            		if (element.component.indexOf('/group') !== -1) {
		                $.each(element.elems(), function (index, elem) {
		                    elem.set('visible',true).set('labelVisible',true).set('disabled',false);
		                });
		                var additionalClasses = element.get('additionalClasses');
			                additionalClasses['experius-postcode-hide'] = '';
			                element.set('additionalClasses', additionalClasses);
		            }else{
                		element.set('visible',true).set('labelVisible',true).set('disabled',false);
                	}
                }
            });

            $.each([
                'experius_postcode_fieldset.experius_postcode_postcode',
                'experius_postcode_fieldset.experius_postcode_housenumber',
                'experius_postcode_fieldset.experius_postcode_housenumber_addition'
                ], function(key,fieldName){
                if (registry.get(self.parentName + '.' + fieldName)) {
                    registry.get(self.parentName + '.' + fieldName).set('visible',false);
                }
            });
            
            this.notice('');
        },
        getSettings: function() {
            var settings = window.checkoutConfig.experius_postcode.settings;
            return settings;
        },
        getPostcodeInformation: function () {
            
            var self = this;
            var response = false;
			
			if (!this.source) {
                return;
            }
		
            var formData = this.source.get(this.customerScope);

            this.validateRequest();
            this.isPostcodeCheckComplete = $.Deferred();
            this.checkRequest = getPostcodeInformation(this.isPostcodeCheckComplete,formData.experius_postcode_postcode,formData.experius_postcode_housenumber);

            this.isLoading(true);

            $.when(this.isPostcodeCheckComplete).done(function (data) {
                
                response = JSON.parse(data);
                
                self.debug(response);

                if (response.street) {
                    self.error(false);
                    
                    if(self.getSettings().useStreet2AsHouseNumber){
                        registry.get(self.parentName + '.street.0').set('value',response.street).set('error',false);
                        registry.get(self.parentName + '.street.1').set('value',response.houseNumber.toString()).set('error',false);
                        self.debug('address on two lines');
                    } else {
                        registry.get(self.parentName + '.street.0').set('value',response.street + ' ' + response.houseNumber).set('error',false);
                        self.debug('address on single line');
                    }
                    registry.get(self.parentName + '.country_id').set('value','NL').set('error',false);
                    registry.get(self.parentName + '.region_id').set('value',response.province).set('error',false);
                    registry.get(self.parentName + '.city').set('value',response.city).set('error',false);
                    registry.get(self.parentName + '.postcode').set('value',response.postcode).set('error',false);
                    
                    self.updatePreview();

                    self.setHouseNumberAdditions(response.houseNumberAdditions);
                
                } else {

                    self.error(response.message);
                    self.notice(false);

                    registry.get(self.parentName + '.experius_postcode_fieldset.experius_postcode_housenumber_addition').set('visible',false);
                }

                self.isLoading(false);

            }).fail(function () {
                // fail
            }).always(function () {

            });

        },
        setHouseNumberAdditions: function(additions){

            if(registry.get(this.parentName + '.experius_postcode_fieldset.experius_postcode_housenumber_addition') && additions.length>1 && !registry.get(this.parentName + '.experius_postcode_fieldset.experius_postcode_disable').get('value')) {
                
                var options = [];
                $.each(additions, function(key,addition){
                    if (!addition) {
                        options[key] = {'label':'No addition','labeltitle':'No addition','value':''};
                    } else {
                        var additionStripped = addition.replace(" ", "");
                        options[key] = {'label':additionStripped,'labeltitle':additionStripped,'value':additionStripped};
                    }
                });
                
                registry.get(this.parentName + '.experius_postcode_fieldset.experius_postcode_housenumber_addition').set('visible',true).set('options',options);
            }  else if(registry.get(this.parentName + '.experius_postcode_fieldset.experius_postcode_housenumber_addition')) {
                registry.get(this.parentName + '.experius_postcode_fieldset.experius_postcode_housenumber_addition').set('visible',false);
            }
        },
        validateRequest: function () {
            if (this.checkRequest != null && $.inArray(this.checkRequest.readyState, [1, 2, 3])) {
                this.checkRequest.abort();
                this.checkRequest = null;
            }
        },
        debug: function(message){
            if(this.getSettings().debug){
                console.log(message);
            }
        },
        updatePreview: function(){
            var preview = '<i>';
			
			if (!this.source) {
                return;
            }

            var address = this.source.get(this.customerScope);

            $.each(address.street, function(index,street){
                preview += street + ' ';
            });

            preview += "<br/>" + address.postcode + "<br/>";
            preview += address.city;
            preview += "</i>"

            this.notice(preview);
        },
        postcodeHouseNumberAdditionHasChanged: function(newValue){

            var current_street_value = false;
            var new_street_value = false;
            var addition = false;

            if(newValue==undefined){
                return;
            }

            var parentPartentName = this.parentName;

            /* Needs refactoring */
            if(this.getSettings().useStreet2AsHouseNumber && registry.get(parentPartentName + '.street.1') && registry.get(parentPartentName + '.street.1').get('value')){
                current_street_value = this.removeOldAdditionFromString(registry.get(parentPartentName + '.street.1').get('value'));
                addition =  (newValue) ? ' ' +  newValue : '';
                new_street_value = current_street_value + addition;
                registry.get(parentPartentName + '.street.1').set('value',new_street_value);
            } else if(this.getSettings().useStreet3AsHouseNumberAddition && registry.get(parentPartentName + '.street.2')){
                registry.get(parentPartentName + '.street.2').set('value',newValue);
            } else if(registry.get(parentPartentName + '.street.0') && registry.get(parentPartentName + '.street.0').get('value')) {
                current_street_value = this.removeOldAdditionFromString(registry.get(parentPartentName + '.street.0').get('value'));
                addition =  (newValue) ? ' ' +  newValue : '';
                new_street_value = current_street_value + addition;
                registry.get(parentPartentName + '.street.0').set('value',new_street_value);
            }

            this.previousValue = newValue;

        },
        removeOldAdditionFromString: function(street){
            if(this.previousValue!=undefined && this.previousValue && street) {
                var streetParts  = (""+street).split(" ");
                if(streetParts.length>1) {
                    streetParts.pop();
                }
                street = streetParts.join(" ");
                return street;
            }
            return street;
        }
    });
});
