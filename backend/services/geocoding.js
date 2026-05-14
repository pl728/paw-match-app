function cleanString(value) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

function parseCoordinate(value, min, max) {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
        return null;
    }
    return parsed;
}

function getAddressComponent(components, type, nameField = 'long_name') {
    const match = components.find(function (component) {
        return component.types.includes(type);
    });
    return match ? match[nameField] : null;
}

export function normalizeCoordinates(options = {}) {
    const latitude = parseCoordinate(options.latitude, -90, 90);
    const longitude = parseCoordinate(options.longitude, -180, 180);

    if (latitude === null || longitude === null) {
        return null;
    }

    return { latitude, longitude };
}

export function buildAddressQuery(options = {}) {
    return [
        cleanString(options.addressLine1 || options.address_line1),
        cleanString(options.addressLine2 || options.address_line2),
        cleanString(options.city),
        cleanString(options.state),
        cleanString(options.postalCode || options.postal_code)
    ].filter(Boolean).join(', ');
}

export async function geocodeLocation(options = {}) {
    const provided = normalizeCoordinates(options);
    if (provided) {
        return { ...provided, source: 'provided' };
    }

    const address = buildAddressQuery(options);
    if (!address) {
        return null;
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_GEOCODING_API_KEY;
    if (!apiKey) {
        console.warn('GOOGLE_MAPS_API_KEY is not set; location was saved without coordinates.');
        return null;
    }

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', address);
    url.searchParams.set('key', apiKey);

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Geocoding request failed');
    }

    const payload = await response.json();
    if (payload.status !== 'OK' || !payload.results?.[0]?.geometry?.location) {
        throw new Error('Could not geocode that location');
    }

    const location = payload.results[0].geometry.location;
    return {
        latitude: location.lat,
        longitude: location.lng,
        source: 'google'
    };
}

export async function reverseGeocodeLocation(options = {}) {
    const coordinates = normalizeCoordinates(options);
    if (!coordinates) {
        const err = new Error('latitude and longitude must both be valid coordinates');
        err.status = 400;
        throw err;
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_GEOCODING_API_KEY;
    if (!apiKey) {
        const err = new Error('GOOGLE_MAPS_API_KEY is not set');
        err.status = 500;
        throw err;
    }

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('latlng', `${coordinates.latitude},${coordinates.longitude}`);
    url.searchParams.set('key', apiKey);

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Reverse geocoding request failed');
    }

    const payload = await response.json();
    if (payload.status !== 'OK' || !payload.results?.[0]) {
        throw new Error('Could not reverse geocode that location');
    }

    const result = payload.results[0];
    const components = result.address_components || [];
    return {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        city: getAddressComponent(components, 'locality')
            || getAddressComponent(components, 'postal_town')
            || getAddressComponent(components, 'administrative_area_level_2'),
        state: getAddressComponent(components, 'administrative_area_level_1', 'short_name'),
        postal_code: getAddressComponent(components, 'postal_code'),
        formatted_address: result.formatted_address,
        source: 'google'
    };
}
