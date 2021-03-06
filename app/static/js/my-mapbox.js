

var nav = new mapboxgl.NavigationControl();
var map = new mapboxgl.Map({
    container: 'map',
    center: [12.945578003813353, 64.48815159548138],
    zoom: 6,
     //style: 'mapbox://styles/mapbox/light-v9',
    style:'mapbox://styles/mapbox/satellite-v9',
    //style: 'mapbox://styles/mapbox/cjaudgl840gn32rnrepcb9b9g',
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

var layerData = {
        user_name: 'benlaken',
        sublayers: [{
          sql: "SELECT cartodb_id, ROUND(area::numeric, 3) as area, eb_id, the_geom_webmercator from ecco_test",
        cartocss: "#l{polygon-fill: #ff0000}"
            }],
        maps_api_template: 'https://benlaken.carto.com'
    };

cartodb.Tiles.getTiles(layerData, function (result, error) {
      if (result == null) {
        //console.log("error: ", error.errors.join('\n'));
        return;
      }
      //console.log("url template is ", result.tiles[0]);

      var tiles = result.tiles.map(function (tileUrl) {
        return tileUrl
          .replace('{s}', 'a')
          .replace(/\.png/, '.mvt');
      });
      //console.log('Tiles from:',tiles);
      map.addSource('lake_source', { type: 'vector', tiles: tiles });
      map.addLayer({
          id: 'lakePolygonLayer',
          'type': 'fill',
          'source': 'lake_source',
          'source-layer': 'layer0',
        'layout': {
                    'visibility': 'visible'
            },
          'paint': {
                    "fill-opacity": 0.75,
                    "fill-color": "rgba(76, 195, 255, 1)",
                    "fill-outline-color": "rgba(63, 248, 255, 1)"
          }
      });
    });



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



// EVENTS BELOW

// When a click event occurs on a feature in the places layer, open a popup at the
// location of the feature, with description HTML from its properties.
map.on('click', 'lakePolygonLayer', function (e) {
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
                try {
                    tableHtml += `<td>${data[keys[j]][array_dates[i]].toFixed(2)}</td>`;
                }
                catch(err) {
                    tableHtml += `<td>${data[keys[j]][array_dates[i]]}</td>`;
                }
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

function createVisFromData(data, eb_id){
    // Now I need to construct a json object with the right format:
    // data: {values: [{'a':'date','b': 1unit}]}
    // with color as a list that will go into an argument
    var keys = Object.keys(data['colors']);
    var tmp_vals = [];
    for(var i = 0, length = keys.length; i < length; i++){
        tmp_vals.push(
                    {"a": keys[i],
                     "b": 1,
                     "color": data['colors'][keys[i]]
                    }
                );
    };
    var myVlSpec = {
                    "$schema": "https://vega.github.io/schema/vega-lite/v2.0.json",
                    "width": 600,
                    "height": 200,
                    "title": "Landsat 8 SR falsecolor [B4 B3 B1]: color scaled over min/max counts of -300/700",
                    "description": "Landsat 8 surface reflectance falsecolor [B4 B3 B1]: min/max radiance of -200/600",
                    "data": {
                    "values": tmp_vals,
                    },
                    "mark": "bar",
                    "encoding": {
                                "x": {"timeUnit": "yearmonthdatehoursseconds",
                                    "title": 'Date',
                                    "field": "a",
                                    "type": "temporal",
                                    "axis": {"title": "",
                                             "ticks": false,
                                             "labels":{"format": "timeFormat(datum.value, '%b %Y')"},
                                            },
                                    },
                                "y": {"field": "b",
                                    "type": "quantitative",
                                    "axis": {"title": null, "labels": false}
                                    },
                                "color": {
                                    "field": "color",
                                    "type": "nominal",
                                    "scale": null
                                        },
                                },
                    "config": {
                        "bar": {
                                 "binSpacing": 0,
                                },
                        "axis":{"grid":false},
                            }
                    };
    vegaEmbed(`#vis_${eb_id}`, myVlSpec);
};


// Add an item of html to the list below the map using Jquery
function populateList(eb_id, data=null){
    $("#dynamic-title").text("Selected lakes");
    var exists=$(`#tbl_${eb_id}`).length;
    if(!exists){
        var tableToAppend = createTableFromData(data, eb_id);
        var tmp_html = `<li class='list-group-item'><h4>`+
                        `<button id="tableButton_${eb_id}" onclick="hideShow(eb_id='${eb_id}')">`+
                        `<i class="fas fa-table fa-1x"></i></button> Lake ${eb_id}</h4>` +
                        //`Earth engine sample response - B1: ${JSON.stringify(data['B1'])}` +
                        tableToAppend +
                        `<div id="vis_${eb_id}"></div>` +
                        `</li>`;
        $(`#loader_${eb_id}`).css("display","none"); // remove spinner...
        $("#dynamic-list").append(tmp_html); // ...then add the list item
        createVisFromData(data, eb_id); //add the data structure to the vis div
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
        //console.log('Form function triggered');
        // need to add logical test here for loader
        e.preventDefault();
        var tmp = $("#myForm").serialize();
        var eb_id = tmp.split('=')[1];
        //console.log(search_id);
        $('#myForm')[0].reset();
        // alert(`Currently Search is not built yet. If you really want to find ${search_id || 'a particular lake'} please contact me to finish building it.`);
        var sql = `SELECT cartodb_id, ROUND(area::numeric, 3) as area, eb_id, the_geom, ST_AsText(ST_Envelope(the_geom)) as bbox FROM ecco_test WHERE eb_id = '${eb_id}'`
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
                    'id': `lake_${eb_id}`,
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
                // if($(`#loader_${eb_id}`).length == 0) {
                //     var tmp_loader = `<li class='list-group-item' id="loader_${eb_id}"> <div class="loader"></div> </li>`;
                //     $("#dynamic-list").append(tmp_loader);
                // };
                earthEngineAndList(eb_id=eb_id);
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
        var tmp_loader = `<li class='list-group-item' id="loader_${eb_id}">`+
                        `<div class="row">`+
                            `<div class="column-3">`+
                                `<div class="loader"></div>`+
                            `</div>`+
                            `<div class="column-9">`+
                                `<p style="margin-top: 0.6rem; margin-left: 1rem;">Loading data for lake ${eb_id}</p>`+
                            `</div>`+
                         `</div>`+
                         `</li>`;
        $("#dynamic-list").append(tmp_loader);
    };
    var exists=$(`#tbl_${eb_id}`).length;
    if(!exists){
        var testPy = fetch(`/py_func?eb_id=${eb_id}`)
        .then((resp) => resp.json())
        .then(function(data){
            populateList(eb_id=eb_id, data=data);
        });
    };
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