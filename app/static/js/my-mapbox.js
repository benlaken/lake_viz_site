

var nav = new mapboxgl.NavigationControl();
var map = new mapboxgl.Map({
    container: 'map',
    center: [12.945578003813353, 64.48815159548138],
    zoom: 6,
    // style: 'mapbox://styles/mapbox/light-v9',
    style:'mapbox://styles/mapbox/satellite-v9',
    // style: 'mapbox://styles/mapbox/cjaudgl840gn32rnrepcb9b9g',
    touchZoomRotate: true,
    pitch: 20,
});
map.addControl(new mapboxgl.FullscreenControl());
map.addControl(nav, 'top-left');
map.addControl(new mapboxgl.ScaleControl(
                {
                    maxWidth: 80,
                    unit: 'metric'
                    }
                    ));
// map.addControl(new MapboxGeocoder({
//                     accessToken: mapboxgl.accessToken
//                                     }
//             ));

// TURN ON BELOW TO ACTIVATE DYNAMIC HILL SHADING EFFECT
// map.on('load', function () {
//     map.addSource('dem', {
//         "type": "raster-dem",
//         "url": "mapbox://mapbox.terrain-rgb"
//     });
//     map.addLayer({
//         "id": "hillshading",
//         "source": "dem",
//         "type": "hillshade"
//     // insert below waterway-river-canal-shadow;
//     // where hillshading sits in the Mapbox Outdoors style
//     }, 'waterway-river-canal-shadow');
// });

// Example of using Carto to serve vector tiles from:
// https://bl.ocks.org/jatorre/6212354d5e023076797db7ea18540c33

map.on('style.load', function () {

// Calling CARTO Maps API to get two vector layers
//The order under what the layers are defined determines
//the name of the source-layer on the vector tiles.
//First layer is named layer0, then layer1, etc..

var username = "benlaken";
var mapConfig =
        {"version":"1.3.0",
        "stat_tag":"API",
        "layers":[
                    {"type":"cartodb",
                    "options":{
                        "sql":"select cartodb_id, ROUND(area::numeric, 3) as area, eb_id, the_geom_webmercator from ecco_test",
                        "cartocss":"#l{}",
                        "cartocss_version":"2.1.0"
                        }
                    }
        ]
    };
    var encodedConfig = encodeURIComponent(JSON.stringify(mapConfig))

    nanoajax.ajax({
        url:'https://'+username+'.carto.com/api/v1/map?config='+encodedConfig},
        function (code, resp){
            cartoLayer = JSON.parse(resp);

            //Create a MapboxGL CARTO source
            var baseCartoURL = "https://cartocdn-ashbu_{s}.global.ssl.fastly.net/";
            var cartoSource = {
                type: 'vector',
                tiles: [baseCartoURL.replace("{s}","a")+username+'/api/v1/map/'+cartoLayer.layergroupid+'/{z}/{x}/{y}.mvt',baseCartoURL.replace("{s}","b")+username+'/api/v1/map/'+cartoLayer.layergroupid+'/{z}/{x}/{y}.mvt',baseCartoURL.replace("{s}","c")+username+'/api/v1/map/'+cartoLayer.layergroupid+'/{z}/{x}/{y}.mvt',baseCartoURL.replace("{s}","d")+username+'/api/v1/map/'+cartoLayer.layergroupid+'/{z}/{x}/{y}.mvt'],
                minzoom: 3,
                maxzoom: 18
            };
            map.addSource('cartoSource', cartoSource);

            //Add the first layer to the map POLYGONS
            map.addLayer({
                'id': 'cartoPolygonLayer',
                'type': 'fill',
                'source': 'cartoSource',
                'source-layer': 'layer0',
                'layout': {
                    'visibility': 'visible'
                },
                "paint": {
                    "fill-opacity": 0.75,
                    "fill-color": "rgba(76, 195, 255, 1)",
                    "fill-outline-color": "rgba(63, 248, 255, 1)"
                }
            });
        }
    );

});


// EVENTS BELOW

// When a click event occurs on a feature in the places layer, open a popup at the
// location of the feature, with description HTML from its properties.
map.on('click', 'cartoPolygonLayer', function (e) {
    //var geom_object = e.features[0].geometry;
    var area = e['features'][0]['properties']['area'];
    var eb_id = e['features'][0]['properties']['eb_id'];
    var coordinates = e['lngLat'];
    earthEngineAndList(eb_id);
    var description = `<h4>Lake ${eb_id}</h4> <p><b>lat, lng</b>: ${coordinates['lat']}, ${coordinates['lng']} </br><b>Area</b>=${area}km² </p>`;
    new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(description)
        .addTo(map);
});


// note that tables get a uniqe id of 'tbl_${eb_id}'
function createTableFromData(data, eb_id) {
    //console.log('inside table maker:', data, eb_id);
    var tableHtml = `<div class="table-responsive" id="tbl_${eb_id}" style="display:none;"> <caption>Landsat data retrieved from Earth Engine</caption>`;
    tableHtml += '<table class="table table-hover">';
    var currentRowHtml;
    // Add the table headers
    tableHtml +='<thead class="thead-dark"> <tr> <th>Date</th>';
    var keys = Object.keys(data);
    for (var i = 0, length = keys.length; i < length; i++) {
        currentRowHtml = '<th scope="col">' + keys[i] + '</th>';
        tableHtml += currentRowHtml;
    };
    tableHtml +='</tr> </thead>';
    // Extract the dates items
    tableHtml +='<tbody class="tbody-striped">'
    var array_dates = [];   //empty array to hold the table dates
    for (x in Object.values(data)[0]) {
        //var tmp = Date(x);
        //array_dates.push(tmp.toString());
        array_dates.push(x);
    };
    for (var i = 0, length = array_dates.length; i < length; i++){
        tableHtml += '<tr>';
        tableHtml += `<td> ${array_dates[i]} </td>`;
        //var x = array_dates[i]
        //tableHtml += `<td>${(new Date(x).getDate())+"/"+(new Date(x).getMonth() + 1)+"/"+(new Date(x).getFullYear())}</td>`;
        for (var j = 0, key_len = keys.length; j < key_len; j++){
            tmp_element = data[keys[j]][array_dates[i]]
            if(tmp_element != null && tmp_element != '') {
                tableHtml += `<td>${data[keys[j]][array_dates[i]].toFixed(2)}</td>`;
             } else {
                tableHtml += `<td>None</td>`;
             }
        };
        tableHtml += '</tr>';
    };
    tableHtml += '</tbody>'
    tableHtml +='</table> </div>';
    return tableHtml;
}


// Add an item of html to the list below the map using Jquery
function populateList(eb_id, data=null){
    $("#dynamic-title").text("Selected lakes");
    var searchWord=`${eb_id}`;
    var exists=$('#dynamic-list li:contains('+searchWord+')').length;
    if( !exists){
        var tableToAppend = createTableFromData(data, eb_id);
        var tmp_html = `<li class='list-group-item'><h4><button id="tableButton_${eb_id}" onclick="hideShow(eb_id='${eb_id}')">`+
                        `<i class="fas fa-table fa-1x"></i></button> Lake ${eb_id}</h4>` +
                        //`Earth engine sample response - B1: ${JSON.stringify(data['B1'])}` +
                        tableToAppend +
                        `</li>`;
        $(`#loader_${eb_id}`).css("display","none"); // remove spinner...
        $("#dynamic-list").append(tmp_html); // ...then add the list item
        } else {
            //console.log(`${eb_id} is in list - no need to do anything`)
        }
    };


function hideShow(eb_id){
    var x = document.getElementById(`tbl_${eb_id}`);
    if (x.style.display === "none") {
        x.style.display = "block";
    } else {
        x.style.display = "none";
    }
};



// Change the cursor to a pointer when the mouse is over the places layer.
map.on('mouseenter', 'cartoPolygonLayer', function () {
    map.getCanvas().style.cursor = 'pointer';
});

// Change it back to a pointer when it leaves.
map.on('mouseleave', 'cartoPolygonLayer', function () {
    map.getCanvas().style.cursor = '';
});

// IF a lake ID is entered directly via search Form action
$('#myForm').submit(function(e) {
        console.log('Form function triggered');
        // need to add logical test here for loader
        if($(`#loader_${eb_id}`).length == 0) {
            var tmp_loader = `<li class='list-group-item' id="loader_${eb_id}"> <div class="loader"></div> </li>`;
            $("#dynamic-list").append(tmp_loader);
        };
        e.preventDefault();
        var tmp = $("#myForm").serialize();
        var search_id = tmp.split('=')[1];
        //console.log(search_id);
        $('#myForm')[0].reset();
        // alert(`Currently Search is not built yet. If you really want to find ${search_id || 'a particular lake'} please contact me to finish building it.`);
        var sql = `SELECT cartodb_id, ROUND(area::numeric, 3) as area, eb_id, the_geom, ST_AsText(ST_Envelope(the_geom)) as bbox FROM ecco_test WHERE eb_id = '${search_id}'`
        var url = 'https://benlaken.carto.com/api/v2/sql?' + $.param({q: sql, format: "GeoJSON"})
        //console.log('Calling',url)
        var test;
        fetch(url)
            .then(function(response) {
                return response.json();
            })
            .then(function(myJson) {
                //console.log('action!', myJson);
                // highlight the lake on the map
                map.addLayer({
                    'id': `lake_${search_id}`,
                    'type': 'fill',
                    'source': {
                        'type': 'geojson',
                        'data': myJson['features'][0],
                    },
                    'layout': {},
                    'paint': {
                        'fill-color': '#ffff2d',
                        'fill-opacity': 0.5
                    }
                });
                // Dynamically obtain data from earth engine,process it, and add the it to the html list
                //populateList(eb_id=search_id);
                earthEngineAndList(eb_id=search_id);
                var corners = myJson['features'][0]['properties']['bbox'].split('(')[2].split(')')[0].split(',')
                // Use the bounding box to zoom to the lake
                map.fitBounds([[
                                corners[0].split(' ')[0],
                                corners[0].split(' ')[1]
                            ], [
                                corners[2].split(' ')[0],
                                corners[2].split(' ')[1]
                            ]],
                            {
                              padding: {top: 10, bottom:10, left: 10, right: 10}
                              }
                        );
             });
});


function earthEngineAndList(eb_id){
    // immediatley add a loader to the list...
    if($(`#loader_${eb_id}`).length == 0) {
        var tmp_loader = `<li class='list-group-item' id="loader_${eb_id}"> <div class="loader"></div> </li>`;
        $("#dynamic-list").append(tmp_loader);
    };
    var testPy = fetch(`/py_func?eb_id=${eb_id}`)
    .then((resp) => resp.json())
    .then(function(data){
        populateList(eb_id=eb_id, data=data);
    });
};

// Access contents of the promse e.g. via testPy.then(value => console.log(value))
// var testPy = fetch('http://localhost:5000/py_func?eb_id=1038dh').then((response) => {
//     if(response.ok) {
//     return response.json();
//     } else {
//     throw new Error('Server response wasn\'t OK');
//     }
// })

// var landsat = fetch('http://localhost:5000/py_func?eb_id=1038dh')
//     .then((resp) => resp.json()) // Transform the data into json
//     .then(function(data) {
//                             // Create and append the li's to the ul
//                             //console.log('inside', data)
//                             $.each(data, function(key, value) {
//                                 console.log(key, value);
//                             });
//                             return data;
//                         }
//         );