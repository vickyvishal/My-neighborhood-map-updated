/*Api request is loaded Asynchronously */
/*
Code consist of 8 functions and designed as per Neighborhood Map rubrics criteria
The variable is named as relevent as possible
My questions in discussion forum:- https://discussions.udacity.com/t/filter-search-logic-help/216329/6 , https://discussions.udacity.com/t/how-to-test-for-a-google-maps-error/183447/12
*/

/*locations object contains location information: latitude and longitude, title, pokemon chances and a foursquare ID found from https://foursquare.com
This will be used to locate the place */
var locations = [
	{
		title: 'Marathalli Bridge',
		location:{
			lat: 12.959368,
			lng: 77.701168,
			},
		chance:["17 pokemon/hour"],
		id: '4e6ee078d1647b1137b83e8c',
	},{
		title: 'Eco Space',
		location:{
			lat: 12.926190,
			lng: 77.681170
			},
		chance:["10 pokemon/hour"],
		id: '4b594ee0f964a520a68428e3',
	},{
		title: 'Silk Board',
		location:{
			lat: 12.916636,
			lng: 77.623508
			},
		chance:["25 pokemon/hour"],
		id: '50ae2160e4b0ed6fa7b5dabb',
	},{
		title: 'Tin Factory traffic jam',
		location:{
			lat: 12.997988,
			lng: 77.671107
			},
		chance:["20 pokemon/hour"],
		id: '51a6cb05498ec49099258ed2',
	},{
		title: 'Sony Center World',
		location:{
			lat: 12.970296,
			lng: 77.641263
			},
		chance:["12 pokemon/hour"],
		id: '4c790216df08a1cdab20d95d',
	},{
		title: 'Domlur',
		location:{
			lat: 12.9606694,
			lng: 77.6417112
			},
		chance:["7 pokemon/hour"],
		id: '4da83a046e81162ae7a20113',
	},{
		title: 'Graphite India',
		location:{
			lat: 12.979763,
			lng: 77.710285
			},
		chance:["9 pokemon/hour"],
		id: '5231c49311d26dde3cad36c5',
	}
];
/* 
To handle the mapError
Reference:- http://www.w3schools.com/jsref/event_onerror.asp
*/
function mapError(){
	viewModelobj.mapDetails("The map couldn't be loaded. Try after some time");
}
/*
To handle the keyError
Reference: https://discussions.udacity.com/t/how-to-test-for-a-google-maps-error/183447/10
*/
function gm_authFailure(){
	viewModelobj.mapDetails("Check google API keys!");
}
/*
Location model class 
*/
var locationModel = function(data){
	var self = this;
	self.show = ko.observable(true);
	self.title = data.title;
	self.location = data.location;
	self.chance = data.chance;
	self.id = data.id;
};


/*

1)A instance viewModel function will append to the knockout model in html
2)A instance of locationModel is used to populate locationList array
3)It will search and filter out list and marker by toggling the show property
4)Reference for marker visibility toggle:- http://stackoverflow.com/questions/3647711/what-is-the-difference-between-marker-setvisiblefalse-and-marker-setmapnul
*/
var viewModel = function(){
	var self = this;
	self.search = ko.observable('');
	self.locationList = ko.observableArray();
	self.mapDetails = ko.observable();
	self.apiDetails = ko.observable();
	self.apiImage = ko.observable();
	self.placeTips = ko.observable();
	self.noApi = ko.observable();
	for (var i = 0 ; i < locations.length; i++){
		var loc = new locationModel(locations[i]);
		self.locationList.push(loc);
	}
	self.filterSearch = ko.computed(function(){
		var userInput = self.search().toLowerCase();
		for (var i = 0; i < self.locationList().length; i++){
			if(self.locationList()[i].title.toLowerCase().indexOf(userInput) > -1){
				self.locationList()[i].show(true);
				if (self.locationList()[i].markerModel){
				self.locationList()[i].markerModel.setVisible(true);
				}
			}else{
				self.locationList()[i].show(false);
				if (self.locationList()[i].markerModel){
				self.locationList()[i].markerModel.setVisible(false);
				}
			}
		}
	});
		//reference:-https://developers.google.com/maps/documentation/javascript/events
		self.listClick = function(locations){
		google.maps.event.trigger(locations.markerModel, 'click');
	};

};
//Creating a new google map object
//Customizing the feature 
/*
1)Initialization of the map and markers
*/
var infoWindow;
var map ;
var mapFeature = function() {
		map = new google.maps.Map(document.getElementById('map'),{
		center: {lat: 12.959368, lng: 77.701168},
		zoom: 12,
		mapTypeControl: false
	});
	infoWindow = new google.maps.InfoWindow();
	
	for(var i=0; i < viewModelobj.locationList().length; i++){
		var markerPosition = viewModelobj.locationList()[i].location;
		var markerTitle = viewModelobj.locationList()[i].title;
		var markerChance = viewModelobj.locationList()[i].chance;
		var markerId = viewModelobj.locationList()[i].id;
		var beforeIcon = markerToggler('initial');
		var afterIcon = markerToggler('after');
		
		var marker = new google.maps.Marker({
		map: map,
		position: markerPosition,
		title: markerTitle,
		chance: markerChance,
		id: markerId,
		animation: google.maps.Animation.DROP,
		icon: beforeIcon,
		afterIcon: afterIcon,
		beforeIcon: beforeIcon
		});
		viewModelobj.locationList()[i].markerModel = marker;
		markerAction(marker);
		
	}
};
/* 
1)This function controls the marker and infoWindow animation
 */

function markerAction(marker){
	marker.addListener('click', function(){
		var currentMarker = this;
		currentMarker.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function(){
			currentMarker.setAnimation(null);
		}, 1000);
		populateInfoWindow(this, infoWindow);
	});
	marker.addListener('mouseover', function(){
		this.setIcon(this.afterIcon);
	});
	marker.addListener('mouseout', function(){
		this.setIcon(this.beforeIcon);
	});
}

//reference:- https://developers.google.com/maps/documentation/javascript/markers
/*
This function toggles the marker icon on mouse events
*/
function markerToggler(toggle){
	var markerImage = new google.maps.MarkerImage('images/' + toggle + '.png',
        new google.maps.Size(64, 64),
        new google.maps.Point(0, 0),
        new google.maps.Point(32, 64),
        new google.maps.Size(64, 64));
        return markerImage;
}

var successTips;
var picUrl;
/*
1)This function adds information to infoWindow
2)It uses Foursquare Api's venue, image, tips information to render in infowwindow and DOM.
*/
function populateInfoWindow(selectedMarker, selectedInfoWindow){
	if (selectedInfoWindow.selectedMarker != selectedMarker){
			selectedInfoWindow.setContent('loading');
			selectedInfoWindow.selectedMarker = selectedMarker;
			selectedInfoWindow.addListener('closeclick', function(){
				selectedInfoWindow.selectedMarker = null;
				setTimeout(function(){
				selectedInfoWindow.selectedMarker.close();
				console.log('here');
			}, 2000);
			});
          
        var CLIENT_ID_Foursquare = '?client_id=AOGD2RDYRJC2QBFLUDJVE5IH00KRS1PVVGOARUQZUSF5OVIM';
		var CLIENT_SECRET_Foursquare = '&client_secret=K2Z1IEBIK1NDQMHSJFZQ0NVPHRJBA2TB5ZKZU5XQWV2CQP43';
		
		/*reference: foursquare for developers
		https://developer.foursquare.com/ 
		Multiple information from API, reference:- https://discussions.udacity.com/t/filter-search-logic-help/216329/3
		https://developer.foursquare.com/docs/explore#req=venues/5231c49311d26dde3cad36c5
		*/
		$.ajax({
				type: "GET",
				dataType: 'json',
				cache: false,
				url: 'https://api.foursquare.com/v2/venues/' + selectedMarker.id + CLIENT_ID_Foursquare + CLIENT_SECRET_Foursquare + '&v=20170115',
				async: true,
				success: function(data){
						var venuename = data.response.venue.name;
						var formattedAddress = data.response.venue.location.formattedAddress;
						var address = formattedAddress.length > 0 ? formattedAddress : "Address not available for this particular location";
						var formattedCheckin = data.response.venue.stats.checkinsCount;
						var formattedPrefix = data.response.venue.photos.groups[0].items;//by studying the venue response file arrangment directory":- https://developer.foursquare.com/docs/explore#req=venues/
						var prefix = data.response.venue.photos.groups[0].items[0].prefix;
						var formattedSuffix = data.response.venue.photos.groups[0].items;
						var suffix = data.response.venue.photos.groups[0].items[0].suffix;
						var formattedSize = data.response.venue.photos.groups[0].items;
						var size = data.response.venue.photos.groups[0].items[0].width;
						picUrl = (formattedPrefix.length > 0 && formattedSuffix.length > 0 && formattedSize.length > 0) ? prefix +'width'+ size + suffix : "Photos not available for this particular location";
						var formattedTips = data.response.venue.tips.groups[0].items;
						successTips =  formattedTips.length > 0 ? formattedTips[0].text : "No user Tips for this particular location";
						console.log(formattedTips);
						selectedInfoWindow.open(map, selectedMarker);
						selectedInfoWindow.setContent('<div>'+ venuename + '<br>'+ address + '<br>' + '<em>' + selectedMarker.chance + '</em>' +'<br>' + '<h6> Commuters </h6>'+ formattedCheckin + '</div>');
						viewModelobj.apiImage(picUrl);
						viewModelobj.placeTips(successTips);
						if (!data.response) {
								data.response = 'Foursquare do not have any data. Check the Id and Key!';
						}
				},
				error: function (){
    				viewModelobj.apiDetails("Some Issue with Foursquare API");
    			}
				
		});
		
		viewModelobj.apiDetails("Welcome to Fousquare");
    }
}
/*
A new instance of viewModel is made
The instance is binded to the DOM
*/
var viewModelobj = new viewModel();
ko.applyBindings(viewModelobj);
