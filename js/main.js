$("#document").ready(function(){
// 5.Tạo cửa sổ hiển thị thuộc tính của bản đồ
var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');
var overlay = new ol.Overlay(({
    element: container,
    autoPan: true,
    autoPanAnimation: {
        duration: 250
    }
}));
// 6.5: Ket hop livesearch va permalink
var shouldUpdate = true;
var center = [564429.04, 2317738.2];
var zoom = 16.56631263565161;
var rotation = 0;
closer.onclick = function () {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
};
//1.Hiển thị lớp bản đồ GIS lên Web
var format = "image/png";
var bounds = [564182.125,2317466.0,564514.4375,2318014.0];
var camhoangdc = new ol.layer.Image ({
    source: new ol.source.ImageWMS ({
        ratio: 1,
        url: 'http://localhost:1222/geoserver/camhoang/wms',
        params: {
            'FORMAT': format,
            'VERSION': '1.1.0',
            STYLES: '',
            LAYERS: 'camhoang:camhoangdc'
        }
    })
});
var camhoanggt = new ol.layer.Image ({
    source: new ol.source.ImageWMS ({
        ratio: 1,
        url: 'http://localhost:1222/geoserver/camhoang/wms',
        params: {
            'FORMAT': format,
            'VERSION': '1.1.0',
            STYLES: '',
            LAYERS: 'camhoang:camhoanggt'
        }
    })
});
var camhoangub = new ol.layer.Image ({
    source: new ol.source.ImageWMS ({
        ratio: 1,
        url: 'http://localhost:1222/geoserver/camhoang/wms',
        params: {
            'FORMAT': format,
            'VERSION': '1.1.0',
            STYLES: '',
            LAYERS: 'camhoang:camhoangub'
        }
    })
});
var projection = new ol.proj.Projection ({
    code: 'EPSG:3405',
    units: 'm',
    axisOrientation: 'neu'
});
var map = new ol.Map ({
    target: 'map',
    layers: [camhoangdc, camhoanggt, camhoangub],
// 5.Khai báo overlay vào trong đối tượng map
    overlays: [overlay],
    // view: view
    // 6.5: them doan code vao view
    view: new ol.View ({
        projection: projection,
        center: center,
        zoom: zoom,
        rotation: rotation
    }),
});
// 6.5: Tim kiem doi tuong theo URL
if (window.location.hash !== ''){
    var hash = window.location.hash.replace('#map=', '');
    var parts = hash.split('/');
    if(parts.length === 4){
        zoom = parseInt(parts[0], 10);
        center = [
            parseFloat(parts[1]),
            parseFloat(parts[2])
        ];
        rotation = parseFloat(parts[3]);
    };
};
map.getView().fit(bounds,map.getSize());
// 2. Bật(tắt) lớp bản đồ
$("#checkcamhoangdc").change(function(){
    if($("#checkcamhoangdc").is(":checked")){
        camhoangdc.setVisible(true)
    }
    else{
        camhoangdc.setVisible(false)
    }
});
$("#checkcamhoanggt").change(function(){
    if($("#checkcamhoanggt").is(":checked")){
        camhoanggt.setVisible(true)
    }
    else{
        camhoanggt.setVisible(false)
    }
});
$("#checkcamhoangub").change(function(){
    if($("#checkcamhoangub").is(":checked")){
        camhoangub.setVisible(true)
    }
    else{
        camhoangub.setVisible(false)
    }
});
// 6.4: Enable permalink
var updatePermalink = function(){
    if (!shouldUpdate){
        shouldUpdate = true;
        return;
    };
    var center = view.getCenter();
    var hash = '#map=' + view.getZoom() + '/' + Math.round(center[0] * 100) / 100 + '/' + Math.round(center[1] * 100) / 100 + '/' + view.getRotation();
    var state = {
        zoom: view.getZoom(),
        center: view.getCenter(),
        rotation: view.getRotation()
    };
    window.history.pushState(state, 'map', hash);
};
map.on('moveend', updatePermalink);
window.addEventListener('popstate', function(event){
    if(event.state === null){
        return;
    };
    map.getView().setCenter(event.state.center);
    map.getView().setZoom(event.state.zoom);
    map.getView().setRotation(event.state.rotation);
    shouldUpdate = false;
});
function di_den_camhoangub(x, y) {
    var vi_tri = ol.proj.fromLonLat([x, y], projection);
    view.animate({
        center: vi_tri,
        duration: 2000,
        zoom: 20
    });
};
// 4. Hiển thị nổi bật đối tượng được chọn dạng vùng
var styles = {
    'MultiPolygon': new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'red',
            width: 5
        })
    })
};
var styleFunction = function(feature){
    return styles[feature.getGeometry().getType()];
};
var vectorLayer = new ol.layer.Vector({
    style: styleFunction
});
map.addLayer(vectorLayer);
// 3. Lấy thông tin đối tượng
    map.on('singleclick',function(evt){
        var view = map.getView();
        var viewResolution = view.getResolution();
        var source = camhoangdc.getSource();
        var url = source.getFeatureInfoUrl(evt.coordinate, viewResolution, view.getProjection(),{'INFO_FORMAT': 'application/json', 'FEATURE_COUNT': 50});
        if(url){
            $.ajax({
                type: "POST",
                url: url,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                success: function(n) {
                    var content = "<table>";
                    for(var i = 0; i<n.features.length ;i++){
                        var feature = n.features[i];
                        var featureAttr = feature.properties;
                        content += "<tr><td>Loại đất:" + featureAttr["txtmemo"] + "</td><td>Diện tích:" + featureAttr["shape_area"] + "</td></tr>"
                    }
                    content += "</table>";
                    $("#info").html(content);
                    // 5.Đổi #info sang popup-content
                    $("#popup-content").html(content);
                    overlay.setPosition(evt.coordinate);
                    // 4. Hiển thị nổi bật đối tượng được chọn dạng vùng
                    var vectorSource = new ol.source.Vector({
                        features: (new ol.format.GeoJSON()).readFeatures(n)
                    });
                    vectorLayer.setSource(vectorSource);
                }
            })
        }
    })
})