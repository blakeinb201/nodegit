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
	colorAxis: {colors: ['#FFBFBF', '#B30000']},
	backgroundColor: '#81d4fa',
	datalessRegionColor: '#FFFFFF',
	defaultColor: '#008C69',
};

// Init stuff

google.load("visualization", "1", {packages:["geochart"]});
google.setOnLoadCallback(drawRegionsMap);


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
	$("#overlay").hide();
});

//

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

function reDrawChart(dataArray, options) {
	/*data = google.visualization.arrayToDataTable([
		['State', 'Searches'],
		['AU-QLD', 200],
		['AU-NSW', 300]
	]);*/
	if (typeof dataArray[0].detailed_message !== 'undefined') {
		// detailed_message = Not enough search volume to show results.
		// message 			= Could not complete request
		console.log("maddss"); //show some errors about it
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
	
	if (currentView == 'provinces') {
		$("#overlay").show();
	} else {
		$("#overlay").hide();
	}
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
	
	avaliableTrendData();
	
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
		});
	} else if (currentView != 'provinces') {
		var selection = chart.getSelection();
		var item = selection[0];
		var selectdata = data.getFormattedValue(item.row, 0);
		console.log(selectdata);
		getGHotSearches(selectdata)
		//currentCountry
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
				divs += "<div class='topItem'>";
				
				divs += "<div class='itemTitle'>" + data[x].title + "</div>";
				divs += "<div class='searches'>" + data[x].formattedTraffic + "</div>";
				divs += "<div class='place'>" + data[x].country + "</div>";
				
				divs += "</div>";
			}
			divs += "</div>";
			
			$('#trends').html(divs);
			
			$(".topItem").click(function() {
				var q = $(".itemTitle", this).text();
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








