<script lang="ts">
  // Buildspec sections 22-23. Client-only: this component's script only runs
  // in the browser (Svelte components hydrate client-side under Astro's
  // client:* directives), so it is safe to touch window/document here, but
  // never at module scope in a way that would run during SSR.
  import { onMount, onDestroy } from "svelte";
  import { laneColorFor } from "../../lib/route-status/lane-colors";
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

  const ROUTE_STYLE_BY_TIER: Record<string, { color: string; weight: number; opacity: number; dashArray?: string }> = {
    normal: { color: "#167A31", weight: 5, opacity: 0.95 },
    watch: { color: "#C87900", weight: 5, opacity: 0.95 },
    alert: { color: "#C72B20", weight: 6, opacity: 0.95, dashArray: "8 6" },
    unknown: { color: "#657067", weight: 5, opacity: 0.8, dashArray: "4 6" },
  };

  function laneColorForRaw(laneId: string): string {
    return laneColorFor(laneId) ?? "#657067";
  }

  // Buildspec 22.5 — build real DOM nodes for popup content; never feed raw
  // source text into innerHTML.
  function buildPopupContent(feature: GeoJSON.Feature): HTMLElement {
    const props = (feature.properties ?? {}) as Record<string, unknown>;
    const root = document.createElement("div");
    root.className = "map-popup";

    const h3 = document.createElement("h3");
    h3.textContent = String(props.title ?? props.laneLabel ?? "Route event");
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

    addRow("Lane", props.laneLabel);
    addRow("Summary", props.summary);
    addRow("Location", props.locationLabel ?? props.routeSegmentLabel ?? props.routeSegmentId);
    addRow("Route effect", props.routeEffect);
    addRow("State", props.displayTier);
    if (props.isStale) addRow("Note", "Data may be out of date");
    if (props.isLastKnownGood) addRow("Note", "Showing last known data");

    root.appendChild(dl);

    if (typeof props.sourceUrl === "string" && props.sourceUrl) {
      const link = document.createElement("a");
      link.href = props.sourceUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = typeof props.sourceName === "string" && props.sourceName ? props.sourceName : "Source";
      root.appendChild(link);
    }

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

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      const style = ROUTE_STYLE_BY_TIER[routeDisplayTier] ?? ROUTE_STYLE_BY_TIER.unknown;
      const routeLayer = L.geoJSON(routeGeoJson, { style: () => style }).addTo(map);

      const eventLayer = L.geoJSON(eventsGeoJson, {
        pointToLayer: (feature, latlng) => {
          const laneId = String((feature.properties ?? {}).laneId ?? "");
          const color = laneColorForRaw(laneId);
          const icon = L.divIcon({
            className: "map-marker-ring",
            html: "",
            iconSize: [20, 20],
          });
          const marker = L.marker(latlng, {
            icon,
            keyboard: true,
            alt: String((feature.properties ?? {}).title ?? "Route event"),
          });
          // divIcon renders an empty <div class="map-marker-ring">; color the
          // border per-lane via inline style once the element exists.
          marker.on("add", () => {
            const el = marker.getElement();
            if (el) (el as HTMLElement).style.borderColor = color;
          });
          return marker;
        },
        onEachFeature: (feature, layer) => {
          layer.bindPopup(() => buildPopupContent(feature));
        },
      }).addTo(map);

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

      void eventLayer;
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
      The route map could not be loaded. Current route events are still listed below.
    </div>
  {/if}
  <p class="route-map-sr-desc">
    Interactive map showing the UW–Issy cycling route and current route events. A full text
    list appears below the map.
  </p>
</div>
