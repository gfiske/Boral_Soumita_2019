
//March 2019
//The purpose of this script is to investigate the precip trends within the
//Ganges and Brahmaputra sub-watersheds/catchment polygons for Boral, Soumita et. al 2019

// Add vector layers
var geometry = 
        ee.Geometry.Polygon(
        [[[61.0556640625, 38.35469619129983],
          [61.0556640625, 4.31917128046396],
          [112.3837890625, 4.31917128046396],
          [112.3837890625, 38.35469619129983]]], null, false);
var GangesBrah = ee.FeatureCollection("users/gfiske/GlobalRivers/GangesBrahSheds");
var catchments = ee.FeatureCollection("users/gfiske/GlobalRivers/Valier_GangesBrah_subwatersheds_final")

// Add in the CHIRPS precip data
var year1 = 2010;
var year2 = 2011;
var years = ee.List.sequence(year1, year2);
var precip = ee.ImageCollection("UCSB-CHG/CHIRPS/PENTAD")
            .filterDate(year1 + '-01-01',year2 + '-12-31')
            //.filter(ee.Filter.dayOfYear(182, 304)) //optionally filter for either monsoon (182,304) 
            //.filter(ee.Filter.dayOfYear(305, 181)) //or non-monsoon (305,181) seasons
            .map(function(img){
              var d = ee.Date(ee.Number(img.get('system:time_start')));
              var y = ee.Number(d.get('year'));
              return img.set({'year':y});
            });
var precipCount = precip.size();

// Check number of images in the collection
print('precipCount collection count: ', precipCount);
var meanPrecip = precip.mean();

// Setup map
Map.setCenter(86.5, 23.7, 5);
var precpalette = ["edf8b1","7fcdbb","2c7fb8"];
Map.addLayer(meanPrecip.clip(geometry), {min:0.5,max:70, palette:precpalette}, "mean precip", true);
Map.addLayer(GangesBrah, {}, "Ganges Brahmaputra", false);
Map.addLayer(catchments, {}, "catchments draft 1", true);

// Summarize each image in the 5-day precip image collection for each feature in the table collection
var results = precip.map(function(image) {
  return image.reduceRegions({
    collection: catchments,
    reducer: ee.Reducer.sum(), 
  }).map(function(f) {
    // Add a date property to each output feature.
    return f.set('date', image.date().format("YYYY-MM-dd"));
  });
});

// Export the results to a CSV file
Export.table.toDrive(ee.FeatureCollection((results).sort('code_id',true).flatten()).select([".*"], null, false), 'catchment_precipResults', 'Earth Engine Exports', 'catchment_precipResults', 'CSV');

