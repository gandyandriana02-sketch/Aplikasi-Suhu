import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json({ success: false, error: 'Missing lat or lng' }, { status: 400 });
    }

    // 1. Try Google Maps Geocoding API if GOOGLE_MAPS_API_KEY is configured
    const googleKey = process.env.GOOGLE_MAPS_API_KEY;
    if (googleKey) {
      try {
        const gRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleKey}&language=id`
        );
        if (gRes.ok) {
          const gData = await gRes.json();
          if (gData.status === 'OK' && gData.results && gData.results.length > 0) {
            let addr = gData.results[0].formatted_address || '';
            // Trim ending ", Indonesia" for cleaner multi-line layout on photo watermark
            addr = addr.replace(/,\s*Indonesia$/i, '');
            return NextResponse.json({
              success: true,
              address: addr,
              provider: 'google'
            });
          }
        }
      } catch (gErr) {
        console.warn('Google Geocoding error, falling back:', gErr);
      }
    }

    // 2. High-detail fallback to OpenStreetMap Nominatim
    try {
      const osmRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=id`,
        {
          headers: {
            'User-Agent': 'WarehouseTemperatureReport/1.0'
          }
        }
      );
      if (osmRes.ok) {
        const osmData = await osmRes.json();
        const a = osmData.address || {};
        const road = a.road || a.street || a.pedestrian;
        const village = a.village || a.suburb || a.neighbourhood || a.town;
        const district = a.municipality || a.city_district || a.district;
        const county = a.county || a.city;
        const state = a.state;
        const postal = a.postcode;

        const parts = [
          road,
          village,
          district,
          county,
          state ? (postal ? `${state} ${postal}` : state) : postal
        ].filter(Boolean);

        if (parts.length > 0) {
          return NextResponse.json({
            success: true,
            address: parts.join(', '),
            provider: 'nominatim'
          });
        }
      }
    } catch (osmErr) {
      console.warn('Nominatim reverse geocode error:', osmErr);
    }

    return NextResponse.json({
      success: false,
      address: '',
      error: 'Unable to reverse geocode'
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}
