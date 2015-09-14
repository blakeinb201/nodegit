var locs = {"Australia":"p8","Argentina":"p30","Austria":"p44","Belgium":"p41","Brazil":"p18","Canada":"p13","Chile":"p38","Colombia":"p32","Czech Republic":"p43","Denmark":"p49","Egypt":"p29","Finland":"p50","France":"p16","Germany":"p15","Greece":"p48","Hong Kong":"p10","Hungary":"p45","India":"p3","Indonesia":"p19","Israel":"p6","Italy":"p27","Japan":"p4","Kenya":"p37","Malaysia":"p34","Mexico":"p21","Netherlands":"p17","Nigeria":"p52","Norway":"p51","Philippines":"p25","Poland":"p31","Portugal":"p47","Romania":"p39","Russia":"p14","Saudi Arabia":"p36","Singapore":"p5","South Africa":"p40","South Korea":"p23","Spain":"p26","Sweden":"p42","Switzerland":"p46","Taiwan":"p12","Thailand":"p33","Turkey":"p24","Ukraine":"p35","United Kingdom":"p9","United States":"p1","Vietnam":"p28"};

var lockeys = Object.keys(locs);
var chart;
var data;

var currentQ = '';
var currentView = 'countries';
var currentData = '';
var currentCountry = '';

var TWITTERCOUNTRY = 'Worldwide';

var defaultOptions = {
	legend: 'none',
	region: 'world', // 'US'	'AU-QLD		world
	resolution: '',//provinces or metros		This wants provinces
	colorAxis: {colors: ['#F3fff9', '#099']},
	backgroundColor: '#292F33',
	datalessRegionColor: '#999999 ',
	defaultColor: '#008C69',
};

////////////////////////////// Initialisation //////////////////////////////

// Get the geochart library
google.load("visualization", "1", {packages:["geochart"]});
google.setOnLoadCallback(drawRegionsMap);

$(function() {
	// get the initial trends
	getGHotSearches();
	
	// Back button click handler
	$('#back_col').click(function() {
		// If we want to clear everything
		if ($(this).text() == "Clear All") {
			// Reset the place input below the chart
			$('#worldsearch').val(TWITTERCOUNTRY);
			
			// Clear the map of data
			clearMap();
			
			// Clear the tweets
			$('#tweets').text('');
			
			// Clear the search box above the chart
			$('#inputDefault').val('');
		} else {
			// This means the text was "back to worldwide" so do that
			$('#back_col').text('Clear All')
			currentCountry = '';
			$('#worldsearch').val(TWITTERCOUNTRY);
			currentView = 'countries';
			
			// If the user is searching for something then get the worldwide data to show them
			if (currentQ != '') {
				
				// Begin getting the data
				startProgress();
				getGTrends(currentQ, currentCountry, function(successData) {
					currentView = 'countries';
					var ops = {
						region: 'world',
						resolution: 'countries'
					};
					reDrawChart(successData, ops);
				});
			}
		}
	});
	
	// Get the trends for the selected drop down item
	$('#select').on('change', function() {
		getGHotSearches(this.value);
	});
	
	// Get the search volume for the inputted search
	$('#searchbuttom').click(searchTrends);
	
	// For usability, also listen for the enter key
	$("#inputDefault").keyup(function (e) {
		if (e.keyCode == 13) {
			searchTrends();
		}
	});
	
	// The get tweets button handler
	$('#getTweets').click(function() {
		
		// Get the user inputted values
		var countryname = $('#worldsearch').val();
		var searchquery = $('#inputDefault').val();
		
		// If they aren't empty then continue
		if (searchquery != '' && countryname != 'Worldwide') {
			
			// begin getting
			startProgress();
			getTweets(searchquery, countryname, function(successData) {
				
				// If we got any errors then show them
				if (typeof successData.error !== 'undefined') {
					showError(successData.error);
					completeProgress();
					return;
				}
				
				// If we didn't find any tweets then show an error
				if (successData.search_metadata.count == 0) {
					showError("No tweets available.");
					completeProgress();
					return;
				}
				
				// Otherwise prepare the data
				var tweetdivs = "<ul id='twitdivs' class='list-group'>";
				for(x in successData.statuses) {
					tweetdivs += "<li class='list-group-item'>";
					tweetdivs += "<div>" + successData.statuses[x].text + "</div>";
					tweetdivs += "<div>" + successData.statuses[x].user.name + "</div>";
					tweetdivs += "</li>";
				}
				tweetdivs += "</ul>";
				
				// Parse the data for a more user friendly look, such as links and emojis
				tweetdivs = Autolinker.link(twemoji.parse(tweetdivs, function(icon, options, variant) {
					return 'https://twemoji.maxcdn.com/16x16/' + icon + '.png';
				}));
				
				// present the tweets
				$('#tweets').html(tweetdivs);
				
				// Finish the progress
				completeProgress();
			});
		} else {
			// User didn't input something so tell them
			if (searchquery == '' && countryname == 'Worldwide') {
				showError("A search term and place is required to get tweets.");
			} else if (searchquery == '') {
				showError("A search term is required to fetch tweets.");
			} else if (countryname == 'Worldwide') {
				showError("A place is required to fetch tweets from. (Global tweets not available)");
			}
		}
	});

	// Init the selection bar
	initPlaceSelect();
});
///////////////////////////////////////////////////////////////////////////

// A nice error box to show the user what happened
function showError(message) {
	BootstrapDialog.show({
        title: 'Error',
		message: message,
		type: BootstrapDialog.TYPE_DANGER
	});
}

// Begin the "progress"
function startProgress() {
	$('.progress-bar').width(0);
	$(".progress-bar").show();
	var progresswidth = $('.progress').width();
	
	// A lot of websites do this so I don't want to hear any complaints
	$('.progress-bar').width(progresswidth/2);
}

// Complete the progress bar so the user knows it can do things
function completeProgress() {
	var progresswidth = $('.progress').width();
	$('.progress-bar').width(progresswidth);
	
	// Wait a little bit before removing the full bar so the user knows it completed
	setTimeout(function() {
		$(".progress-bar").hide();
	}, 500);
}

// Get the user inputted trends from the search bar
function searchTrends() {
	var search = $('#inputDefault').val();
	
	// If the bar isn't empty
	if (search != '') {
		// save the search for global use
		currentQ = search;
		
		// find out where we are right now
		var regionplace = currentCountry;
		
		// if the user is on the full map then search the world
		if (currentView == 'countries') regionplace = 'world';
		
		// get the trends for that area about that topic
		getGTrends(currentQ, currentCountry, function(successData) {
			var ops = {
				region: regionplace,
				resolution: currentView
			};
			
			// redraw the map with the data
			reDrawChart(successData, ops);
		});
	} else {
		// tell the user to type something
		showError("A search term is required.");
	}
}

// Clear the map data 
function clearMap() {
	
	// Junk data 
	data = google.visualization.arrayToDataTable([
		['Place', 'Searches'],
		['', 0]
	]);
	
	// Remove the selected topic on the right sidebar
	$(".topItem").removeClass('active');
	
	// Remove the current query
	currentQ = '';
	
	// Redraw the now empty chart
	chart.draw(data, defaultOptions);
}

// Initialise the select box for trending data
function initPlaceSelect() {
	var selectops = "<option value=''>Worldwide</option>";;
	for(x in lockeys) {
		selectops += "<option value='" + lockeys[x] + "'>" + lockeys[x] + "</option>";
	}
	$("#select").html(selectops);
}

// Redraw the chart with the new data and possible options
function reDrawChart(dataArray, options) {
	
	// If google doesn't have enough data for us then show an error
	if (typeof dataArray[0].message !== 'undefined') {
		// detailed_message = Not enough search volume to show results.
		// message 			= Could not complete request
		var message = dataArray[0].message;
		
		// If we got a detailed message show that
		// Sometimes we don't though
		if (typeof dataArray[0].detailed_message !== 'undefined') {
			message = dataArray[0].detailed_message;
		}
		
		// Finish "loading" and show errors
		showError(message);
		completeProgress();

		// Reset variables and buttons to the correct view
		currentView = 'countries';
		$('#back_col').text('Clear All');
		return;
	}
	
	// Conver the data
	data = google.visualization.arrayToDataTable(dataArray);
	
	// Set the view
	var view = new google.visualization.DataView(data);
	
	// if we have options and the options have a view then use that
	// this is for the tooltip and presenting the correct data in it
	if ((typeof options !== 'undefined') && (typeof options.view !== 'undefined')) {
		view.setColumns(options.view);
	} else {
		view.setColumns([2, 1]);
	}
	
	// Get the default options
	var currentOptions = defaultOptions;
	
	// If options are given then use them instead
	if (typeof options !== 'undefined') {
		for(op in options) {
			currentOptions[op] = options[op];
		}
	}
	
	// Redraw the chart with new data and options
	chart.draw(view, currentOptions);
}

// Initial call to initialise the chart and events
function drawRegionsMap() {
	
	// Junk data
	data = google.visualization.arrayToDataTable([
		['Place', 'Searches'],
		['', 0]
	]);
	
	// Init the chart and draw the data
	chart = new google.visualization.GeoChart(document.getElementById('chart'));
	chart.draw(data, defaultOptions);
	
	// Init event handlers for the chart
	google.visualization.events.addListener(chart, 'select', selectHandler);
	google.visualization.events.addListener(chart, 'ready', imReady);
	
	google.visualization.events.addListener(chart, 'select', function() {
		chart.setSelection(chart.getSelection());
	});
}

// The chart has finished loading to complete progress
function imReady() {
	console.log("I'm ready!");
	completeProgress();
}

// The event handler for when the user clicks on the chart and we have data for it
function selectHandler(e) {	
	// Get the selected region name
	var selection = chart.getSelection();
	var item = selection[0];
	var countryname = data.getFormattedValue(item.row, 2);
	// Place it in the box 
	$('#worldsearch').val(countryname);
	
	// If we have a query and we aren't already zoomed in
	if (currentQ != '' && currentView != 'provinces') {
		
		// Get the country code
		var selection = chart.getSelection();
		var item = selection[0];
		var selectdata = data.getFormattedValue(item.row, 0);
		
		// Save globally
		currentCountry = selectdata;
		
		// Begin getting the data
		startProgress()
		getGTrends(currentQ, selectdata, function(successData) {
			currentView = 'provinces';
			var ops = {
				region: selectdata,
				resolution: 'provinces'
			};
			
			$('#back_col').text('Back to world map');
			reDrawChart(successData, ops);
		});
	}
}

// Fetch the trends for the query and place
// Calls the callback with the data
function getGTrends(q, geo, callme) {
    $.ajax({
        url: 'trends',
        method: 'get',
		data: {
			q: q,
			geo: geo
		},
        success: function(data) {
			callme(data);
        }
    });
}

// Fetch the hot trends for the place (relating to the dropdown menu)
// Places them in the sidebar and inits the event handlers for clicks, etc.
function getGHotSearches(place) {
    $.ajax({
        url: 'hot',
        method: 'get',
		data: { geo: place },
        success: function(data) {
			var divs = "<div id='topTrends' class='list-group'>";
			for(x in data) {
				divs += "<a class='topItem list-group-item'>";
				
				// the google icon for easy searching on a topic
				divs += "<img src='images/favicon.ico' class='img-badge' data-href='//google.com" + data[x].titleLinkUrl + "' data-toggle='tooltip' data-placement='top' data-container='body' title='' data-original-title='Search on Google'>";
				
				// The search volume
				divs += "<span class='badge'>" + data[x].formattedTraffic + "</span>";
				
				// The search query
				divs += "<div class='itemTitle'>" + data[x].title + "</div>";
				divs += "</a>";
			}
			divs += "</div>";
			
			// Place the data on the page
			$('#trends').html(divs);
			
			// Initialise the tooltips
			$('[data-toggle="tooltip"]').tooltip();
			
			// event handler for the topics
			$(".topItem").click(function() {
				
				// Set the active topic
				$(".topItem").removeClass('active');
				$(this).addClass("active");
				 
				// Set the query in the searchbar and save it globally
				var q = $(".itemTitle", this).text();
				$('#inputDefault').val(q);
				currentQ = q;
				
				// If the user is currently looking at a zoomed in map then refine the search
				// for that location
				var geo = '';
				if (currentView == 'provinces') {
					geo = currentCountry;
				}
				
				// begin getting the data
				startProgress();
				
				// fetch the search volume on the specific topic the user clicked in relation
				// to where they are now on the chart
				getGTrends(q, geo, function(successData) {
					
					// set the correct chart options for the current view
					if (currentView == 'countries') {
						currentView = 'countries';
						var ops = {
							region: 'world',
							resolution: currentView
						};
					} else {
						currentView = 'provinces';
						var ops = {
							region: currentCountry,
							resolution: currentView
						};
					}
					
					// Save the data for later
					currentData = successData;
					
					// redraw the chart
					reDrawChart(successData, ops);
				});
			});
			
			// event handler for the user clicking the google icon
			$('.img-badge').click(function() {
				window.open($(this).attr('data-href'),'_blank');
				console.log($(this).attr('data-href'));
			});
        }
    });
}

// Fetch the tweets for the specific place about the query
function getTweets(q, geo, callme) {
    $.ajax({
        url: 'twit',
        method: 'get',
		data: {
			q: q,
			geo: geo
		},
        success: function(data) {
			callme(data);
        }
    });
}
