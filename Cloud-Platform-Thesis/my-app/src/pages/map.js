import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Slider from '@mui/material/Slider';

//Import components
import { FiberToggles } from '../components/fiberToggles';
import { TempScale } from '../components/tempScale';
import { WeatherWidget } from '../components/weatherWidget';

export const systemFolders = ['system1', 'system2', 'system3'];
export const fileNames = [
  'geo-2025-06-01.geojson',
  'geo-2025-06-02.geojson',
  'geo-2025-06-03.geojson',
  'geo-2025-06-04.geojson',
  'geo-2025-06-05.geojson',
];

const fetchSystemFiles = async (system) =>
  Promise.all(
    fileNames.map(fileName =>
      fetch(`/fiber-points/${system}/${fileName}`).then(res => res.json())
    )
  );

const fetchGeoJson = async (fileName) => {
  const response = await fetch(`/fiber-points/system1/${fileName}`);
  if (!response.ok) throw new Error(`Failed to fetch ${fileName}`);
  return response.json();
};

function preprocessGeoJson(geoJson, activeParameter, systemName) {
  if (!geoJson || !geoJson.features) return { type: "FeatureCollection", features: [] };
  const processed = JSON.parse(JSON.stringify(geoJson));
  processed.features.forEach(feature => {
    feature.properties.system = systemName;
    const ts = feature.properties?.timeSeries;
    if (Array.isArray(ts) && ts.length > 0) {
      feature.properties.temperature = ts[0].temperature;
      feature.properties.moisture = ts[0].moisture;
    } else {
      feature.properties.temperature = null;
      feature.properties.moisture = null;
    }
  });
  return processed;
}

const systemParameterConfig = {
  system1: {
    temperature: {
      colorStops: [
        0, 'rgba(0, 0, 255, 0)',
        0.5, 'rgba(254, 240, 119, 0.5)',
        1, 'rgba(237, 106, 70, 1)'
      ],
      weightRange: [18, 33],
      unit: '°C'
    },
    moisture: {
      colorStops: [
        0, 'rgba(33, 102, 172, 0)',
        0.5, 'rgba(167, 219, 243, 0.5)',
        1, 'rgba(66, 80, 158, 1)'
      ],
      weightRange: [5.80, 6.05],
      unit: '%'
    }
  },
  system2: {
    temperature: {
      colorStops: [
        0, 'rgba(0, 0, 255, 0)',
        0.5, 'rgba(254, 240, 119, 0.5)',
        1, 'rgba(237, 106, 70, 1)'
      ],
      weightRange: [15, 30],
      unit: '°C'
    },
    moisture: {
      colorStops: [
        0, 'rgba(33, 102, 172, 0)',
        0.5, 'rgba(167, 219, 243, 0.5)',
        1, 'rgba(66, 80, 158, 1)'
      ],
      weightRange: [2.80, 3.1],
      unit: '%'
    }
  },
  system3: {
    temperature: {
      colorStops: [
        0, 'rgba(0, 0, 255, 0)',
        0.5, 'rgba(254, 240, 119, 0.5)',
        1, 'rgba(237, 106, 70, 1)'
      ],
      weightRange: [21, 35],
      unit: '°C'
    },
    moisture: {
      colorStops: [
        0, 'rgba(33, 102, 172, 0)',
        0.5, 'rgba(167, 219, 243, 0.5)',
        1, 'rgba(66, 80, 158, 1)'
      ],
      weightRange: [7.80, 8],
      unit: '%'
    }
  }
};

function Map() {
  //Map element
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(16);
  const [activeParameter, setActiveParameter] = useState('temperature'); // Changed to match config keys
  const [isHeatMapVisible, setIsHeatMapVisible] = useState(true); // Default to visible
  const [mapLoaded, setMapLoaded] = useState(false);
  const [systemFiles, setSystemFiles] = useState({});

  const [geoJsonFiles, setGeoJsonFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAllSystemFiles = async () => {
      const allFiles = {};
      for (const system of systemFolders) {
        allFiles[system] = await fetchSystemFiles(system);
      }
      setSystemFiles(allFiles);
    };
    loadAllSystemFiles();
  }, []);

  useEffect(() => {
    if (systemFiles.system2) {
      console.log('system2 features:', systemFiles.system2[0]?.features?.length);
      console.log('system2 sample feature:', systemFiles.system2[0]?.features?.[0]);
    }
  }, [systemFiles]);

  useEffect(() => {
    const loadGeoJsonFiles = async () => {
      try {
        const loadedFiles = await Promise.all(
          fileNames.map(fileName => fetchGeoJson(fileName))
        );
        setGeoJsonFiles(loadedFiles);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadGeoJsonFiles();
  }, []);

  const toggleHeatMap = (fiberId, isVisible) => {
    const heatmapLayerId = `heatmap-layer-${fiberId}`;
    const circleLayerId = `circle-layer-${fiberId}`;

    if (mapRef.current) {
      if (mapRef.current.getLayer(heatmapLayerId)) {
        mapRef.current.setLayoutProperty(heatmapLayerId, 'visibility', isVisible ? 'visible' : 'none');
      }
      if (mapRef.current.getLayer(circleLayerId)) {
        mapRef.current.setLayoutProperty(circleLayerId, 'visibility', isVisible ? 'visible' : 'none');
      }
    }
  };

  //Slider element
  const [sliderValue, setSliderValue] = useState(25);  // Add state for the slider value

  //Map element
  //Define color schemes for each parameter
  /*const parameterConfig = {
    temperature: {
      colorStops: [
        0, 'rgba(0, 0, 255, 0)',
        0.5, 'rgba(254, 240, 119, 0.5)',
        1, 'rgba(237, 106, 70, 1)'
      ],
      weightRange: [15, 25],
      unit: '°C'
    },
    moisture: {
      colorStops: [
        0, 'rgba(33, 102, 172, 0)',
        0.5, 'rgba(167, 219, 243, 0.5)',
        1, 'rgba(66, 80, 158, 1)'
      ],
      weightRange: [5, 7],
      unit: '%'
    }
  };*/

  //Slider element
  const handleSliderChange = (event, newValue) => {
    // Update slider value
    setSliderValue(newValue);

    //Get the approppriate GeoJson file based on slider value
    const newGeoJson = getGeoJsonForSliderValue(newValue);
    const processedGeoJson = preprocessGeoJson(newGeoJson, activeParameter);

    //Update the source of the map with the new GeoJson
    if (mapRef.current) {
      mapRef.current.getSource('fiber-points').setData(processedGeoJson);
    }
  }

  //Map element
  useEffect(() => {
    if (loading) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoicGVkcm9jb3N0YTI1IiwiYSI6ImNtOGczbGowcDBsM2EyaXF4MnJneTdmYjYifQ.od-UfH6VA3Zo5vPo7Mey5g';

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [-7.795230387481382, 37.93632356754527],
      zoom: zoomLevel,
      cooperativeGestures: true
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

      const initialGeoJson = geoJsonFiles[0];

      //Add source
      map.addSource('fiber-points', {
        type: 'geojson',
        data: preprocessGeoJson(initialGeoJson, activeParameter),
      });

      //Add heatmap layer
      /*map.addLayer({
        id: 'heatmap-layer-1',
        type: 'heatmap',
        source: 'fiber-points',
        paint: getHeatmapPaintConfig()
      });*/

      //Add circle layer to represent each fiber point

    }

    map.on('load', () => {
      initializeMap();
      setMapLoaded(true); // <--- set loaded
    });
    map.on('zoom', () => setZoomLevel(map.getZoom()));

    return () => map.remove();

  }, [loading]);

  //Update heatmap when parameter changes
  useEffect(() => {
    if (mapRef.current && mapRef.current.getLayer('heatmap-layer-1')) {
      const config = systemParameterConfig[activeParameter];
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

  useEffect(() => {
    if (!mapLoaded) return;
    if (!systemFiles || Object.keys(systemFiles).length === 0) return;

    const map = mapRef.current;

    systemFolders.forEach(system => {
      const files = systemFiles[system];
      if (!files || !files.length) return;
      const source = map.getSource(`fiber-points-${system}`);
      if (source) {
        const newGeoJson = getGeoJsonForSliderValue(files, sliderValue);
        source.setData(preprocessGeoJson(newGeoJson, activeParameter, system));
      }
    });
  }, [sliderValue, activeParameter, mapLoaded, systemFiles]);

  useEffect(() => {
    if (!mapLoaded) return;
    const map = mapRef.current;
    systemFolders.forEach(system => {
      const layerId = `heatmap-layer-${system}`;
      const config = systemParameterConfig[system][activeParameter]; // <-- CORRECT
      if (map.getLayer(layerId) && config) {
        map.setPaintProperty(layerId, 'heatmap-color', [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          ...config.colorStops
        ]);
        map.setPaintProperty(layerId, 'heatmap-weight', [
          'interpolate',
          ['linear'],
          ['get', activeParameter],
          config.weightRange[0], 0,
          config.weightRange[1], 1
        ]);
      }
    });
  }, [activeParameter, mapLoaded]);


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

        const system = feature.properties.system || 'system1';
        const unit = systemParameterConfig[system][activeParameter]?.unit || '';

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

    // Remove old event listeners before adding new ones
    systemFolders.forEach(system => {
      map.off('mouseenter', `circle-layer-${system}`, handleMouseEnter);
      map.off('mouseleave', `circle-layer-${system}`, handleMouseLeave);

      map.on('mouseenter', `circle-layer-${system}`, handleMouseEnter);
      map.on('mouseleave', `circle-layer-${system}`, handleMouseLeave);
    });

    // Cleanup function
    return () => {
      systemFolders.forEach(system => {
        map.off('mouseenter', `circle-layer-${system}`, handleMouseEnter);
        map.off('mouseleave', `circle-layer-${system}`, handleMouseLeave);
      });
    };
  }, [activeParameter, mapLoaded]);

  //Helper function for heatmap paint config
  const getHeatmapPaintConfig = (config) => {
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

  //console.log(zoomLevel);

  function getGeoJsonForSliderValue(files, sliderValue) {
    if (!files || !files.length) return { type: "FeatureCollection", features: [] };
    const index = Math.max(0, Math.min(files.length - 1, Math.floor(sliderValue / 25)));
    return files[index] || { type: "FeatureCollection", features: [] };
  }

  // Update your useEffect that depends on the GeoJSON data
  useEffect(() => {
    if (!mapLoaded) return;
    if (!systemFiles || Object.keys(systemFiles).length === 0) return;

    const map = mapRef.current;

    systemFolders.forEach(system => {
      // Only add if not already present
      if (!map.getSource(`fiber-points-${system}`)) {
        const files = systemFiles[system];
        if (!files || !files.length) return;
        map.addSource(`fiber-points-${system}`, {
          type: 'geojson',
          data: preprocessGeoJson(files[0], activeParameter, system),
        });
        const config = systemParameterConfig[system][activeParameter];
        const firstSymbolId = map.getStyle().layers.find(l => l.type === 'symbol')?.id;

        map.addLayer({
          id: `heatmap-layer-${system}`,
          type: 'heatmap',
          source: `fiber-points-${system}`,
          paint: getHeatmapPaintConfig(config)
        }, firstSymbolId);
        // Add the circle layer for this system
        map.addLayer({
          id: `circle-layer-${system}`,
          type: 'circle',
          source: `fiber-points-${system}`,
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
        }, firstSymbolId);
      }
    });
  }, [mapLoaded, systemFiles, activeParameter]);

  if (loading) return <div>Loading map data...</div>;
  if (error) return <div>Error loading data: {error}</div>;


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
