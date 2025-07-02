import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { ChromePicker } from 'react-color';
import { useFiberColors } from './fiberColorContext';

// MUI
import ColorizeRoundedIcon from '@mui/icons-material/ColorizeRounded';

mapboxgl.accessToken = 'pk.eyJ1IjoicGVkcm9jb3N0YTI1IiwiYSI6ImNtOGczbGowcDBsM2EyaXF4MnJneTdmYjYifQ.od-UfH6VA3Zo5vPo7Mey5g'; // Replace this with your token

function isColorLight(hexColor) {
    const color = hexColor.replace('#', '');
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6;
}

function FiberCard({
    fiberId, fiberName, geojsonPath,
    title, distance, onDelete, showPicker, setShowPicker
}) {
    const { getColor, setColor } = useFiberColors();
    const color = getColor(fiberId);
    //const [showPicker, setShowPicker] = useState(false);
    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);
    const [geojson, setGeojson] = useState(null);
    const layerId = `fiber-layer-${fiberId}`;
    const sourceId = `fiber-source-${fiberId}`;
    const pickerRef = useRef();

    // Fetch the GeoJSON
    useEffect(() => {
        if (geojsonPath) {
            fetch(geojsonPath)
                .then(res => res.json())
                .then(data => setGeojson(data))
                .catch(err => console.error(`Error loading ${geojsonPath}`, err));
        }
    }, [geojsonPath]);

    useEffect(() => {
        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/satellite-v9',
            center: [-7.794542005697252, 37.93624919450497],
            zoom: 14,
            cooperativeGestures: true
        });

        mapRef.current = map;

        map.on('load', async () => {
            try {
                const response = await fetch(geojsonPath);
                const geojson = await response.json();

                map.addSource(sourceId, {
                    type: 'geojson',
                    data: geojson,
                });

                map.addLayer({
                    id: layerId,
                    type: 'circle',
                    source: sourceId,
                    paint: {
                        'circle-radius': 3,
                        'circle-color': color,
                    },
                });
            } catch (err) {
                console.error('Failed to load GeoJSON:', err);
            }
        });

        return () => {
            map.remove();
        };
    }, [geojsonPath, color, layerId, sourceId]);

    // Update circle color dynamically
    useEffect(() => {
        const map = mapRef.current;
        if (map && map.getLayer(layerId)) {
            console.log(`Updating color of fiber ${fiberId} to ${color}`);
            map.setPaintProperty(layerId, 'circle-color', color);
        }
    }, [color, layerId]);

    useEffect(() => {
        if (!showPicker) return;
        function handleClickOutside(event) {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(event.target)
            ) {
                setShowPicker(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showPicker, setShowPicker]);

    return (
        <div className="fiber-card" style={{ borderColor: color }}>
            <div className="card-head">
                <div className="card-title">
                    <h4>{fiberName}</h4>
                    <p>2km</p>
                </div>
                <div
                    className="card-color"
                    style={{ backgroundColor: color, position: 'relative' }}
                    onClick={e => {
                        e.stopPropagation();
                        setShowPicker(!showPicker);
                    }}
                >
                    <ColorizeRoundedIcon
                        style={{
                            color: isColorLight(color) ? '#252525' : '#f8f8ff',
                            cursor: 'pointer'
                        }}
                    />
                    {showPicker && (
                        <div
                            className="color-picker-popover"
                            ref={pickerRef}
                            style={{
                                position: 'absolute',
                                zIndex: 10,
                                top: '2.5rem',
                                right: 0,
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <ChromePicker
                                color={color}
                                onChangeComplete={(newColor) => setColor(fiberId, newColor.hex)}
                            />
                        </div>
                    )}
                </div>

            </div>
            <div className="card-map" ref={mapContainerRef}></div>
            <div className="card-buttons">
                <button className='card-delete' onClick={onDelete}>Delete</button>
                {/*<button className='card-details'>Details</button>*/}
            </div>
        </div>
    );
}

export { FiberCard };
