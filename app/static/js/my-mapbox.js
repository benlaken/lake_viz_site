

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
                    // ,{"type":"cartodb",
                    // "options":{
                    //     "sql":"select cartodb_id,the_geom_webmercator from table_400k",
                    //     "cartocss":"#l{}",
                    //     "cartocss_version":"2.1.0"
                    //     }
                    // }
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

            //Add a second layer to the map, e.g. of type POINTS
            // map.addLayer({
            //     'id': 'cartoPointLayer',
            //     'type': 'circle',
            //     'source': 'cartoSource',
            //     'source-layer': 'layer1',
            //     'layout': {
            //         'visibility': 'visible'
            //     },
            //     "paint": {
            //         "circle-stroke-color": "rgba(232, 28, 28, 1)",
            //         "circle-color": "rgba(236, 14, 14, 0.33)",
            //         "circle-radius": 5,
            //         "circle-stroke-width": 1,
            //         "circle-pitch-scale": "map",
            //         "circle-blur": 0

            //     }
            // });

        }
    );

});


// EVENTS BELOW

// When a click event occurs on a feature in the places layer, open a popup at the
// location of the feature, with description HTML from its properties.
map.on('click', 'cartoPolygonLayer', function (e) {
    //console.log('Clicked the map!',e );
    //var geom_object = e.features[0].geometry;
    var area = e['features'][0]['properties']['area'];
    var eb_id = e['features'][0]['properties']['eb_id'];
    var coordinates = e['lngLat'];
    var landsat_data = fetch(`http://localhost:5000/py_func?eb_id=${eb_id}`).then((response) => {
        if(response.ok) {
            return response.json();
        } else {
            throw new Error('Server response wasn\'t OK');
        }
    })
    //console.log(coordinates);
    var description = `<h4>Lake ${eb_id}</h4> <p><b>lat, lng</b>: ${coordinates['lat']}, ${coordinates['lng']} </br><b>Area</b>=${area}km² </p>`;
    new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(description)
        .addTo(map);
    populateList(eb_id=eb_id, data=landsat_data);  //issue here <- need to pass the resolved json object
    //landsat_data.await(console.table(landsat_data));
});

// We also need to populate the html list below the map:
// will do this via Jquery.
function populateList(eb_id, data=null){
    $("#dynamic-title").text("Selected lakes");
    var searchWord=`${eb_id}`;
    var exists=$('#dynamic-list li:contains('+searchWord+')').length;
    // console.log('exists:', exists);
    if( !exists){
        //console.log(`${eb_id} shouldnt be in list`)
        $("#dynamic-list").append(`<li class='list-group-item'>Info for lake ${eb_id}: ${data}</li>`);
        } else {`${eb_id} is in list - no need to do anything`}
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
                console.log('action!', myJson);
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


                // Add the lake to the list
                populateList(eb_id=search_id);
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

function earthEngineCall(eb_id){
    var testPy = fetch(`http://localhost:5000/py_func?eb_id=${eb_id}`).then((response) => {
        if(response.ok) {
            return response.json();
        } else {
            throw new Error('Server response wasn\'t OK');
        }
    })
    return testPy;
};

// Access contents of the promse e.g. via testPy.then(value => console.log(value))
var testPy = fetch('http://localhost:5000/py_func?eb_id=1038dh').then((response) => {
    if(response.ok) {
    return response.json();
    } else {
    throw new Error('Server response wasn\'t OK');
    }
})