"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Navigation,
  Loader2,
  MapPin,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Radio,
  RefreshCw,
  Globe,
  Compass,
} from "lucide-react";
import type { RealTimeMapDataResponse } from "@/app/api/address/reverse/route";

export interface ResolvedLocationData {
  street?: string;
  houseNumber?: string;
  locality?: string;
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country: "IN" | "GB";
  coordinates: {
    lat: number;
    lon: number;
  };
  displayName: string;
}

interface RealTimeMapLocatorProps {
  country: "IN" | "GB";
  onLocationResolved: (data: ResolvedLocationData) => void;
  activeCoordinates?: { lat: number; lon: number } | null;
  className?: string;
}

export function RealTimeMapLocator({
  country,
  onLocationResolved,
  activeCoordinates,
  className = "",
}: RealTimeMapLocatorProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lon: number } | null>(
    activeCoordinates || null
  );
  const [resolvedSummary, setResolvedSummary] = useState<string | null>(null);
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [showMap, setShowMap] = useState<boolean>(Boolean(activeCoordinates));

  // Sync internal coords if parent updates activeCoordinates (e.g. from autocomplete suggestion)
  useEffect(() => {
    if (activeCoordinates) {
      setCurrentCoords(activeCoordinates);
      setShowMap(true);
    }
  }, [activeCoordinates]);

  const handleFetchCurrentLocation = useCallback(async () => {
    setErrorMessage(null);
    setStatusMessage("Requesting GPS device coordinates...");

    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your current browser.");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy || 15);

        setCurrentCoords({ lat, lon });
        setAccuracyMeters(accuracy);
        setStatusMessage("Fetching real-time OpenStreetMap telemetry...");

        try {
          const res = await fetch(`/api/address/reverse?lat=${lat}&lon=${lon}`);
          const data: RealTimeMapDataResponse = await res.json();

          if (data.success) {
            setResolvedSummary(data.displayName || `${lat.toFixed(5)}, ${lon.toFixed(5)}`);
            setStatusMessage(`Verified via real-time satellite GPS (±${accuracy}m precision)`);
            setShowMap(true);

            onLocationResolved({
              street: data.street,
              houseNumber: data.houseNumber,
              locality: data.locality,
              city: data.city,
              district: data.district,
              state: data.state,
              postalCode: data.postalCode,
              country: data.country,
              coordinates: { lat, lon },
              displayName: data.displayName,
            });
          } else {
            setStatusMessage(`GPS coordinates captured: ${lat.toFixed(4)}°, ${lon.toFixed(4)}°`);
            setShowMap(true);
            onLocationResolved({
              coordinates: { lat, lon },
              country,
              displayName: `Coordinates: ${lat.toFixed(5)}, ${lon.toFixed(5)}`,
            });
          }
        } catch {
          setStatusMessage(`GPS location captured: ${lat.toFixed(4)}°, ${lon.toFixed(4)}°`);
          setShowMap(true);
          onLocationResolved({
            coordinates: { lat, lon },
            country,
            displayName: `Coordinates: ${lat.toFixed(5)}, ${lon.toFixed(5)}`,
          });
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        setStatusMessage(null);
        if (err.code === 1) {
          setErrorMessage("Location permission was denied. Please allow location access in your browser to use GPS auto-fill.");
        } else if (err.code === 2) {
          setErrorMessage("GPS position unavailable. Please ensure location services are enabled on your device.");
        } else if (err.code === 3) {
          setErrorMessage("Location request timed out. Please try again or type your address manually.");
        } else {
          setErrorMessage("Unable to fetch current location. Please enter your address manually.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
      }
    );
  }, [country, onLocationResolved]);

  // Construct links for map services
  const osmUrl = currentCoords
    ? `https://www.openstreetmap.org/?mlat=${currentCoords.lat}&mlon=${currentCoords.lon}#map=17/${currentCoords.lat}/${currentCoords.lon}`
    : `https://www.openstreetmap.org`;

  const gmapsUrl = currentCoords
    ? `https://www.google.com/maps/search/?api=1&query=${currentCoords.lat},${currentCoords.lon}`
    : `https://www.google.com/maps`;

  // Calculate static tile coords for visual map representation
  const latDisplay = currentCoords ? `${Math.abs(currentCoords.lat).toFixed(4)}° ${currentCoords.lat >= 0 ? "N" : "S"}` : "";
  const lonDisplay = currentCoords ? `${Math.abs(currentCoords.lon).toFixed(4)}° ${currentCoords.lon >= 0 ? "E" : "W"}` : "";

  return (
    <div
      className={`rounded-2xl bg-[#080B10] border border-[#243447] p-3.5 sm:p-4 space-y-3 shadow-lg transition-all ${className}`}
    >
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-[#102A43] border border-[#7DD3FC]/30 flex items-center justify-center text-[#7DD3FC] shrink-0">
            <Navigation className={`h-4 w-4 ${isLocating ? "animate-spin text-[#7DD3FC]" : ""}`} />
          </div>
          <div>
            <div className="text-xs font-bold text-[#FFFFFF] flex items-center gap-2">
              <span>Real-Time Map &amp; GPS Locator</span>
              {currentCoords && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Pinned
                </span>
              )}
            </div>
            <p className="text-[10px] text-[#9CAFC3]">
              Fetch real-time location via GPS to auto-populate your delivery address
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            disabled={isLocating}
            onClick={handleFetchCurrentLocation}
            className="h-8 px-3 rounded-lg bg-[#102A43] hover:bg-[#102A43]/80 border border-[#7DD3FC]/40 hover:border-[#7DD3FC] text-xs font-semibold text-[#7DD3FC] hover:text-[#FFFFFF] flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
          >
            {isLocating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Locating...</span>
              </>
            ) : (
              <>
                <Radio className="h-3.5 w-3.5" />
                <span>Fetch Real-Time Map Location</span>
              </>
            )}
          </button>

          {currentCoords && (
            <button
              type="button"
              onClick={() => setShowMap((prev) => !prev)}
              className="h-8 px-2.5 rounded-lg bg-[#080B10] hover:bg-[#102A43]/40 border border-[#243447] text-[11px] font-medium text-[#9CAFC3] hover:text-[#FFFFFF] flex items-center gap-1 transition-all"
            >
              <span>{showMap ? "Hide Map" : "Show Map"}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  showMap ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Real-time Status Notification */}
      {statusMessage && (
        <div className="p-2.5 rounded-xl bg-[#102A43]/50 border border-[#7DD3FC]/30 text-xs text-[#7DD3FC] flex items-center justify-between gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 truncate">
            {isLocating ? (
              <Radio className="h-3.5 w-3.5 animate-pulse text-[#7DD3FC] shrink-0" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            )}
            <span className="truncate">{statusMessage}</span>
          </div>
          {accuracyMeters && (
            <span className="text-[10px] text-[#9CAFC3] shrink-0">
              Accuracy: ±{accuracyMeters}m
            </span>
          )}
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-start gap-2 animate-in fade-in duration-150">
          <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">GPS Notice:</span> {errorMessage}
          </div>
        </div>
      )}

      {/* Interactive Map Visualizer */}
      {showMap && currentCoords && (
        <div className="rounded-xl overflow-hidden border border-[#243447] bg-[#080B10] space-y-0 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Map View Header / Telemetry Bar */}
          <div className="px-3 py-2 bg-[#102A43]/80 border-b border-[#243447] flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <Compass className="h-3.5 w-3.5 text-[#7DD3FC]" />
              <span className="font-mono text-[#FFFFFF] font-semibold">
                {latDisplay}, {lonDisplay}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={osmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#7DD3FC] hover:text-[#FFFFFF] flex items-center gap-1 transition-colors text-[10px]"
              >
                <span>OpenStreetMap</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
              <a
                href={gmapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9CAFC3] hover:text-[#FFFFFF] flex items-center gap-1 transition-colors text-[10px]"
              >
                <span>Google Maps</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </div>

          {/* Interactive Live Map Frame with Fallback Canvas */}
          <div className="relative w-full h-44 sm:h-52 bg-[#080B10] overflow-hidden group">
            {/* Embedded OpenStreetMap Preview */}
            <iframe
              title="Real-Time OpenStreetMap Preview"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${currentCoords.lon - 0.008}%2C${currentCoords.lat - 0.005}%2C${currentCoords.lon + 0.008}%2C${currentCoords.lat + 0.005}&layer=mapnik&marker=${currentCoords.lat}%2C${currentCoords.lon}`}
              className="w-full h-full border-0 pointer-events-auto filter saturate-[0.85] contrast-[1.1]"
              loading="lazy"
            />

            {/* Glowing Map Pin Overlay Indicator */}
            <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-[#080B10]/90 backdrop-blur-md border border-[#243447] text-[10px] text-[#7DD3FC] flex items-center gap-1.5 shadow-md pointer-events-none">
              <MapPin className="h-3 w-3 text-[#7DD3FC] animate-bounce" />
              <span className="font-semibold">Live GPS Telemetry</span>
            </div>

            {/* Refresh GPS Button on map */}
            <button
              type="button"
              onClick={handleFetchCurrentLocation}
              disabled={isLocating}
              title="Refresh real-time GPS coordinates"
              className="absolute bottom-3 right-3 h-8 w-8 rounded-lg bg-[#080B10]/95 hover:bg-[#102A43] border border-[#243447] text-[#7DD3FC] hover:text-[#FFFFFF] flex items-center justify-center shadow-lg transition-all focus:outline-none"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLocating ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Map Footer: Resolved Display Name */}
          {resolvedSummary && (
            <div className="px-3 py-2 bg-[#080B10] border-t border-[#243447]/60 text-[11px] text-[#9CAFC3] flex items-center gap-2">
              <MapPin className="h-3 w-3 text-[#7DD3FC] shrink-0" />
              <span className="truncate">{resolvedSummary}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
