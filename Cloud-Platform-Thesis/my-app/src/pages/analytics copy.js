import { useState, useRef, useEffect, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Plot from 'react-plotly.js';

//Components
import { GroupToggle } from '../components/groupToggle';

// GeoJSON data import
const geojsonDataPromise = import('../fiber-points/fiber_chart_data4.geojson')
  .then(module => {
    return typeof module.default === 'string' ? fetch(module.default).then(r => r.json()) : module.default;
  });

// Mapbox setup
mapboxgl.accessToken = 'pk.eyJ1IjoicGVkcm9jb3N0YTI1IiwiYSI6ImNtOGczbGowcDBsM2EyaXF4MnJneTdmYjYifQ.od-UfH6VA3Zo5vPo7Mey5g';

/*
 * Generates a color map for features
 * @param {Array} features - Array of GeoJSON features
 * @returns {Object} - Color mapping object {featureId: color}
 */

// Color generator function
const generateColorMap = (features) => {
  const colorMap = {};

  features.forEach((feature, index) => {
    const id = feature.properties?.id || index;

    // Generate a truly random HSL color
    const hue = Math.floor(Math.random() * 360);       // Random hue between 0–359
    const saturation = 60 + Math.random() * 20;         // Random saturation between 60–80%
    const lightness = 45 + Math.random() * 10;          // Random lightness between 45–55%

    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    colorMap[id] = color;

    if (feature.properties) {
      feature.properties.color = color;
    }
  });

  return colorMap;
};



/*
 * Validates and cleans GeoJSON data
 * @param {Object} data - GeoJSON data
 * @returns {Object|null} - Validated GeoJSON or null if invalid
 */

//Validate the geojson data
const validateGeoJson = (data) => {
  if (!data || typeof data !== 'object') return null;

  //Ensure its FeatureCollection
  if (data.type !== 'FeatureCollection') {
    if (data.features) {
      return {
        type: 'FeatureCollection',
        features: data.features
      };
    }
    return null;
  }

  //Validate features array
  if (!Array.isArray(data.features)) return null;

  //Clean each feature
  const cleanFeatures = data.feature.map(f => ({
    type: 'Feature',
    geometry: f.geometry || { type: 'Point', coordinates: [0, 0] },
    properties: f.properties || {}
  })).filter(f =>
    f.geometry &&
    f.geometry.coordinates &&
    Array.isArray(f.geometry.coordinates) &&
    f.geometry.coordinates.length >= 2
  );

  return {
    type: 'FeatureCollection',
    features: cleanFeatures
  };
};


/*
 * Groups features and calculates averages
 * @param {Array} features - Array of features
 * @param {number} groupSize - Sensors per group
 * @param {string} activeParameter - 'temperature' or 'moisture'
 * @returns {Array} - Grouped features
 */

const groupAveragePoints = (features, groupSize, activeParameter) => {
  const groupedFeatures = [];

  //Create groups
  for (let i = 0; i < features.length; i += groupSize) {
    const group = features.slice(i, i + groupSize);
    if (group.length === 0) continue;

    //Calculate the average values for each timestamp
    const timeMap = {};

    group.forEach(feature => {
      feature.properties.timeSeries.forEach(entry => {
        const timeKey = new Date(entry.timestamp).toISOString();
        timeMap[timeKey] = timeMap[timeKey] || { sum: 0, count: 0, timestamp: entry.timestamp };
        timeMap[timeKey].sum += entry[activeParameter];
        timeMap[timeKey].count++;
      });
    });

    //create averaged time series
    const averagedTimeSeries = Object.values(timeMap).map(({ sum, count, timestamp }) => ({
      timestamp,
      [activeParameter]: sum / count
    }));

    groupedFeatures.push({
      ...group[0],
      properties: {
        ...group[0].properties,
        timeSeries: averagedTimeSeries,
        id: `group-${Math.floor(i / groupSize)}`,
        groupId: Math.floor(i / groupSize)
      },
      geometry: group[0].geometry
    });
  }

  return groupedFeatures;
}


/**
 * Time series chart component
 */

const TimeSeriesChart = ({ processedFeatures, colorMap, activeParameter }) => {
  if (!processedFeatures || !colorMap) {
    return <div>Loading data...</div>;
  }

  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

  const plotData = processedFeatures.map((feature) => {
    const id = String(feature.properties?.id);
    const isGroup = id.includes('Group');

    return {
      x: feature.properties.timeSeries.map(entry => new Date(entry.timestamp)),
      y: feature.properties.timeSeries.map(entry => entry[activeParameter]),
      type: 'scatter',
      mode: 'lines',
      line: { color: colorMap[id], width: isGroup ? 3 : 1 },

      name: isGroup ? `Group ${id.split('-')[1]}` : `Sensor ${id}`
    };
  }).filter(Boolean);

  const layout = {
    paper_bgcolor: isDarkMode ? '#4A4A4A' : '#FFFFFF',
    plot_bgcolor: isDarkMode ? '#4A4A4A' : '#FFFFFF',
    font: {
      color: isDarkMode ? '#f8f8ff' : '#252525',
    },
    title: {
      text: activeParameter === 'temperature' ? 'Temperature Over the last 24h' : 'Moisture Over the last 24h',
      font: { size: 20 },
      y: 0.98,
      yanchor: 'top',
      xanchor: 'center',
      x: 0.5
    },
    xaxis: {
      title: {
        text: 'Time',
        font: { size: 15 },
        standoff: 15
      },
      type: 'date',
      tickformat: '%H:%M',
      automargin: true  // Let Plotly handle margin
    },
    yaxis: {
      title: {
        text: activeParameter === 'temperature' ? 'Temperature (°C)' : 'Moisture (%)',
        font: { size: 15 },
        standoff: 20
      },
      automargin: true
    },
    // Main chart margins - critical for layout
    margin: {
      l: 70,   // Left
      r: 70,   // Right
      b: 80,   // Bottom (space for x-axis)
      t: 60,   // Top (space for title)
      pad: 0   // No extra padding
    },
    // Legend configuration
    legend: {
      orientation: 'h',
      yanchor: 'top',
      y: -0.1,         // Positions legend below chart
      xanchor: 'center',
      x: 0.5,
      // Control dimensions
      itemwidth: 40,    // Wider items
      itemsizing: 'constant',
      itemheight: 15,   // Shorter height
      font: {
        size: 11,
        color: 'var(--text-color)',     // Smaller font
      },
      // Visual styling
      bgcolor: 'var(--card-bg)',
      bordercolor: '#ddd',
      borderwidth: 1,
      margin: {
        l: 0,
        r: 0,
        t: 0,
        b: 0,
      },
      wrap: true,
      valign: 'middle',
    },
    // Layout behavior
    autosize: {
      type: 'plot',
      expand: false
    },

  }

  return (
    <Plot
      data={plotData}
      layout={layout}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler={true}
    />
  );

};


//export { groupAveragePoints };


function Analytics() {
  const mapContainerRef = useRef(null);
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [colorMap, setColorMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeParameter, setActiveParameter] = useState('temperature'); // Changed to match config keys
  const [displayMode, setDisplayMode] = useState('all');  //'all' or 'grouped'
  const groupSize = 20;  //1 = no grouping

  //Process data based on grouping
  const processedFeatures = useMemo(() => {
    if (!geoJsonData?.features) return [];

    return displayMode === 'grouped'
      ? groupAveragePoints(geoJsonData.features, groupSize, activeParameter)
      : geoJsonData.features;
  }, [geoJsonData, displayMode, activeParameter]);

  // Load data and generate colors
  useEffect(() => {
    const loadAndProcessData = async () => {
      try {
        setLoading(true);

        // 1. Load the data file
        const module = await import('../fiber-points/fiber_chart_data4.geojson');
        const rawData = typeof module.default === 'string'
          ? await fetch(module.default).then(r => {
            if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
            return r.json();
          })
          : module.default;

        // 2. Validate basic structure
        if (!rawData || typeof rawData !== 'object') {
          throw new Error('Loaded data is not a valid object');
        }

        // 3. Ensure proper GeoJSON structure
        if (!rawData.features || !Array.isArray(rawData.features)) {
          throw new Error('Data does not contain valid features array');
        }

        // 4. Process and enhance features
        const processedData = {
          type: 'FeatureCollection',
          features: rawData.features.map((feature, index) => {
            // Ensure required fields exist
            const cleanFeature = {
              ...feature,
              properties: {
                ...(feature.properties || {}),
                id: feature.properties?.id || index
              },
              geometry: feature.geometry || {
                type: 'Point',
                coordinates: [0, 0]
              }
            };

            // Add visual properties
            cleanFeature.properties.color = `hsl(${(index * (360 / rawData.features.length)) % 360
              }, 70%, 50%)`;

            return cleanFeature;
          })
        };

        // 5. Update state
        setGeoJsonData(processedData);
        setColorMap(generateColorMap(processedData.features));

      } catch (error) {
        console.error('Data processing error:', error);
        // Set empty valid GeoJSON as fallback
        setGeoJsonData({
          type: 'FeatureCollection',
          features: []
        });
      } finally {
        setLoading(false);
      }
    };

    loadAndProcessData();
  }, []);

  // Initialize map with synchronized colors
  useEffect(() => {
    if (!mapContainerRef.current || !geoJsonData || !colorMap) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [-7.794940, 37.933671],
      zoom: 16,
      cooperativeGestures: true
    });

    map.on('load', () => {
      const sourceId = 'fiber-points';
      const layerId = 'circle-layer';

      // Clean existing layers if they exist
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);

      // Add source
      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: processedFeatures
        }
      });

      // Add layer with synchronized colors
      map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': displayMode === 'grouped' ? 8 : 5,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 0,
          'circle-stroke-color': '#fff',
          'circle-opacity': 0.8
        }
      });
    });

    return () => map.remove();
  }, [geoJsonData, colorMap, displayMode, processedFeatures]);

  if (loading) {
    return <div className='loading-div'>
      Loading...
      {/*<div class="loader"></div>*/}
    </div>;
  }

  return (
    <>
      <div className='analytics-bt'>
        <button
          className={`slider-temp - bt ${activeParameter === 'temperature' ? 'active' : ''} `}
          onClick={() => setActiveParameter('temperature')}
        >
          Temperature
        </button>
        <button
          className={`slider - moist - bt ${activeParameter === 'moisture' ? 'active' : ''} `}
          onClick={() => setActiveParameter('moisture')}
        >
          Moisture
        </button>
      </div>

      <div className="analytics-parent">
        <GroupToggle
          displayMode={displayMode}
          setDisplayMode={setDisplayMode}
        />
        <div className="analytics-left">
          <TimeSeriesChart
            processedFeatures={processedFeatures}
            colorMap={colorMap}
            activeParameter={activeParameter}
          />
        </div>
        <div className="analytics-right">
          <div className={`map-container ${displayMode === 'grouped' ? 'grouped-mode' : ''} `} ref={mapContainerRef}>

          </div>
        </div>
      </div>
    </>
  );
}

export { Analytics };

//Ver codigo do deepseek e pq é que está mal
