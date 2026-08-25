<script lang="ts">
  // Buildspec sections 22-23. Client-only: this component's script only runs
  // in the browser (Svelte components hydrate client-side under Astro's
  // client:* directives), so it is safe to touch window/document here, but
  // never at module scope in a way that would run during SSR.
  import { onMount, onDestroy } from "svelte";
  import { markerPresentationForEvent } from "../../lib/route-status/event-marker";
  import type { DashboardEventWithUnknownLane } from "../../lib/route-status/types";
  // Imported here, not in the <style> block below: Svelte scopes selectors
  // inside a component's <style> block, but Leaflet creates its DOM nodes
  // imperatively (not through the Svelte template), so those elements never
  // get the scoping attribute and every scoped Leaflet rule silently fails
  // to match — breaking the pane positioning CSS with no visible error.
  import "leaflet/dist/leaflet.css";

  export let routeGeoJsonUrl: string = "/routes/UnivWA-Issaquah.geojson";
  export let routeEventsUrl: string = "/data/route-events.geojson";
  export let routeDisplayTier: "normal" | "watch" | "alert" | "unknown" = "unknown";

  let mapEl: HTMLDivElement;
  let map: import("leaflet").Map | undefined;
  let status: "loading" | "ready" | "error" = "loading";
  let errorMessage = "";

  const ROUTE_STYLE = { color: "#C72B20", weight: 6, opacity: 0.98 };

  function markerPropsForFeature(feature: GeoJSON.Feature): DashboardEventWithUnknownLane {
    return (feature.properties ?? {}) as DashboardEventWithUnknownLane;
  }

  function coordinateToLatLng(L: typeof import("leaflet"), coordinate: GeoJSON.Position): import("leaflet").LatLng {
    return L.latLng(coordinate[1], coordinate[0]);
  }

  function representativeCoordinate(geometry: GeoJSON.Geometry | null): GeoJSON.Position | null {
    if (!geometry) return null;
    if (geometry.type === "Point") return geometry.coordinates;
    if (geometry.type === "LineString") return geometry.coordinates[Math.floor(geometry.coordinates.length / 2)] ?? null;
    if (geometry.type === "MultiLineString") {
      const line = geometry.coordinates.find((candidate) => candidate.length > 0);
      return line?.[Math.floor(line.length / 2)] ?? null;
    }
    if (geometry.type === "Polygon") {
      const ring = geometry.coordinates[0] ?? [];
      return ring[Math.floor(ring.length / 2)] ?? null;
    }
    if (geometry.type === "MultiPolygon") {
      const ring = geometry.coordinates[0]?.[0] ?? [];
      return ring[Math.floor(ring.length / 2)] ?? null;
    }
    return null;
  }

  function buildTriangleMarker(
    L: typeof import("leaflet"),
    feature: GeoJSON.Feature,
    latlng: import("leaflet").LatLng,
  ): import("leaflet").Marker {
    const presentation = markerPresentationForEvent(markerPropsForFeature(feature));
    const title = String((feature.properties ?? {}).title ?? "");
    const icon = L.divIcon({
      className: `map-marker-triangle ${presentation.cssClass}`,
      html: `<span aria-hidden="true"></span>`,
      iconSize: [28, 24],
      iconAnchor: [14, 12],
      popupAnchor: [0, -12],
    });
    const marker = L.marker(latlng, {
      icon,
      keyboard: true,
      alt: title ? `${presentation.label}: ${title}` : presentation.label,
    });
    marker.bindPopup(() => buildPopupContent(feature));
    return marker;
  }

  // Buildspec 22.5 — build real DOM nodes for popup content; never feed raw
  // source text into innerHTML.
  function buildPopupContent(feature: GeoJSON.Feature): HTMLElement {
    const props = (feature.properties ?? {}) as Record<string, unknown>;
    const root = document.createElement("div");
    root.className = "map-popup";

    const h3 = document.createElement("h3");
    h3.textContent = String(props.title ?? "");
    root.appendChild(h3);

    const dl = document.createElement("dl");
    const addRow = (label: string, value: unknown) => {
      if (value === null || value === undefined || value === "") return;
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = String(value);
      dl.appendChild(dt);
      dl.appendChild(dd);
    };

    addRow("Trail", props.trailName);
    addRow("Location", props.locationLabel ?? props.routeSegmentLabel ?? props.routeSegmentId);
    addRow("Alert", props.alertNature);
    addRow("Route impact", props.routeEffect);
    if (props.currentStatus === "active") addRow("Status", "Segment closed");
    else addRow("Status", props.currentStatus);
    addRow("From", props.closureStartCrossing);
    addRow("To", props.closureEndCrossing);
    if (typeof props.closedLengthMiles === "number") {
      addRow("Closed length", `${props.closedLengthMiles.toFixed(2)} mi`);
    }
    if (typeof props.detourAvailable === "boolean") {
      addRow("Detour", props.detourAvailable ? (props.detourDescription ?? "Yes") : "No");
    }
    addRow("Closure hours", props.closureHours);
    addRow("Expected reopening", props.projectedEndDate);

    if (typeof props.sourceUrl === "string" && props.sourceUrl) {
      const dt = document.createElement("dt");
      dt.textContent = "Source";
      const dd = document.createElement("dd");
      const link = document.createElement("a");
      link.href = props.sourceUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = typeof props.sourceName === "string" && props.sourceName ? props.sourceName : "Source";
      dd.appendChild(link);
      dl.appendChild(dt);
      dl.appendChild(dd);
    } else {
      addRow("Source", props.sourceName);
    }

    addRow("John Note", props.johnNote);

    root.appendChild(dl);
    return root;
  }

  async function loadJson(url: string): Promise<GeoJSON.FeatureCollection> {
    const response = await fetch(url, { headers: { accept: "application/json" } });
    if (!response.ok) {
      throw new Error(`${url} responded with HTTP ${response.status}`);
    }
    return (await response.json()) as GeoJSON.FeatureCollection;
  }

  onMount(async () => {
    try {
      const L = await import("leaflet");
      // Leaflet's default marker icon paths break under bundlers; this app
      // never uses the default icon (ring markers are drawn with divIcon),
      // so no icon URL patching is needed.

      const [routeGeoJson, eventsGeoJson] = await Promise.all([
        loadJson(routeGeoJsonUrl),
        loadJson(routeEventsUrl),
      ]);

      map = L.map(mapEl, {
        zoomControl: false,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Style: <a href="https://www.cyclosm.org">CyclOSM</a>',
        maxZoom: 20,
      }).addTo(map);

      void routeDisplayTier;
      const routeLayer = L.geoJSON(routeGeoJson, { style: () => ROUTE_STYLE }).addTo(map);

      const eventGeometryLayer = L.geoJSON(eventsGeoJson, {
        filter: (feature) => feature.geometry !== null && feature.geometry.type !== "Point",
        style: (feature) => {
          const presentation = markerPresentationForEvent(markerPropsForFeature(feature as GeoJSON.Feature));
          return {
            color: presentation.color,
            weight: 4,
            opacity: 0.9,
            dashArray: presentation.severity === "major" ? "6 5" : undefined,
          };
        },
        onEachFeature: (feature, layer) => {
          layer.bindPopup(() => buildPopupContent(feature));
        },
      }).addTo(map);

      const eventMarkerLayer = L.layerGroup();
      for (const feature of eventsGeoJson.features ?? []) {
        const coordinate = representativeCoordinate(feature.geometry);
        if (!coordinate) continue;
        buildTriangleMarker(L, feature, coordinateToLatLng(L, coordinate)).addTo(eventMarkerLayer);
      }
      eventMarkerLayer.addTo(map);

      // The container can still be mid-layout (e.g. CSS Grid not yet
      // settled) at the moment the Svelte island hydrates, which makes
      // Leaflet cache a stale, too-small size and produces a correctly
      // *shaped* but wrongly *zoomed/panned* fitBounds result. Force a
      // fresh size read on the next two animation frames (one for layout,
      // one for the resulting repaint) before fitting bounds.
      const bounds = routeLayer.getBounds();
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      map.invalidateSize();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [24, 24] });
      } else {
        map.setView([47.65, -122.2], 11);
      }

      L.control.zoom({ position: "topright" }).addTo(map);

      const FitRouteControl = L.Control.extend({
        options: { position: "topright" },
        onAdd: () => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "leaflet-control-uwissy";
          btn.setAttribute("aria-label", "Fit full route");
          btn.title = "Fit full route";
          btn.textContent = "⤢";
          btn.addEventListener("click", (event) => {
            event.stopPropagation();
            if (bounds.isValid() && map) map.fitBounds(bounds, { padding: [24, 24] });
          });
          const container = L.DomUtil.create("div", "leaflet-bar");
          container.appendChild(btn);
          L.DomEvent.disableClickPropagation(container);
          return container;
        },
      });
      new FitRouteControl().addTo(map);

      void eventGeometryLayer;
      void eventMarkerLayer;
      status = "ready";
    } catch (cause) {
      status = "error";
      errorMessage = cause instanceof Error ? cause.message : String(cause);
      // eslint-disable-next-line no-console
      console.error("[RouteMap] failed to load", cause);
    }
  });

  onDestroy(() => {
    map?.remove();
  });
</script>

<div class="route-map-wrap">
  <div bind:this={mapEl} style="height:100%;width:100%;" aria-hidden={status !== "ready"}></div>
  {#if status === "loading"}
    <div class="route-map-status" role="status">Loading route map</div>
  {:else if status === "error"}
    <div class="route-map-status" role="status">
      Route map unavailable.
    </div>
  {/if}
  <p class="route-map-sr-desc">
    Interactive map of the UW–Issy route and current route issues.
  </p>
</div>
