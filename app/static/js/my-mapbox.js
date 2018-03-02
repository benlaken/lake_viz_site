

var nav = new mapboxgl.NavigationControl();
var map = new mapboxgl.Map({
    container: 'map',
    center: [12.945578003813353, 64.48815159548138],
    zoom: 6,
    style: 'mapbox://styles/mapbox/light-v9',
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

map.on('load', function() {
    map.addLayer({
        'id': 'ECCO Lakes',
        'type': 'raster',
        'source': {
            'type': 'raster',
            'tiles': [
                'https://cartocdn-ashbu_a.global.ssl.fastly.net/benlaken/api/v1/map/benlaken@fd81823b@319b1009cb5b842304ede10c3f9b95f4:1519931840254/1/{z}/{x}/{y}.png'
            ],
            'tileSize': 256
        },
        'paint': {}
    }, 'aeroway-taxiway');
});
