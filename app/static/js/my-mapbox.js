

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
map.addControl(new mapboxgl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true
                                },
                trackUserLocation: true
                }));
map.addControl(new mapboxgl.ScaleControl(
                {
                    maxWidth: 80,
                    unit: 'metric'
                    }
                    ));
map.addControl(new MapboxGeocoder({
                    accessToken: mapboxgl.accessToken
                                    }
            ));

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



// map.on('load', function() {
//     map.addLayer({
//         'id': 'ECCO Lakes',
//         'type': 'raster',
//         'source': {
//             'type': 'raster',
//             'tiles': [
//                 'https://cartocdn-ashbu_a.global.ssl.fastly.net/benlaken/api/v1/map/benlaken@fd81823b@319b1009cb5b842304ede10c3f9b95f4:1519931840254/1/{z}/{x}/{y}.png'
//             ],
//             'tileSize': 256
//         },
//         'paint': {}
//     }, 'aeroway-taxiway');
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
                        "sql":"select cartodb_id, the_geom_webmercator from ecco_test",
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


// When a click event occurs on a feature in the places layer, open a popup at the
// location of the feature, with description HTML from its properties.
// map.on('click', 'ECCO Lakes', function (e) {
//     console.log('Clicked the map!')
//     // var coordinates = e.features[0].geometry.coordinates.slice();
//     // var description = e.features[0].properties.description;

//     // // Ensure that if the map is zoomed out such that multiple
//     // // copies of the feature are visible, the popup appears
//     // // over the copy being pointed to.
//     // while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
//     //     coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
//     // }

//     // new mapboxgl.Popup()
//     //     .setLngLat(coordinates)
//     //     .setHTML(description)
//     //     .addTo(map);
// });