import { NextRequest, NextResponse } from "next/server";

type NominatimReverseResult = {
  display_name?: string;
  error?: string;
};

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lng = Number(request.nextUrl.searchParams.get("lng"));
  const requestedLanguage = request.nextUrl.searchParams.get("language") || "en";
  const language = /^[a-z]{2}(?:-[A-Z]{2})?$/.test(requestedLanguage)
    ? requestedLanguage
    : "en";

  if (!Number.isFinite(lat) || lat < -90 || lat > 90 ||
      !Number.isFinite(lng) || lng < -180 || lng > 180) {
    return NextResponse.json({ detail: "Invalid coordinates." }, { status: 400 });
  }

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "jsonv2",
    addressdetails: "1",
    zoom: "18",
    "accept-language": language,
  });

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "FoodDely/1.0 (https://fooddely.com)",
      },
      next: { revalidate: 86_400 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { detail: "The address service is temporarily unavailable. Please enter your address manually." },
        { status: 502 },
      );
    }

    const result = await response.json() as NominatimReverseResult;
    if (!result.display_name) {
      return NextResponse.json(
        { detail: result.error || "No address was found for your location. Please enter it manually." },
        { status: 404 },
      );
    }

    return NextResponse.json({ address: result.display_name });
  } catch {
    return NextResponse.json(
      { detail: "The address service is temporarily unavailable. Please enter your address manually." },
      { status: 502 },
    );
  }
}
