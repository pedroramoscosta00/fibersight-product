import { useState, useRef, useEffect, useMemo, useLayoutEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Plot from 'react-plotly.js';
import { point, distance } from '@turf/turf';
import { lineString, length as turfLength, along as turfAlong } from '@turf/turf';

import { width } from '@mui/system';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
//import { DatePicker } from '@mui/x-date-pickers/DatePicker';
//import { DateRangePicker } from '@mui/x-date-pickers/DateRangePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import CloseFullscreenRoundedIcon from '@mui/icons-material/CloseFullscreenRounded';

import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Mapbox setup
mapboxgl.accessToken = 'pk.eyJ1IjoicGVkcm9jb3N0YTI1IiwiYSI6ImNtOGczbGowcDBsM2EyaXF4MnJneTdmYjYifQ.od-UfH6VA3Zo5vPo7Mey5g';

/**
   * Automatically splits a GeoJSON fiber line into sections based on spatial jumps.
   * @param {Array} features - GeoJSON features (points)
   * @param {number} jumpThresholdFactor - multiplier to determine if a distance is a jump (e.g. 3 means 3x bigger)
   * @returns {Array} Array of section arrays
   */

function computeSectionAverages(sections, activeParameter) {
  return sections.map((section, idx) => {
    // Build a map of timestamp -> array of values
    const timeMap = {};
    section.forEach(feature => {
      const ts = Array.isArray(feature.properties?.timeSeries) ? feature.properties.timeSeries : [];
      ts.forEach(entry => {
        const timeKey = new Date(entry.timestamp).toISOString();
        if (!timeMap[timeKey]) timeMap[timeKey] = [];
        timeMap[timeKey].push(entry[activeParameter]);
      });
    });
    // Compute average for each timestamp
    const averagedTimeSeries = Object.entries(timeMap).map(([timestamp, values]) => ({
      timestamp,
      [activeParameter]: values.reduce((a, b) => a + b, 0) / values.length
    }));
    return {
      properties: {
        id: `section-${idx}`,
        timeSeries: averagedTimeSeries
      }
    };
  });
}

/*
 * Generates a color map for features
 * @param {Array} features - Array of GeoJSON features
 * @returns {Object} - Color mapping object {featureId: color}
 */

const DISTINCT_COLORS_6 = [
  '#e41a1c', // red
  '#377eb8', // blue
  '#4daf4a', // green
  '#984ea3', // purple
  '#ff7f00', // orange
  '#ffff33', // yellow
];

const DISTINCT_COLORS_8 = [
  '#1b9e77', // teal
  '#d95f02', // dark orange
  '#7570b3', // indigo
  '#e7298a', // magenta
  '#66a61e', // olive
  '#e6ab02', // mustard
  '#a6761d', // brown
  '#666666', // gray
];

const DISTINCT_COLORS_4 = [
  '#e6194b', // strong red
  '#3cb44b', // strong green
  '#ffe119', // strong yellow
  '#4363d8', // strong blue
];

// Color generator function
// When generating colorMap for features:
const generateColorMap = (features) => {
  const colorMap = {};
  features.forEach(feature => {
    const fiber = feature.properties.fiber;
    const section = feature.properties.section;
    let color;
    if (fiber === 'fiber1') {
      const idx = parseInt(section.replace('section-', '')) - 1;
      color = DISTINCT_COLORS_6[idx % DISTINCT_COLORS_6.length];
    } else if (fiber === 'fiber2') {
      const idx = parseInt(section.replace('section-', '')) - 1;
      color = DISTINCT_COLORS_8[idx % DISTINCT_COLORS_8.length];
    } else if (fiber === 'fiber3') {
      const idx = parseInt(section.replace('section-', '')) - 1;
      color = DISTINCT_COLORS_4[idx % DISTINCT_COLORS_4.length];
    } else {
      color = '#888';
    }
    colorMap[feature.properties.id] = color;
    feature.properties.color = color;
  });
  return colorMap;
};

/* Time series chart component */

const TimeSeriesChart = ({
  processedFeatures, colorMap, activeParameter,
  hiddenIds, isolatedIds, displayMode, isDarkMode
}) => {


  // Filtering for isolated/hidden
  let filtered = processedFeatures;
  if (isolatedIds && isolatedIds.size > 0) {
    filtered = processedFeatures.filter(f => isolatedIds.has(String(f.properties.id)));
  } else if (hiddenIds && hiddenIds.size > 0) {
    filtered = processedFeatures.filter(f => !hiddenIds.has(String(f.properties.id)));
  }

  // Build plotData
  let plotData;
  if (displayMode === 'grouped') {
    // Grouped mode: show all lines
    plotData = filtered.map(feature => {
      const id = String(feature.properties?.id);
      const isGroup = id.includes('section-');
      const ts = Array.isArray(feature.properties?.timeSeries) ? feature.properties.timeSeries : [];
      return {
        x: ts.map(entry => new Date(entry.timestamp)),
        y: ts.map(entry => entry[activeParameter]),
        type: 'scatter',
        mode: 'lines',
        line: { color: colorMap[id], width: isGroup ? 3 : 1 },
        name: isGroup ? `Section ${id.split('-')[1]}` : `Sensor ${id}`
      };
    }).filter(Boolean);
  }

  // Layout (fix yaxis color logic as well)
  const layout = {
    paper_bgcolor: isDarkMode ? '#4A4A4A' : '#FFFFFF',
    plot_bgcolor: isDarkMode ? '#4A4A4A' : '#FFFFFF',
    font: {
      color: isDarkMode ? '#f8f8ff' : '#252525',
    },
    title: {
      text: activeParameter === 'temperature' ? 'Temperature Over the last 24h' : 'Moisture Over the last 24h',
      font: { size: 15, color: isDarkMode ? '#F8F8FF' : '#252525' },
      y: 0.98,
      yanchor: 'top',
      xanchor: 'center',
      x: 0.5
    },
    xaxis: {
      title: {
        text: 'Time',
        font: { size: 12, color: isDarkMode ? '#F8F8FF' : '#252525' },
        standoff: 15
      },
      type: 'date',
      tickformat: '%d %b %H:%M',
      automargin: true,
      tickfont: {
        size: 10,
        color: isDarkMode ? '#F8F8FF' : '#252525',
      },
      color: isDarkMode ? '#F8F8FF' : '#252525',
      linewidth: 1,
    },
    yaxis: {
      title: {
        text: activeParameter === 'temperature' ? 'Temperature (°C)' : 'Moisture (%)',
        font: { size: 12, color: isDarkMode ? '#F8F8FF' : '#252525' },
        standoff: 20
      },
      automargin: true,
      tickfont: {
        size: 10,
        color: isDarkMode ? '#F8F8FF' : '#252525'
      },
      color: isDarkMode ? '#F8F8FF' : '#252525',
      linewidth: 1,
    },
    margin: {
      l: 60, r: 20, b: 60, t: 60, pad: 0
    },
    showlegend: false,
    autosize: {
      type: 'plot',
      expand: false
    },
  };

  return (
    <Plot
      data={plotData}
      layout={layout}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler={true}
    />
  );
};

function Analytics() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const resizeObserverRef = useRef(null);

  const [geoJsonData, setGeoJsonData] = useState(null);
  const [colorMap, setColorMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeParameter, setActiveParameter] = useState('temperature');
  const [displayMode, setDisplayMode] = useState('grouped');
  const [hiddenIds, setHiddenIds] = useState(new Set());
  const [isolatedIds, setIsolatedIds] = useState(new Set());
  const [hoveredId, setHoveredId] = useState(null);
  const [mapNotifications, setMapNotifications] = useState([]);
  const [mapLoading, setMapLoading] = useState(false);

  const containerRefResizer = useRef(null);
  const [leftWidth, setLeftWidth] = useState(null);
  const isDragging = useRef(false);

  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [open, setOpen] = useState(false);
  const calendarButtonRef = useRef();
  const [selectedRange, setSelectedRange] = useState([dayjs(), dayjs()]);

  const [mapMinimized, setMapMinimized] = useState(false);

  const [dataFolders, setDataFolders] = useState([
    '/june_fiber_data',
    '/june_fiber_data2',
    '/june_fiber_data3',
  ]);

  // At the top of Analytics component:
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  /*const newTheme = useMemo(() => createTheme({
    components: {
      MuiPickersPopper: {
        styleOverrides: {
          paper: {
            borderRadius: '1.5rem',
          }
        }
      },
      MuiDateCalendar: {
        styleOverrides: {
          root: {
            color: 'var(--bg-color)',
            borderRadius: '1.5rem',
            borderWidth: '0px',
            borderColor: '#e91e63',
            border: '0px solid',
            backgroundColor: isDarkMode ? '#252525' : '#f8f8ff',
          }
        },
        viewTransitionContainer: {
          root: {
            borderRadius: '1.5rem',
          }
        }
      },
      MuiPickersDay: {
        styleOverrides: {
          root: {
            color: 'var(--bg-color)',
          },
          today: {
            backgroundColor: isDarkMode ? '#f8f8ff' : '#252525',
            color: 'var(--text-color)'
          },
          selected: {
            backgroundColor: isDarkMode ? '#4A4A4A' : '#f8f8ff',
            color: '#fff',
            '&:hover, &:focus': {
              backgroundColor: isDarkMode ? '#f8f8ff' : '#252525',
            },
          }
        }
      },
      MuiDayCalendar: {
        styleOverrides: {
          weekDayLabel: {
            color: 'var(--bg-color)',
          },
          slideTransition: {
            borderRadius: '1.5rem',
          }
        }
      },
      MuiPickersCalendarHeader: {
        styleOverrides: {
          root: {
            color: 'var(--bg-color)',
          },
          switchViewButton: {
            color: 'var(--bg-color)',
          }
        }
      },
      MuiPickersArrowSwitcher: {
        styleOverrides: {
          button: {
            color: 'var(--bg-color)',
          }
        }
      }
    }
  }), [isDarkMode]);*/

  useEffect(() => {
    if (!mapMinimized && mapRef.current && mapContainerRef.current) {
      setTimeout(() => {
        const { offsetWidth, offsetHeight } = mapContainerRef.current;
        if (offsetWidth > 0 && offsetHeight > 0) {
          mapRef.current.resize();
          const center = mapRef.current.getCenter();
          const zoom = mapRef.current.getZoom();
          mapRef.current.jumpTo({ center, zoom });
          console.log('Map resized after maximize:', offsetWidth, offsetHeight);
        } else {
          console.log('Map container has no size yet:', offsetWidth, offsetHeight);
        }
      }, 300);
    }
  }, [mapMinimized]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (containerRefResizer.current) {
        const fullWidth = containerRefResizer.current.offsetWidth || 1000;
        setLeftWidth(fullWidth / 2);
      }
    });
  }, []);

  function pushMapNotification(message, color) {
    setMapNotifications(prev => {
      const next = [...prev, { id: Date.now() + Math.random(), message, color }];
      // Keep only the last 3
      return next.slice(-3);
    });
  }



  // Load data
  useEffect(() => {
    const loadAndProcessRange = async () => {
      try {
        setLoading(true);
        const [start, end] = selectedRange;
        if (!start || !end) return;

        // Generate all dates in the range (inclusive)
        const days = [];
        let d = start.startOf('day');
        while (d.isBefore(end.endOf('day')) || d.isSame(end, 'day')) {
          days.push(d.format('YYYY-MM-DD'));
          d = d.add(1, 'day');
        }

        // --- Separate arrays for each fiber system ---
        let fiber1Features = [];
        let fiber2Features = [];
        let fiber3Features = [];

        for (const dateStr of days) {
          // Fiber 1: 6 sections
          try {
            const fileName1 = `/june_fiber_data/geo-${dateStr}.geojson`;
            const response1 = await fetch(fileName1);
            if (response1.ok) {
              const rawData1 = await response1.json();
              rawData1.features.forEach(f => {
                if (f.properties && f.properties.id) {
                  f.properties.id = `/june_fiber_data-${f.properties.id}`;
                }
              });
              const features = rawData1.features;
              const n = features.length;
              const nSections = 6;
              const sectionSize = Math.floor(n / nSections);
              for (let i = 0; i < nSections; i++) {
                const start = i * sectionSize;
                const end = (i === nSections - 1) ? n : (i + 1) * sectionSize;
                for (let j = start; j < end; j++) {
                  features[j].properties.section = `section-${i + 1}`;
                  features[j].properties.fiber = 'fiber1';
                }
              }
              fiber1Features.push(...features);
            }
          } catch (e) { }

          // Fiber 2: 8 sections
          try {
            const fileName2 = `/june_fiber_data2/geo-${dateStr}.geojson`;
            const response2 = await fetch(fileName2);
            if (response2.ok) {
              const rawData2 = await response2.json();
              rawData2.features.forEach(f => {
                if (f.properties && f.properties.id) {
                  f.properties.id = `/june_fiber_data2-${f.properties.id}`;
                }
              });
              const features = rawData2.features;
              const n = features.length;
              const nSections = 8;
              const sectionSize = Math.floor(n / nSections);
              for (let i = 0; i < nSections; i++) {
                const start = i * sectionSize;
                const end = (i === nSections - 1) ? n : (i + 1) * sectionSize;
                for (let j = start; j < end; j++) {
                  features[j].properties.section = `section-${i + 1}`;
                  features[j].properties.fiber = 'fiber2';
                }
              }
              fiber2Features.push(...features);
            }
          } catch (e) { }

          // Fiber 3: 4 sections
          try {
            const fileName3 = `/june_fiber_data3/geo-${dateStr}.geojson`;
            const response3 = await fetch(fileName3);
            if (response3.ok) {
              const rawData3 = await response3.json();
              rawData3.features.forEach(f => {
                if (f.properties && f.properties.id) {
                  f.properties.id = `/june_fiber_data3-${f.properties.id}`;
                }
              });
              const features = rawData3.features;
              const n = features.length;
              const nSections = 4;
              const sectionSize = Math.floor(n / nSections);
              for (let i = 0; i < nSections; i++) {
                const start = i * sectionSize;
                const end = (i === nSections - 1) ? n : (i + 1) * sectionSize;
                for (let j = start; j < end; j++) {
                  features[j].properties.section = `section-${i + 1}`;
                  features[j].properties.fiber = 'fiber3';
                }
              }
              fiber3Features.push(...features);
            }
          } catch (e) { }
        }

        const allFeatures = [...fiber1Features, ...fiber2Features, ...fiber3Features];

        // Merge timeSeries for each unique point (by id)
        const featuresById = {};
        allFeatures.forEach(f => {
          const id = f.properties?.id;
          if (!featuresById[id]) {
            featuresById[id] = { ...f, properties: { ...f.properties, timeSeries: [] } };
          }
          // Merge timeSeries arrays
          if (Array.isArray(f.properties?.timeSeries)) {
            featuresById[id].properties.timeSeries.push(...f.properties.timeSeries);
          }
        });

        // Sort timeSeries by timestamp for each feature
        Object.values(featuresById).forEach(f => {
          f.properties.timeSeries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        });

        const processedData = {
          type: 'FeatureCollection',
          features: Object.values(featuresById)
        };

        setGeoJsonData(processedData);
        setColorMap(generateColorMap(processedData.features));
      } finally {
        setLoading(false);
      }
    };
    loadAndProcessRange();
  }, [selectedRange]);

  // Prepare rows and row lines
  const sections = useMemo(() => {
    if (!geoJsonData?.features) return [];
    // Group by fiber and section
    const byFiberSection = {};
    geoJsonData.features.forEach(f => {
      const fiber = f.properties?.fiber || 'nofiber';
      const section = f.properties?.section || 'nosection';
      const key = `${fiber}-${section}`;
      if (!byFiberSection[key]) byFiberSection[key] = [];
      byFiberSection[key].push(f);
    });
    // Sort keys: fiber1-section-1, fiber1-section-2, ..., fiber2-section-1, ...
    return Object.keys(byFiberSection)
      .sort((a, b) => {
        // Sort by fiber, then by section number
        const [fa, sa] = a.split('-section-');
        const [fb, sb] = b.split('-section-');
        if (fa !== fb) return fa.localeCompare(fb);
        return Number(sa) - Number(sb);
      })
      .map(k => byFiberSection[k]);
  }, [geoJsonData]);

  // Prepare features for chart
  const processedFeatures = useMemo(() => {
    if (!geoJsonData?.features) return [];
    if (displayMode === 'grouped') return computeSectionAverages(sections, activeParameter);
    return geoJsonData.features;
  }, [geoJsonData, displayMode, activeParameter, sections]);

  const sectionColorMap = useMemo(() => {
    if (displayMode === 'grouped' && sections.length > 0) {
      const colorMap = {};
      sections.forEach((section, idx) => {
        // Use the color of the first feature in the section
        const color = section[0]?.properties?.color || '#888';
        colorMap[`section-${idx}`] = color;
      });
      return colorMap;
    }
    return {};
  }, [displayMode, sections]);

  const sectionLineFeatures = useMemo(
    () => sections.filter(section => section.length > 1).map((section, idx) => {
      const sectionId = `section-${idx}`;
      const isHidden =
        isolatedIds && isolatedIds.size > 0
          ? !isolatedIds.has(sectionId)
          : hiddenIds.has(sectionId);
      return {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: section.map(f => f.geometry.coordinates) },
        properties: {
          id: sectionId,
          color: sectionColorMap[sectionId] || '#ff0000',
          hidden: isHidden
        }
      };
    }),
    [sections, sectionColorMap, hiddenIds, isolatedIds]
  );

  const sectionLinesGeoJson = useMemo(
    () => ({ type: 'FeatureCollection', features: sectionLineFeatures }),
    [sectionLineFeatures]
  );


  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.resize();
    }
  }, [displayMode]);

  // Initialize map ONCE
  useLayoutEffect(() => {
    if (loading || mapRef.current || !mapContainerRef.current) return;

    const container = mapContainerRef.current;
    //console.log("Container info", container, container.offsetWidth, container.offsetHeight);

    if (!container || container.offsetWidth === 0 || container.offsetHeight === 0) {
      //console.warn('Map container not ready:', container);
      return;
    }

    const map = new mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [-7.795230387481382, 37.93632356754527],
      zoom: 16,
      doubleClickZoom: false,
      cooperativeGestures: true
    });

    // Add controls for accessibility
    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    map.addControl(new mapboxgl.FullscreenControl(), 'bottom-right');
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');

    mapRef.current = map;
    window.mapRef = mapRef;

    resizeObserverRef.current = new ResizeObserver((entries) => {
      if (mapRef.current) mapRef.current.resize();
    });
    resizeObserverRef.current.observe(mapContainerRef.current);

    return () => {
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [loading]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    }, 100); // Give the DOM a bit of time to settle

    return () => clearTimeout(timeout);
  }, [displayMode]);


  // Add/update sources/layers on data or mode change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    function updateMap() {
      // --- section LINES: Only in grouped mode ---
      if (displayMode === 'grouped') {
        if (!map.getSource('section-lines')) {
          map.addSource('section-lines', { type: 'geojson', data: sectionLinesGeoJson });
          map.addLayer({
            id: 'section-lines-layer',
            type: 'line',
            source: 'section-lines',
            paint: {
              'line-color': ['get', 'color'],
              'line-width': 5,
              'line-opacity': [
                'case',
                ['get', 'hidden'], 0.2,
                0.8
              ]
            }
          });
        } else {
          map.getSource('section-lines').setData(sectionLinesGeoJson);
        }
      } else {
        // Remove hovered-section-layer first if it exists
        if (map.getLayer('hovered-section-layer')) map.removeLayer('hovered-section-layer');
        // Remove section-lines-layer before removing the source
        if (map.getLayer('section-lines-layer')) map.removeLayer('section-lines-layer');
        if (map.getSource('section-lines')) map.removeSource('section-lines');
      }

      // --- HOVERED section LAYER (only in grouped mode) ---
      if (displayMode === 'grouped') {
        if (!map.getLayer('hovered-section-layer')) {
          map.addLayer({
            id: 'hovered-section-layer',
            type: 'line',
            source: 'section-lines',
            paint: {
              'line-color': ['get', 'color'],
              'line-width': 8,
              'line-opacity': [
                'case',
                ['get', 'hidden'], 0.2,
                0.8
              ]
            },
            filter: ['==', ['get', 'id'], hoveredId || '']
          });
        } else {
          map.setFilter('hovered-section-layer', ['==', ['get', 'id'], hoveredId || '']);
        }
      } else {
        if (map.getLayer('hovered-section-layer')) map.removeLayer('hovered-section-layer');
      }

      map.resize();
    }

    if (map.isStyleLoaded()) {
      updateMap();
    } else {
      map.once('style.load', updateMap);
    }

    // --- Cursor pointer on hover ---
    function handleMouseMove(e) {
      let features, id = null, label = '', lngLat = null;
      if (displayMode === 'grouped') {
        if (map.getLayer('section-lines-layer')) {
          features = map.queryRenderedFeatures(e.point, { layers: ['section-lines-layer'] });
          if (features.length > 0) {
            id = features[0].properties.id;
            label = features[0].properties.id;
            const color = features[0].properties.color;
            // Center of the section (true midpoint along the line)
            const coords = features[0].geometry.coordinates;
            if (coords.length > 1) {
              const line = lineString(coords);
              const lineLen = turfLength(line, { units: 'kilometers' });
              const midpoint = turfAlong(line, lineLen / 2, { units: 'kilometers' });
              lngLat = midpoint.geometry.coordinates;
            } else {
              lngLat = coords[0];
            }
          }
        }
      }
      setHoveredId(id);

      // Show label as a popup
      if (id && lngLat) {
        if (!map._hoverPopup) {
          map._hoverPopup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
          })
            .setLngLat(lngLat)
            .setHTML(`<div style="font-size:14px;font-weight:bold">${label}</div>`)
            .addTo(map);
        } else {
          map._hoverPopup.setLngLat(lngLat).setHTML(`<div style="font-size:14px;font-weight:bold">${label}</div>`);
        }
      } else if (map._hoverPopup) {
        map._hoverPopup.remove();
        map._hoverPopup = null;
      }

      map.getCanvas().style.cursor = id ? 'pointer' : '';
    }

    // --- Click handler (toggle visibility) ---
    function handleMapDoubleClick(e) {
      let clickedId = null;
      let color = null;

      if (displayMode === 'grouped') {
        const features = map.queryRenderedFeatures(e.point, { layers: ['section-lines-layer'] });
        if (features.length > 0) {
          clickedId = features[0].properties.id;
          color = features[0].properties.color;
        }
      }
      if (clickedId !== null) {
        setHiddenIds(prev => {
          const next = new Set(prev);
          if (next.has(clickedId)) {
            pushMapNotification(`Showing <span style="color:${color}">${clickedId}</span>`, color);
            next.delete(clickedId);
          } else {
            pushMapNotification(
              `Filtering out <span style="color:${color}">${clickedId}</span>`, color
            );
            next.add(clickedId);
          }
          return next;
        });
        setIsolatedIds(new Set());
      }
    }

    // --- Double click handler (isolate) ---
    function handleMapClick(e) {
      let clickedId = null;
      let color = null;

      if (displayMode === 'grouped') {
        const features = map.queryRenderedFeatures(e.point, { layers: ['section-lines-layer'] });
        if (features.length > 0) {
          clickedId = features[0].properties.id;
          color = features[0].properties.color;
        }
      }
      if (clickedId !== null) {
        setIsolatedIds(prev => {
          const next = new Set(prev);
          if (next.has(clickedId)) {
            next.delete(clickedId);
            pushMapNotification(`Unfocusing <span style="color:${color}">${clickedId}</span>`, color);
          } else {
            next.add(clickedId);
            pushMapNotification(`Focusing on <span style="color:${color}">${clickedId}</span>`, color);
          }
          return next;
        });
        setHiddenIds(new Set());
      }
    }

    map.on('mousemove', handleMouseMove);
    map.on('click', handleMapClick);
    map.on('dblclick', handleMapDoubleClick);

    return () => {
      map.off('mousemove', handleMouseMove);
      if (map._hoverPopup) {
        map._hoverPopup.remove();
        map._hoverPopup = null;
      }

      map.off('click', handleMapClick);
      map.off('dblclick', handleMapDoubleClick);
    };
  }, [sectionLinesGeoJson, processedFeatures, displayMode, hoveredId]);

  useEffect(() => {
    if (mapNotifications.length === 0) return;
    const timeout = setTimeout(() => {
      setMapNotifications(prev => prev.slice(1));
    }, 2000);
    return () => clearTimeout(timeout);
  }, [mapNotifications]);

  useEffect(() => {
    setMapLoading(true);
    const timeout = setTimeout(() => setMapLoading(false), 600); // adjust as needed
    return () => clearTimeout(timeout);
  }, [displayMode, activeParameter]);

  if (loading) {
    return <div
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(30,30,30,0.5)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        pointerEvents: 'auto',
        height: '100vh',
      }}
    >
      Loading...
    </div>;
  }


  const onMouseDown = () => {
    isDragging.current = true;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e) => {
    if (!isDragging.current || !containerRefResizer.current) return;
    const containerLeft = containerRefResizer.current.getBoundingClientRect().left;
    const newWidth = e.clientX - containerLeft;
    const containerWidth = containerRefResizer.current.offsetWidth;

    // Clamp value between 10% and 90%
    const clampedWidth = Math.max(containerWidth * 0.1, Math.min(newWidth, containerWidth * 0.9));
    setLeftWidth(clampedWidth);
  };

  const onMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  // When maximizing, restore leftWidth to half the container
  const handleRestoreMap = () => {
    setMapMinimized(false);
    if (containerRefResizer.current) {
      const fullWidth = containerRefResizer.current.offsetWidth || 1000;
      setLeftWidth(fullWidth / 2);
    }
  };

  const isTodayRange = () => {
    const today = dayjs().startOf('day');
    return (
      selectedRange[0] &&
      selectedRange[1] &&
      dayjs(selectedRange[0]).isSame(today, 'day') &&
      dayjs(selectedRange[1]).isSame(today, 'day')
    );
  };

  function CustomCalendarContainer({ className, children }) {
    return (
      <div className={className} style={{ position: 'relative' }}>
        {children}
        {
          !isTodayRange() && (
            <button
              className="reset-date-btn"
              onClick={() => {
                const today = dayjs();
                setSelectedRange([today, today]);
                setOpen(false);
              }}
              aria-label="Reset to today"
              title="Reset to today"
            >
              <ReplayRoundedIcon sx={{ fontSize: 16 }} />
              Reset
            </button>
          )
        }
      </div>
    );
  }


  return (
    <>
      {mapLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(30,30,30,0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 28,
            fontWeight: 'bold',
            pointerEvents: 'auto',
            height: '100vh',
          }}
        >
          Loading...
        </div>
      )}

      <div className='analytics-bt'>
        <button
          className={`slider-temp - bt ${activeParameter === 'temperature' ? 'active' : ''} `}
          onClick={() => {
            setMapLoading(true); // Show loading immediately
            setTimeout(() => setActiveParameter('temperature'), 0); // Defer heavy update
          }}
        >
          Temperature
        </button>
        <button
          className={`slider - moist - bt ${activeParameter === 'moisture' ? 'active' : ''} `}
          onClick={() => {
            setMapLoading(true);
            setTimeout(() => setActiveParameter('moisture'), 0);
          }}
        >
          Moisture
        </button>
      </div>
      <div
        className="analytics-parent"
        ref={containerRefResizer}
      >
        <div
          className="analytics-left"
          style={
            mapMinimized
              ? { flex: 1 }
              : leftWidth
                ? { width: `${leftWidth}px` }
                : { flex: 1 }
          }
        >
          <TimeSeriesChart
            key={isDarkMode ? 'dark' : 'light'}
            processedFeatures={processedFeatures}
            colorMap={sectionColorMap}
            activeParameter={activeParameter}
            hiddenIds={hiddenIds}
            isolatedIds={isolatedIds}
            displayMode={displayMode}
            isDarkMode={isDarkMode}
          />
        </div>

        {!mapMinimized && (
          <div
            className="analytics-resizer"
            onMouseDown={onMouseDown}
            onDoubleClick={() => {
              if (containerRefResizer.current) {
                const fullWidth = containerRefResizer.current.offsetWidth || 1000;
                setLeftWidth(fullWidth / 2);
              }
            }}
            style={{ cursor: "ew-resize" }}
          >
            <div className="analytics-resizer-element" />
          </div>
        )}

        <div
          className={`analytics-right${mapMinimized ? ' minimized' : ''}`}
          style={
            mapMinimized
              ? {
                width: '3rem',
                minWidth: '3rem',
                maxWidth: '3rem',
                height: '3rem',
                padding: 0,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

              }
              : {}
          }
        >
          <div className="analytics-toggle" style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
            {!mapMinimized && (
              <>
                {(isolatedIds.size > 0 || hiddenIds.size > 0) && (
                  <button
                    onClick={() => {
                      setIsolatedIds(new Set());
                      setHiddenIds(new Set());
                      pushMapNotification('Showing all lines');
                    }}
                  >
                    Show All
                  </button>
                )}
                {selectedRange[0] && selectedRange[1] && (
                  <span className="calendar-preview">
                    {selectedRange[0].format
                      ? `${selectedRange[0].format('YYYY-MM-DD')} • ${selectedRange[1].format('YYYY-MM-DD')}`
                      : `${selectedRange[0].toLocaleDateString()} • ${selectedRange[1].toLocaleDateString()}`}
                  </span>
                )}
                <button
                  ref={calendarButtonRef}
                  className="calendar-icon-btn"
                  onClick={() => setOpen(!open)}
                  type="button"
                  aria-label="Open calendar"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    margin: 0,
                    outline: 'none'
                  }}
                >
                  <CalendarTodayRoundedIcon
                    color="action"
                    sx={{ fontSize: 20 }}
                    className="analytics-calendar-icon"
                  />
                </button>
                {open && (
                  <div style={{ position: 'absolute', zIndex: 9999 }}>

                    <ReactDatePicker
                      selectsRange
                      startDate={selectedRange[0]?.toDate ? selectedRange[0].toDate() : selectedRange[0]}
                      endDate={selectedRange[1]?.toDate ? selectedRange[1].toDate() : selectedRange[1]}
                      onChange={(dates) => {
                        setSelectedRange([dates[0] ? dayjs(dates[0]) : null, dates[1] ? dayjs(dates[1]) : null]);
                        if (dates[0] && dates[1]) setOpen(false);
                      }}
                      open={open}
                      onClickOutside={() => setOpen(false)}
                      calendarClassName={isDarkMode ? 'datepicker-dark' : 'datepicker-light'}
                      popperPlacement="bottom-start"
                      customInput={<span style={{ display: 'none' }} />}
                      calendarContainer={CustomCalendarContainer}
                    />
                  </div>
                )}

                <button
                  className="minimize-map-btn"
                  onClick={() => setMapMinimized(!mapMinimized)}
                  style={{
                    marginLeft: 'auto',
                    marginRight: '1rem',
                  }}
                  aria-label={mapMinimized ? "Restore map" : "Minimize map"}
                >
                  <CloseFullscreenRoundedIcon />
                </button>
              </>
            )}
          </div>


          <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '1.875rem' }}>
            <div
              className={`map-container ${displayMode === 'grouped' ? 'grouped-mode' : ''}`}
              ref={mapContainerRef}
              style={{
                width: '100%',
                height: '100%',
                visibility: mapMinimized ? 'hidden' : 'visible',
                position: 'relative',
              }}
            ></div>

            {mapMinimized && (
              <button
                className='restore-map-btn'
                onClick={handleRestoreMap}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Restore map"
              >
                <MapRoundedIcon sx={{
                  fontSize: '2.1875rem',
                  color: isDarkMode ? '#252525' : '#F8F8FF'
                }}
                />
              </button>
            )}

            <div
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                alignItems: 'flex-end',
                pointerEvents: 'none',
              }}
            >
              {mapNotifications.map(n => (
                <div
                  key={n.id}
                  style={{
                    background: 'rgba(40,40,40,0.85)',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 14,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    minWidth: 120,
                    opacity: 1,
                    transition: 'opacity 0.3s',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: n.message
                  }}
                />
              ))}
            </div>
          </div>

        </div>

        {/*<div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '1.875rem' }}>
          <div
            className={`map-container ${displayMode === 'grouped' ? 'grouped-mode' : ''}`}
            ref={mapContainerRef}
            style={{ width: '100%', height: '100%' }}
          ></div>
          <div
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              alignItems: 'flex-end',
              pointerEvents: 'none',
            }}
          >
            {mapNotifications.map(n => (
              <div
                key={n.id}
                style={{
                  background: 'rgba(40,40,40,0.85)',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 14,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  minWidth: 120,
                  opacity: 1,
                  transition: 'opacity 0.3s',
                }}
                dangerouslySetInnerHTML={{
                  __html: n.message
                }}
              />
            ))}
          </div>
        </div>*/}

      </div>
    </>
  );
}

export { Analytics };