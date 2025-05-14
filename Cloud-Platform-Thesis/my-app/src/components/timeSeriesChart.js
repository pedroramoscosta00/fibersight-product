import { useState, useEffect } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { parseISO } from 'date-fns';

function TimeSeriesChart({ geoJsonData }) {
    const [chartData, setChartData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        try {
            setError(null);

            // Debug: Log the complete GeoJSON structure
            console.log('Full GeoJSON data:', geoJsonData);

            // Check if we have any features at all
            if (!geoJsonData?.features?.length) {
                throw new Error('GeoJSON contains no features');
            }

            // Find the first feature with valid timeSeries data
            const featureWithData = geoJsonData.features.find(feature => {
                // Debug each feature
                console.log('Checking feature:', feature);

                // Check if timeSeries exists and has content
                const timeSeries = feature?.properties?.timeSeries;
                if (!timeSeries) return false;

                // Handle both string and array formats
                const parsedSeries = typeof timeSeries === 'string'
                    ? JSON.parse(timeSeries)
                    : timeSeries;

                return Array.isArray(parsedSeries) && parsedSeries.length > 0;
            });

            if (!featureWithData) {
                throw new Error('No features contain valid time series data');
            }

            // Process the timeSeries data
            const timeSeries = typeof featureWithData.properties.timeSeries === 'string'
                ? JSON.parse(featureWithData.properties.timeSeries)
                : featureWithData.properties.timeSeries;

            const processedData = timeSeries.map(item => ({
                date: parseISO(item.timestamp),
                temperature: Number(item.temperature),
                moisture: Number(item.moisture)
            })).sort((a, b) => a.date - b.date);

            setChartData({
                dates: processedData.map(d => d.date),
                temperatures: processedData.map(d => d.temperature),
                moistures: processedData.map(d => d.moisture)
            });

            console.log('Successfully processed chart data:', processedData);

        } catch (err) {
            console.error('Full error details:', err);
            setError(err.message);
        }
    }, [geoJsonData]);

    if (error) {
        return (
            <div style={{
                color: 'red',
                padding: '1rem',
                border: '1px solid #ffcccc',
                borderRadius: '4px',
                backgroundColor: '#fff0f0'
            }}>
                <strong>Chart Error:</strong> {error}
                <div style={{ marginTop: '0.5rem' }}>
                    Features available: {geoJsonData?.features?.length || 0}
                </div>
            </div>
        );
    }

    if (!chartData) {
        return (
            <div style={{
                padding: '1rem',
                color: '#666',
                fontStyle: 'italic'
            }}>
                Loading chart data...
            </div>
        );
    }

    return (
        <div style={{ padding: '1rem' }}>
            <LineChart
                xAxis={[{
                    data: chartData.dates,
                    scaleType: 'time',
                    label: 'Time',
                }]}
                series={[
                    {
                        data: chartData.temperatures,
                        label: 'Temperature (°C)',
                        color: '#ff5252',
                    },
                    {
                        data: chartData.moistures,
                        label: 'Moisture (%)',
                        color: '#4285f4',
                    }
                ]}
                /*sx={{
                    width: '100%',
                    height: '100%'
                }}*/

                width={500}
                height={500}
            />
        </div>
    );
}

export { TimeSeriesChart };