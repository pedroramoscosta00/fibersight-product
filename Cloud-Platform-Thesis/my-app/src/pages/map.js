import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Slider from '@mui/material/Slider';

//Import datasets
import geojsonData1 from '../fiber-points/fiber_points.geojson';
import geojsonData2 from '../fiber-points/fiber_points2.geojson';
import geojsonData3 from '../fiber-points/fiber_points3.geojson';
import geojsonData4 from '../fiber-points/fiber_points4.geojson';
import geojsonData5 from '../fiber-points/fiber_points5.geojson';

//Import components
import { FiberToggles } from '../components/fiberToggles';
import { TempScale } from '../components/tempScale';
import { WeatherWidget } from '../components/weatherWidget';

function Map() {
  //Map element
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(16);
  const [activeParameter, setActiveParameter] = useState('temperature'); // Changed to match config keys
  const [isHeatMapVisible, setIsHeatMapVisible] = useState(true); // Default to visible


  const toggleHeatMap = (fiberId, isVisible) => {
    const layerId = `heatmap-layer-${fiberId}`;

    if (mapRef.current && mapRef.current.getLayer(layerId)) {
      mapRef.current.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
    }
  };



  //Slider element
  const [sliderValue, setSliderValue] = useState(25);  // Add state for the slider value

  //Map element
  //Define color schemes for each parameter
  const parameterConfig = {
    temperature: {
      colorStops: [
        0, 'rgba(0, 0, 255, 0)',
        0.5, 'rgba(254, 240, 119, 0.5)',
        1, 'rgba(237, 106, 70, 1)'
      ],
      weightRange: [0, 35],
      unit: '°C'
    },
    moisture: {
      colorStops: [
        0, 'rgba(33, 102, 172, 0)',
        0.5, 'rgba(167, 219, 243, 0.5)',
        1, 'rgba(66, 80, 158, 1)'
      ],
      weightRange: [0, 20],
      unit: '%'
    }
  };

  //Slider element
  const handleSliderChange = (event, newValue) => {
    // Update slider value
    setSliderValue(newValue);

    //Get the approppriate GeoJson file based on slider value
    const newGeoJson = getGeoJsonForSliderValue(newValue);

    //Update the source of the map with the new GeoJson
    if (mapRef.current) {
      mapRef.current.getSource('fiber-points').setData(newGeoJson);
    }
  }

  //Map element
  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoicGVkcm9jb3N0YTI1IiwiYSI6ImNtOGczbGowcDBsM2EyaXF4MnJneTdmYjYifQ.od-UfH6VA3Zo5vPo7Mey5g';

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [-7.794940, 37.933671],
      zoom: zoomLevel,
    });


    mapRef.current = map;

    const initializeMap = () => {
      //Remove labels from map
      const layers = map.getStyle().layers;
      layers.forEach(layer => {
        if (layer.type === 'symbol') {
          map.removeLayer(layer.id);
        }
      });

      //Add source
      map.addSource('fiber-points', {
        type: 'geojson',
        data: geojsonData1,
      });

      //Add heatmap layer
      map.addLayer({
        id: 'heatmap-layer-1',
        type: 'heatmap',
        source: 'fiber-points',
        paint: getHeatmapPaintConfig()
      });

      //Add circle layer to represent each fiber point
      map.addLayer({
        id: 'circle-layer',
        type: 'circle',
        source: 'fiber-points',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            17.5, 0,
            18, 5
          ],
          'circle-color': '#f8f8ff',
          'circle-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            17.5, 0,
            18, 0.5
          ],
          "circle-stroke-width": 1,
          "circle-stroke-color": '#252525',
          'circle-stroke-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            17.5, 0,
            18, 0.5
          ],
        },
      });
    }

    map.on('load', initializeMap);
    map.on('zoom', () => setZoomLevel(map.getZoom()));

    return () => map.remove();

  }, []);

  //Update heatmap when parameter changes
  useEffect(() => {
    if (mapRef.current && mapRef.current.getLayer('heatmap-layer-1')) {
      const config = parameterConfig[activeParameter];
      if (!config) return;

      mapRef.current.setPaintProperty('heatmap-layer-1', 'heatmap-color', [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        ...config.colorStops
      ]);

      mapRef.current.setPaintProperty('heatmap-layer-1', 'heatmap-weight', [
        'interpolate',
        ['linear'],
        ['get', activeParameter],
        config.weightRange[0], 0,
        config.weightRange[1], 1
      ]);
    }
  }, [activeParameter]);


  //useEffect to update hover popup when switching parameters
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
    });

    const handleMouseEnter = (e) => {
      if (e.features?.length > 0) {
        const feature = e.features[0];
        const value = feature.properties[activeParameter];
        const coordinates = feature.geometry.coordinates;

        if (!coordinates || coordinates.length < 2 || isNaN(coordinates[0]) || isNaN(coordinates[1])) {
          console.warn("Invalid coordinates:", coordinates);
          return;
        }

        const unit = parameterConfig[activeParameter]?.unit || '';

        popup
          .setLngLat(coordinates.slice(0, 2))
          .setHTML(`<strong>${activeParameter}: </strong> ${value}${unit}`)
          .addTo(map);

        map.getCanvas().style.cursor = 'pointer';
      }
    };

    const handleMouseLeave = () => {
      popup.remove();
      map.getCanvas().style.cursor = '';
    };

    //Remove old event listeners before adding new ones
    map.off('mouseenter', 'circle-layer', handleMouseEnter);
    map.off('mouseleave', 'circle-layer', handleMouseLeave);

    //Add event listeners again with updated activeParameter
    map.on('mouseenter', 'circle-layer', handleMouseEnter);
    map.on('mouseleave', 'circle-layer', handleMouseLeave);

    //Cleanup function
    return () => {
      map.off('mouseenter', 'circle-layer', handleMouseEnter);
      map.off('mouseleave', 'circle-layer', handleMouseLeave);
    };
  }, [activeParameter]);  //Re-run when activeParameter changes


  //Helper function for heatmap paint config
  const getHeatmapPaintConfig = () => {
    const config = parameterConfig[activeParameter];
    if (!config) return {};

    return {
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        ...config.colorStops
      ],
      'heatmap-weight': [
        'interpolate',
        ['linear'],
        ['get', activeParameter],
        config.weightRange[0], 0,
        config.weightRange[1], 1
      ],
      'heatmap-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        16, 15,
        40, 5
      ],
      'heatmap-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        16, 1,
        40, 0
      ]
    };
  };

  console.log(zoomLevel);

  //Slider element
  const geoJsonFiles = [
    geojsonData1,
    geojsonData2,
    geojsonData3,
    geojsonData4,
    geojsonData5
  ];

  const getGeoJsonForSliderValue = (sliderValue) => {
    const index = Math.floor(sliderValue / 25);
    return geoJsonFiles[index];
  }

  return (
    <div className="map-body">
      <div className="map-parent">
        <div className="map-div" ref={mapContainerRef} />

        <FiberToggles onTagClick={toggleHeatMap} />

        <WeatherWidget />

        <TempScale activeParameter={activeParameter} />

      </div>

      <div className='slider-box'>
        <div className='slider-bt'>
          <button
            className={`slider-temp-bt ${activeParameter === 'temperature' ? 'active' : ''}`}
            onClick={() => setActiveParameter('temperature')}

          >
            Temperature
          </button>
          <button
            className={`slider-moist-bt ${activeParameter === 'moisture' ? 'active' : ''}`}
            onClick={() => setActiveParameter('moisture')}
          >
            Moisture
          </button>
        </div>

        <div className='slider-parent'>
          <Slider
            className='slider'
            aria-label="Temperature/Moisture Slider"
            defaultValue={25}
            valueLabelDisplay="auto"
            step={25}
            marks
            min={0}
            max={100}

            value={sliderValue}
            onChange={handleSliderChange}
          />
          <div className='slider-label'>
            <label width="5rem" align-self="stretch">1h15min</label>
            <label width="2.8125rem">1h</label>
            <label width="9.5625rem">45min</label>
            <label width="2.8125rem">30min</label>
            <label width="5rem">15min</label>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Map };
