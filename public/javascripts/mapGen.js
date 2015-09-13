//var locs = {"AU":"p8","AR":"p30","AT":"p44","BE":"p41","BR":"p18","CA":"p13","CL":"p38","CO":"p32","CZ":"p43","DK":"p49","EG":"p29","FI":"p50","FR":"p16","DE":"p15","GR":"p48","HK":"p10","HU":"p45","IN":"p3","ID":"p19","IL":"p6","IT":"p27","JP":"p4","KE":"p37","MY":"p34","MX":"p21","NL":"p17","NG":"p52","NO":"p51","PH":"p25","PL":"p31","PT":"p47","RO":"p39","RU":"p14","SA":"p36","SG":"p5","ZA":"p40","KR":"p23","ES":"p26","SE":"p42","CH":"p46","TW":"p12","TH":"p33","TR":"p24","UA":"p35","GB":"p9","US":"p1","VN":"p28"};
var locs = {"Australia":"p8","Argentina":"p30","Austria":"p44","Belgium":"p41","Brazil":"p18","Canada":"p13","Chile":"p38","Colombia":"p32","Czech Republic":"p43","Denmark":"p49","Egypt":"p29","Finland":"p50","France":"p16","Germany":"p15","Greece":"p48","Hong Kong":"p10","Hungary":"p45","India":"p3","Indonesia":"p19","Israel":"p6","Italy":"p27","Japan":"p4","Kenya":"p37","Malaysia":"p34","Mexico":"p21","Netherlands":"p17","Nigeria":"p52","Norway":"p51","Philippines":"p25","Poland":"p31","Portugal":"p47","Romania":"p39","Russia":"p14","Saudi Arabia":"p36","Singapore":"p5","South Africa":"p40","South Korea":"p23","Spain":"p26","Sweden":"p42","Switzerland":"p46","Taiwan":"p12","Thailand":"p33","Turkey":"p24","Ukraine":"p35","United Kingdom":"p9","United States":"p1","Vietnam":"p28"};

var lockeys = Object.keys(locs);
var chart;
var data;

var currentQ = '';
var currentView = 'countries';
var currentData = '';

var currentCountry = '';

var defaultOptions = {
	legend: 'none',
	//sizeAxis: { minValue: 0, maxValue: 100 },
	region: 'world', // 'US'	'AU-QLD		world
	resolution: '',//provinces or metros		This wants provinces
	colorAxis: {colors: ['#F3fff9', '#099']},
	backgroundColor: '#292F33',
	datalessRegionColor: '#999999 ',
	defaultColor: '#008C69',
};

// Init stuff

google.load("visualization", "1", {packages:["geochart"]});
google.setOnLoadCallback(drawRegionsMap);


/*
$(window).resize(function(){
	// possible resize on window change.
  drawChart();
});
*/

$(function() {
	getGHotSearches();
	$("#overlay").click(function(){
		currentCountry = '';
		currentView = 'countries';

		if (currentQ != '') {
			//reDrawChart(currentData, ops);
			getGTrends(currentQ, currentCountry, function(successData) {
				currentView = 'countries';
				var ops = {
					region: 'world',
					resolution: 'countries'
				};
				console.log("one");
				reDrawChart(successData, ops);
				console.log("two");

			});
		}
	});
	
	$('#back_col').click(function() {
		if ($(this).text() == "Clear All") {
			clearMap();
			$('#inputDefault').val('');
			//avaliableTrendData();
		} else {
			$('#back_col').text('Clear All')
			currentCountry = '';
			currentView = 'countries';

			if (currentQ != '') {
				//reDrawChart(currentData, ops);
				getGTrends(currentQ, currentCountry, function(successData) {
					currentView = 'countries';
					var ops = {
						region: 'world',
						resolution: 'countries'
					};
					console.log("one");
					reDrawChart(successData, ops);
					console.log("two");

				});
			}
		}
		console.log($(this).text());
	});
	
	$('#select').on('change', function() {
		getGHotSearches(this.value);
		//console.log(this.value); // or $(this).val()
	});
	
	$('#searchbuttom').click(searchTrends);
	
	$("#inputDefault").keyup(function (e) {
		if (e.keyCode == 13) {
			searchTrends();
		}
	});
	
	$("#overlay").hide();
	//$("#errorbox").hide();
	
	$('#tweetButton').click(function() {
		if (currentQ != '' && currentCountry != '') {
			getTweets(currentQ, currentCountry, function(successData) {
				console.log(successData);
			});
		}
	});
	
	initPlaceSelect();
	
	document.getElementById("center").removeAttribute("style");

});

/*

$(".input1").keyup(function (e) {
    if (e.keyCode == 13) {
        // Do something
    }
});*/

//

function searchTrends() {
	console.log('wowo');
	var search = $('#inputDefault').val();
	if (search != '') {
		currentQ = search;
		var regionplace = currentCountry;
		if (currentView == 'countries') regionplace = 'world';
			getGTrends(currentQ, currentCountry, function(successData) {
			var ops = {
				region: regionplace,
				resolution: currentView
			};
			console.log(ops);
			reDrawChart(successData, ops);
		});
	}
}

function clearMap() {
	data = google.visualization.arrayToDataTable([
		['Place', 'Searches'],
		['', 0]
	]);
	$(".topItem").removeClass('active');
	currentQ = '';
	chart.draw(data, defaultOptions);
}


function initPlaceSelect() {
	//#select
	var selectops = "<option value=''>Worldwide</option>";;
	for(x in lockeys) {
		selectops += "<option value='" + lockeys[x] + "'>" + lockeys[x] + "</option>";
	}
	$("#select").html(selectops);
}


function avaliableTrendData() {
	var arr = [['Place', 'Searches']];
	for(x in lockeys) {
		arr.push([lockeys[x], 1]);
	}
	var ops = {
		view: [0]
	}
	reDrawChart(arr, ops);
}

function errorbox(errormsg) {
	var errordiv = '<div id="errors" class="alert alert-dismissible alert-danger text-center">' +
						'<button type="button" class="close" data-dismiss="alert">×</button>' +
						'<strong id="errortext">' + errormsg + '</strong>' +
					'</div>';
	$('#errorbox').html(errordiv);
}
/*
				<div id="errors" class="alert alert-dismissible alert-danger text-center">
					<button type="button" class="close" data-dismiss="alert">×</button>
					<strong id="errortext">Not enough search volume to show results</strong>
				</div>
*/


function reDrawChart(dataArray, options) {
	/*data = google.visualization.arrayToDataTable([
		['State', 'Searches'],
		['AU-QLD', 200],
		['AU-NSW', 300]
	]);*/
	if (typeof dataArray[0].message !== 'undefined') {
		// detailed_message = Not enough search volume to show results.
		// message 			= Could not complete request
		console.log("maddss"); //show some errors about it
		var message = dataArray[0].message;
		if (typeof dataArray[0].detailed_message !== 'undefined') {
			message = dataArray[0].detailed_message;
		}
		errorbox(message);
		return;
	}
	
	data = google.visualization.arrayToDataTable(dataArray);
	
	// this is some bullshit
	/*
	var formatter = new google.visualization.PatternFormat('{0}');
	formatter.format( data, [0,1], 0 );
	var formatter = new google.visualization.PatternFormat('{2}');
	formatter.format( data, [0,1,2], 0 )
	*/
	
	var view = new google.visualization.DataView(data);
	
	if ((typeof options !== 'undefined') && (typeof options.view !== 'undefined')) {
		view.setColumns(options.view);
	} else {
		view.setColumns([2, 1]);
	}
	//
	
	var currentOptions = defaultOptions;
	
	if (typeof options !== 'undefined') {
		for(op in options) {
			currentOptions[op] = options[op];
		}
	}
	
	//console.log("started..");
	chart.draw(view, currentOptions);
}

function drawRegionsMap() {
	data = google.visualization.arrayToDataTable([
		['Place', 'Searches'],
		['', 0]
	]);

	chart = new google.visualization.GeoChart(document.getElementById('chart'));
	
	chart.draw(data, defaultOptions);
	
	// only fires for existing data
	google.visualization.events.addListener(chart, 'select', selectHandler);
	google.visualization.events.addListener(chart, 'ready', imReady);
	google.visualization.events.addListener(chart, 'regionClick', regionSelect);
	
	google.visualization.events.addListener(chart, 'select', function() {
		chart.setSelection(chart.getSelection());
	});
	
	//avaliableTrendData();
	
	//avaliableTrendData();
}

function regionSelect(place) {
	//console.log(place);
}

function imReady() {
	//console.log("I'm ready!");
}


function selectHandler(e) {	
	//console.log(data.getFormattedValue(item.row, 2));
	if (currentQ != '' && currentView != 'provinces') {
		var selection = chart.getSelection();
		var item = selection[0];
		var selectdata = data.getFormattedValue(item.row, 0);
		currentCountry = selectdata;
		getGTrends(currentQ, selectdata, function(successData) {
			currentView = 'provinces';
			var ops = {
				region: selectdata,
				resolution: 'provinces'
			};
			reDrawChart(successData, ops);
			$('#back_col').text('Back to world map')
		});
	}
}

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

function getGHotSearches(place) {
    $.ajax({
        url: 'hot',
        method: 'get',
		data: { geo: place },
        success: function(data) {
			var divs = "<div id='topTrends'>";
			for(x in data) {
				divs += "<a class='topItem list-group-item'>";
				
				divs += "<div class='itemTitle list-group-item-heading h5'>" + data[x].title + "</div>";
				divs += "<div class='searches list-group-item-text'>" + data[x].formattedTraffic + "</div>";
				//divs += "<div class='place'>" + data[x].country + "</div>";
				
				divs += "</a>";
			}
			divs += "</div>";
			
			$('#trends').html(divs);
			
			$(".topItem").click(function() {
				$(".topItem").removeClass('active');
				$(this).addClass("active");
				 
				var q = $(".itemTitle", this).text();
				$('#inputDefault').val(q);
				currentQ = q;
				var geo = '';
				if (currentView == 'provinces') {
					geo = currentCountry;
				}
				getGTrends(q, geo, function(successData) {
					if (currentView == 'countries') {
						currentView = 'countries';
						var ops = {
							region: 'world',
							resolution: currentView
						};
					} else {
						currentView = 'provinces';
						console.log(currentCountry);
						var ops = {
							region: currentCountry,
							resolution: currentView
						};
					}
					currentData = successData;
					reDrawChart(successData, ops);
				});
				//initChart();
				
			});
        }
    });
}

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


/*
function makeDiv(){
    var divsize = ((Math.random()*100) + 50).toFixed();
    var color = '#'+ Math.round(0xffffff * Math.random()).toString(16);
    $newdiv = $('<div/>').css({
        'width':divsize+'px',
        'height':divsize+'px',
        'background-color': color
    });
    
    var posx = (Math.random() * ($(document).width() - divsize)).toFixed();
    var posy = (Math.random() * ($(document).height() - divsize)).toFixed();
    
    $newdiv.css({
        'position':'absolute',
        'left':posx+'px',
        'top':posy+'px',
        'display':'none'
    }).appendTo( 'body' ).fadeIn(100).delay(300).fadeOut(200, function(){
       $(this).remove();
      // makeDiv(); 
    }); 
}
*/






