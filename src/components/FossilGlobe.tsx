import { useEffect, useRef, useState } from "react";
import * as CesiumRuntime from "cesium";
import { Cartesian2, Cartesian3, Cartographic, Color, Credit, Math as CesiumMath, Material, PointPrimitiveCollection, PolylineCollection, SceneTransforms, ScreenSpaceEventHandler, ScreenSpaceEventType, SingleTileImageryProvider, type ImageryLayer, type Viewer } from "cesium";
import { ancientLifeRecords, type AncientLifeRecord, type AncientZoomLevel } from "../data/ancientLife";
import { ENV_COLOR, loadStageSites, loadTaxonTraces, type RegionTrace, type TaxonTrace } from "../data/pbdb";
import type { FossilRecord } from "../data/fossils";
import { presentTraceRecords, type PresentTraceRecord } from "../data/presentTraces";
import type { FossilTimeMode } from "./TimeModeToggle";
import { AncientLifeMarker } from "./AncientLifeMarker";
import { PresentTraceMarker } from "./PresentTraceMarker";
import { PresentSpeciesMarker } from "./PresentSpeciesMarker";
import { DriftGhost, DriftMarker, DriftTarget } from "./DriftMarker";
import { createEarthViewer } from "../globe/cesium/createViewer";
import { fossilCopy, localizeLife, type Locale } from "../fossil/localization";
import { DRIFT_BEATS, DRIFT_TRAIL_LIMIT, DRIFT_TRAIL_SAMPLES, DRIFT_TRAVEL_HEIGHT, driftDistanceKm, formatLatitude, interpolateDrift, trailLiftMetres, type DriftPhase, type DriftPlan, type DriftPoint } from "../fossil/drift";

interface FossilGlobeProps {
  record: FossilRecord;
  mode: FossilTimeMode;
  locale: Locale;
  showEvidence: boolean;
  onSelectTrace: (trace: PresentTraceRecord) => void;
  onSelectLife: (life: AncientLifeRecord) => void;
  focusLife?: AncientLifeRecord | null;
  focusTrace?: PresentTraceRecord | null;
  /** A time shift to play out. Null while the globe is at rest. */
  drift?: DriftPlan | null;
  onDriftPhase?: (phase: DriftPhase) => void;
  onZoomLevelChange?: (level: AncientZoomLevel) => void;
  /** Present mode: a click on the Earth, in modern degrees. */
  onPickLocation?: (latitude: number, longitude: number) => void;
  onSitesLoaded?: (count: number) => void;
  focusRequest?: number;
}

/**
 * The fossil sites drawn on the ancient Earth. Cenomanian is the stage that
 * contains the 95 Ma prototype; other stages exist in `public/data/pbdb/`.
 */
const ANCIENT_STAGE_ID = "cenomanian";

interface PointLike {
  latitude: number;
  longitude: number;
}

interface ProjectedPoint {
  x: number;
  y: number;
  visible: boolean;
}

interface EllipsoidalOccluderLike {
  cameraPosition: Cartesian3;
  isPointVisible(point: Cartesian3): boolean;
}

const EllipsoidalOccluder = (CesiumRuntime as unknown as {
  EllipsoidalOccluder: new (ellipsoid: Viewer["scene"]["globe"]["ellipsoid"], cameraPosition?: Cartesian3) => EllipsoidalOccluderLike;
}).EllipsoidalOccluder;

type TimeShiftDirection = "to-present" | "to-ancient";

export function FossilGlobe({ record, mode, locale, showEvidence, onSelectTrace, onSelectLife, focusLife, focusTrace, drift = null, onDriftPhase, onZoomLevelChange, onPickLocation, onSitesLoaded, focusRequest = 0 }: FossilGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const traceMarkerRefs = useRef(new Map<string, HTMLButtonElement>());
  const lifeMarkerRefs = useRef(new Map<string, HTMLButtonElement>());
  const viewerRef = useRef<Viewer | null>(null);
  const sitePointsRef = useRef<PointPrimitiveCollection | null>(null);
  const localityPointsRef = useRef<PointPrimitiveCollection | null>(null);
  const trailsRef = useRef<PolylineCollection | null>(null);
  const modeRef = useRef(mode);
  const showEvidenceRef = useRef(showEvidence);
  const focusLifeRef = useRef(focusLife);
  const recordRef = useRef(record);
  const syncSurfaceRef = useRef<((nextMode: FossilTimeMode) => void) | null>(null);
  const onZoomLevelChangeRef = useRef(onZoomLevelChange);
  const onPickLocationRef = useRef(onPickLocation);
  const onSitesLoadedRef = useRef(onSitesLoaded);
  const zoomLevelRef = useRef<AncientZoomLevel>(1);
  const [zoomLevel, setZoomLevel] = useState<AncientZoomLevel>(1);
  const [timeShift, setTimeShift] = useState<TimeShiftDirection | null>(null);
  // Where each creature is dug up today. Loaded once; markers appear on the
  // present-day Earth wherever a taxon has recorded localities.
  const [taxonTraces, setTaxonTraces] = useState<Record<string, TaxonTrace>>({});
  const [regionTraces, setRegionTraces] = useState<Record<string, RegionTrace>>({});
  const taxonTracesRef = useRef(taxonTraces);
  const regionTracesRef = useRef(regionTraces);
  const speciesMarkerRefs = useRef(new Map<string, HTMLButtonElement>());
  useEffect(() => { taxonTracesRef.current = taxonTraces; }, [taxonTraces]);
  useEffect(() => { regionTracesRef.current = regionTraces; }, [regionTraces]);
  useEffect(() => {
    loadTaxonTraces()
      .then(({ taxa, regions }) => { setTaxonTraces(taxa); setRegionTraces(regions ?? {}); })
      .catch((error: unknown) => console.warn("Taxon traces could not be loaded", error));
  }, []);

  // Drift plumbing. The readout is written straight into the DOM each frame:
  // re-rendering React sixty times a second to animate two numbers is not worth
  // the frames it costs on the globe.
  const driftMarkerRef = useRef<HTMLDivElement>(null);
  const driftGhostRef = useRef<HTMLDivElement>(null);
  const driftLatRef = useRef<HTMLSpanElement>(null);
  const driftDistanceRef = useRef<HTMLSpanElement>(null);
  const driftPointRef = useRef<DriftPoint | null>(null);
  const driftGhostPointRef = useRef<DriftPoint | null>(null);
  const driftTargetRef = useRef<HTMLDivElement>(null);
  const driftTargetPointRef = useRef<DriftPoint | null>(null);
  const onDriftPhaseRef = useRef(onDriftPhase);
  useEffect(() => { onDriftPhaseRef.current = onDriftPhase; }, [onDriftPhase]);

  useEffect(() => {
    const previousMode = modeRef.current;
    modeRef.current = mode;
    syncSurfaceRef.current?.(mode);
    if (previousMode === mode) return;
    const direction: TimeShiftDirection = mode === "present" ? "to-present" : "to-ancient";
    setTimeShift(direction);
    const timer = window.setTimeout(() => setTimeShift(null), 880);
    return () => window.clearTimeout(timer);
  }, [mode]);
  useEffect(() => {
    showEvidenceRef.current = showEvidence;
    if (sitePointsRef.current) {
      sitePointsRef.current.show = mode === "ancient" && showEvidence && zoomLevelRef.current >= 2;
    }
  }, [mode, showEvidence]);
  useEffect(() => { onZoomLevelChangeRef.current = onZoomLevelChange; }, [onZoomLevelChange]);
  useEffect(() => { onPickLocationRef.current = onPickLocation; }, [onPickLocation]);
  useEffect(() => { onSitesLoadedRef.current = onSitesLoaded; }, [onSitesLoaded]);
  useEffect(() => { focusLifeRef.current = focusLife; }, [focusLife]);
  useEffect(() => { recordRef.current = record; }, [record]);

  useEffect(() => {
    if (!containerRef.current) return;
    const viewer = createEarthViewer(containerRef.current);
    viewerRef.current = viewer;
    viewer.scene.globe.baseColor = Color.fromCssColorString("#08191b");
    viewer.camera.setView({ destination: Cartesian3.fromDegrees(-8, 20, 10_500_000) });
    const windowPosition = new Cartesian2();
    const occluder = new EllipsoidalOccluder(viewer.scene.globe.ellipsoid, viewer.camera.positionWC);
    let ancientLayer: ImageryLayer | null = null;
    let animationFrame = 0;

    const baseLayers = () => Array.from({ length: viewer.imageryLayers.length }, (_, index) => viewer.imageryLayers.get(index))
      .filter((layer) => layer !== ancientLayer);
    const showSurfaceImmediately = (nextMode: FossilTimeMode) => {
      for (const layer of baseLayers()) {
        layer.show = nextMode === "present";
        layer.alpha = 1;
      }
      if (ancientLayer) {
        ancientLayer.show = nextMode === "ancient";
        ancientLayer.alpha = nextMode === "ancient" ? 1 : 0;
      }
    };
    const stopAnimation = () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    };

    // The fossil record itself, placed with the same PALEOMAP reconstruction
    // family as the PaleoDEM surface. Environment classes remain evidence from
    // the collection record, not a claim that the raster is exact at site scale.
    const sitePoints = viewer.scene.primitives.add(new PointPrimitiveCollection());
    sitePointsRef.current = sitePoints;
    sitePoints.show = modeRef.current === "ancient" && showEvidenceRef.current && zoomLevelRef.current >= 2;
    void loadStageSites(ANCIENT_STAGE_ID).then((stage) => {
      if (viewer.isDestroyed()) return;
      for (const site of stage.sites) {
        sitePoints.add({
          position: Cartesian3.fromDegrees(site.paleoLng, site.paleoLat),
          color: Color.fromCssColorString(ENV_COLOR[site.env]).withAlpha(0.46),
          pixelSize: 3,
        });
      }
      onSitesLoadedRef.current?.(stage.sites.length);
    }).catch((error: unknown) => {
      console.warn("PBDB sites could not be loaded", error);
    });

    // Every published locality of the selected creature. Drawn where the ground
    // sits now, or where it sat then — the same places, two ages.
    const localityPoints = viewer.scene.primitives.add(new PointPrimitiveCollection());
    localityPointsRef.current = localityPoints;
    localityPoints.show = false;

    // The paths the ground took. Only drawn while a time shift is playing: the
    // journey is the thing being watched, not a layer to leave switched on.
    const trails = viewer.scene.primitives.add(new PolylineCollection());
    trailsRef.current = trails;

    const clickHandler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    clickHandler.setInputAction((movement: { position: Cartesian2 }) => {
      if (modeRef.current !== "present") return;
      const picked = viewer.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
      if (!picked) return;
      const carto = Cartographic.fromCartesian(picked);
      onPickLocationRef.current?.(CesiumMath.toDegrees(carto.latitude), CesiumMath.toDegrees(carto.longitude));
    }, ScreenSpaceEventType.LEFT_CLICK);

    const syncSurface = (nextMode: FossilTimeMode) => {
      stopAnimation();
      sitePoints.show = nextMode === "ancient" && showEvidenceRef.current && zoomLevelRef.current >= 2;
      const currentBaseLayers = baseLayers();
      if (!ancientLayer) {
        for (const layer of currentBaseLayers) {
          // Keep the present Earth visible until the local paleo image has
          // finished loading. The image layer will take over immediately
          // once it is ready.
          layer.show = true;
          layer.alpha = 1;
        }
        return;
      }
      ancientLayer.show = true;
      const start = performance.now();
      const duration = 680;
      const animate = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = progress * (2 - progress);
        const ancientAlpha = nextMode === "ancient" ? eased : 1 - eased;
        const presentAlpha = 1 - ancientAlpha;
        ancientLayer!.alpha = ancientAlpha;
        for (const layer of baseLayers()) {
          layer.show = true;
          layer.alpha = presentAlpha;
        }
        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          ancientLayer!.show = nextMode === "ancient";
          for (const layer of baseLayers()) {
            layer.show = nextMode === "present";
            layer.alpha = 1;
          }
          animationFrame = 0;
        }
      };
      animationFrame = requestAnimationFrame(animate);
    };
    syncSurfaceRef.current = syncSurface;
    const onLayerAdded = () => syncSurface(modeRef.current);
    viewer.imageryLayers.layerAdded.addEventListener(onLayerAdded);
    void loadPaleoImageryProvider().then((provider) => {
      if (viewer.isDestroyed()) {
        return;
      }
      ancientLayer = viewer.imageryLayers.addImageryProvider(provider);
      showSurfaceImmediately(modeRef.current);
    }).catch((error: unknown) => {
      console.warn("Paleo Earth texture could not be loaded", error);
    });

    const setLifeMarkerPosition = (element: HTMLElement, point: PointLike) => {
      const projected = projectPoint(viewer, occluder, point, windowPosition);
      element.style.left = `${projected.x}px`;
      element.style.top = `${projected.y}px`;
      element.style.visibility = projected.visible ? "visible" : "hidden";
    };
    const updateZoomLevel = () => {
      const nextLevel = getAncientZoomLevel(viewer.camera.positionCartographic.height);
      if (nextLevel === zoomLevelRef.current) return;
      zoomLevelRef.current = nextLevel;
      sitePoints.show = modeRef.current === "ancient" && showEvidenceRef.current && nextLevel >= 2;
      setZoomLevel(nextLevel);
      onZoomLevelChangeRef.current?.(nextLevel);
    };

    const updatePositions = () => {
      for (const trace of presentTraceRecords) {
        const marker = traceMarkerRefs.current.get(trace.id);
        const currentRecord = recordRef.current;
        const point = trace.featured && focusLifeRef.current?.id === "spinosaurus"
          ? { latitude: currentRecord.presentLat, longitude: currentRecord.presentLng }
          : { latitude: trace.presentLat, longitude: trace.presentLng };
        if (marker) setLifeMarkerPosition(marker, point);
      }
      for (const life of ancientLifeRecords) {
        const marker = lifeMarkerRefs.current.get(life.id);
        if (marker) setLifeMarkerPosition(marker, { latitude: life.lat, longitude: life.lng });
      }
      for (const life of ancientLifeRecords) {
        const marker = speciesMarkerRefs.current.get(life.id);
        const trace = taxonTracesRef.current[life.id];
        if (marker && trace) setLifeMarkerPosition(marker, { latitude: trace.lat, longitude: trace.lng });
      }
      const driftPoint = driftPointRef.current;
      if (driftPoint && driftMarkerRef.current) {
        setLifeMarkerPosition(driftMarkerRef.current, { latitude: driftPoint.lat, longitude: driftPoint.lng });
      }
      const ghostPoint = driftGhostPointRef.current;
      if (ghostPoint && driftGhostRef.current) {
        setLifeMarkerPosition(driftGhostRef.current, { latitude: ghostPoint.lat, longitude: ghostPoint.lng });
      }
      const targetPoint = driftTargetPointRef.current;
      if (targetPoint && driftTargetRef.current) {
        setLifeMarkerPosition(driftTargetRef.current, { latitude: targetPoint.lat, longitude: targetPoint.lng });
      }
    };

    viewer.scene.postRender.addEventListener(updatePositions);
    viewer.camera.changed.addEventListener(updateZoomLevel);
    updateZoomLevel();
    window.addEventListener("resize", updatePositions);
    return () => {
      window.removeEventListener("resize", updatePositions);
      viewer.scene.postRender.removeEventListener(updatePositions);
      viewer.camera.changed.removeEventListener(updateZoomLevel);
      viewer.imageryLayers.layerAdded.removeEventListener(onLayerAdded);
      clickHandler.destroy();
      syncSurfaceRef.current = null;
      stopAnimation();
      sitePointsRef.current = null;
      localityPointsRef.current = null;
      trailsRef.current = null;
      viewerRef.current = null;
      viewer.destroy();
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || focusRequest === 0) return;
    const point = mode === "present"
      ? focusLife?.id === "spinosaurus"
        ? { latitude: record.presentLat, longitude: record.presentLng }
        : { latitude: focusTrace?.presentLat ?? record.presentLat, longitude: focusTrace?.presentLng ?? record.presentLng }
      : { latitude: focusLife?.lat ?? record.paleoLat, longitude: focusLife?.lng ?? record.paleoLng };
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(point.longitude, point.latitude, mode === "present" ? 4_200_000 : focusLife?.recordType === "taxon" ? 3_600_000 : 6_500_000),
      duration: 1.25,
    });
  }, [focusRequest, focusLife, focusTrace, mode, record]);

  // The localities of whatever creature is selected. Warm on the living Earth,
  // brown on the present one, so the scatter reads as the same two faces the
  // markers use.
  useEffect(() => {
    const points = localityPointsRef.current;
    if (!points) return;
    points.removeAll();
    const trace = focusLife?.recordType === "taxon" ? taxonTraces[focusLife.id] : undefined;
    if (!trace || drift) {
      points.show = false;
      return;
    }
    const ancient = mode === "ancient";
    const colour = Color.fromCssColorString(ancient ? "#ffd690" : "#a87e52");
    for (const [lng, lat, paleoLng, paleoLat] of trace.localities) {
      points.add({
        position: ancient ? Cartesian3.fromDegrees(paleoLng, paleoLat) : Cartesian3.fromDegrees(lng, lat),
        color: colour.withAlpha(0.85),
        outlineColor: Color.fromCssColorString(ancient ? "#3a2a10" : "#241708").withAlpha(0.7),
        outlineWidth: 1,
        pixelSize: 6,
      });
    }
    points.show = true;
  }, [focusLife, taxonTraces, mode, drift]);

  // The drift. Everything here happens in one rAF loop so the beats stay in
  // order: hold, then the world swaps while the point travels, then the
  // creature becomes bone, then the camera finally comes down. Playing them at
  // once is what made the old switch unreadable.
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !drift) {
      driftPointRef.current = null;
      driftGhostPointRef.current = null;
      driftTargetPointRef.current = null;
      return;
    }

    driftPointRef.current = { ...drift.from };
    driftGhostPointRef.current = { ...drift.from };
    driftTargetPointRef.current = { ...drift.to };
    const marker = driftMarkerRef.current;
    marker?.classList.remove("is-morphed");

    const startHeight = viewer.camera.positionCartographic.height;
    const settleHeight = drift.targetMode === "present" ? 4_200_000 : 6_500_000;
    const start = performance.now();
    let frame = 0;
    let swapped = false;
    let morphed = false;

    const ease = (t: number) => t * t * (3 - 2 * t);
    let finished = false;

    // The creature's own localities travel alongside the marker. Every one of
    // them moves; a sample of them leave a drawn arc, and the shape of that
    // bundle is the point — a creature on one plate leaves parallel tracks,
    // one spread over several leaves tracks that converge.
    // A creature's own localities when one is chosen, otherwise the whole rock
    // unit's — so a crossing always carries something with it.
    const trace = (drift.taxonId ? taxonTracesRef.current[drift.taxonId] : undefined)
      ?? (drift.regionId ? regionTracesRef.current[drift.regionId] : undefined);
    const toPresent = drift.direction === "to-present";
    const journeys = (trace?.localities ?? []).map(([lng, lat, paleoLng, paleoLat]) => ({
      from: toPresent ? { lat: paleoLat, lng: paleoLng } : { lat, lng },
      to: toPresent ? { lat, lng } : { lat: paleoLat, lng: paleoLng },
    }));
    const swarm = localityPointsRef.current;
    const trails = trailsRef.current;
    trails?.removeAll();
    if (swarm && journeys.length > 0) {
      swarm.removeAll();
      for (const journey of journeys) {
        swarm.add({
          position: Cartesian3.fromDegrees(journey.from.lng, journey.from.lat),
          color: Color.fromCssColorString("#ffd690").withAlpha(0.9),
          outlineColor: Color.fromCssColorString("#2a1c08").withAlpha(0.7),
          outlineWidth: 1,
          pixelSize: 6,
        });
      }
      swarm.show = true;
    }
    if (trails && journeys.length > 0) {
      const stride = Math.max(1, Math.ceil(journeys.length / DRIFT_TRAIL_LIMIT));
      for (let index = 0; index < journeys.length; index += stride) {
        const journey = journeys[index]!;
        const lift = trailLiftMetres(driftDistanceKm(journey.from, journey.to));
        const positions = Array.from({ length: DRIFT_TRAIL_SAMPLES }, (_, step) => {
          const fraction = step / (DRIFT_TRAIL_SAMPLES - 1);
          const point = interpolateDrift(journey.from, journey.to, fraction);
          return Cartesian3.fromDegrees(point.lng, point.lat, Math.sin(fraction * Math.PI) * lift);
        });
        trails.add({
          positions,
          width: 1.4,
          material: Material.fromType("Color", { color: Color.fromCssColorString("#ffd690").withAlpha(0) }),
        });
      }
      trails.show = true;
    }
    const setTrailAlpha = (alpha: number) => {
      if (!trails) return;
      for (let index = 0; index < trails.length; index += 1) {
        const line = trails.get(index);
        (line.material.uniforms as { color: Color }).color = Color.fromCssColorString("#ffd690").withAlpha(alpha);
      }
    };

    // A hidden tab pauses requestAnimationFrame, so a drift started just before
    // the user looks away would freeze with the card withheld and no way back.
    // The timer lands the journey regardless of whether any frame ever ran.
    const land = () => {
      if (finished) return;
      finished = true;
      if (frame) cancelAnimationFrame(frame);
      if (!swapped) {
        swapped = true;
        onDriftPhaseRef.current?.("swap");
      }
      marker?.classList.add("is-morphed");
      trailsRef.current?.removeAll();
      driftPointRef.current = { ...drift.to };
      viewer.camera.setView({
        destination: Cartesian3.fromDegrees(drift.to.lng, drift.to.lat, settleHeight),
        orientation: { heading: 0, pitch: -CesiumMath.PI_OVER_TWO, roll: 0 },
      });
      onDriftPhaseRef.current?.("done");
    };
    const safety = window.setTimeout(land, DRIFT_BEATS.settleEnd + 900);

    const step = (now: number) => {
      if (finished) return;
      const elapsed = now - start;

      if (!swapped && elapsed >= DRIFT_BEATS.hold) {
        swapped = true;
        onDriftPhaseRef.current?.("swap");
      }

      if (elapsed >= DRIFT_BEATS.hold && elapsed < DRIFT_BEATS.settleEnd) {
        const travelSpan = DRIFT_BEATS.travelEnd - DRIFT_BEATS.hold;
        const raw = Math.min(1, (elapsed - DRIFT_BEATS.hold) / travelSpan);
        const t = ease(raw);
        const point = interpolateDrift(drift.from, drift.to, t);
        driftPointRef.current = point;

        if (swarm && journeys.length > 0) {
          for (let index = 0; index < journeys.length; index += 1) {
            const journey = journeys[index]!;
            const carried = interpolateDrift(journey.from, journey.to, t);
            swarm.get(index).position = Cartesian3.fromDegrees(carried.lng, carried.lat);
          }
        }
        // In by the time the crossing is a third done, out again as it lands.
        setTrailAlpha(Math.min(raw / 0.3, 1) * (1 - Math.max(0, (raw - 0.75) / 0.25)) * 0.5);

        // Rise away from the surface for the crossing, then come back down
        // during the settle beat. The pull-back is what lets the whole
        // continent move inside the frame.
        const lifted = Math.min(1, raw / 0.35);
        const settleRaw = Math.max(0, (elapsed - DRIFT_BEATS.morphEnd) / (DRIFT_BEATS.settleEnd - DRIFT_BEATS.morphEnd));
        const height = settleRaw > 0
          ? DRIFT_TRAVEL_HEIGHT + (settleHeight - DRIFT_TRAVEL_HEIGHT) * ease(Math.min(1, settleRaw))
          : startHeight + (DRIFT_TRAVEL_HEIGHT - startHeight) * ease(lifted);
        viewer.camera.setView({
          destination: Cartesian3.fromDegrees(point.lng, point.lat, height),
          orientation: { heading: 0, pitch: -CesiumMath.PI_OVER_TWO, roll: 0 },
        });

        if (driftGhostRef.current) driftGhostRef.current.style.opacity = `${Math.max(0, 1 - raw * 1.35)}`;
        if (driftLatRef.current) driftLatRef.current.textContent = formatLatitude(point.lat, locale);
        if (driftDistanceRef.current) {
          driftDistanceRef.current.textContent = Math.round(drift.distanceKm * t).toLocaleString();
        }
      }

      if (!morphed && elapsed >= DRIFT_BEATS.travelEnd) {
        morphed = true;
        marker?.classList.add("is-morphed");
      }

      if (elapsed < DRIFT_BEATS.settleEnd) {
        frame = requestAnimationFrame(step);
        return;
      }
      finished = true;
      window.clearTimeout(safety);
      trailsRef.current?.removeAll();
      driftPointRef.current = { ...drift.to };
      onDriftPhaseRef.current?.("done");
    };

    frame = requestAnimationFrame(step);
    return () => {
      finished = true;
      window.clearTimeout(safety);
      trailsRef.current?.removeAll();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [drift, locale]);

  const isAncient = mode === "ancient";
  const isDrifting = drift !== null;
  const showAncientMarkers = (isAncient || timeShift === "to-present") && !isDrifting;
  const showPresentMarkers = (!isAncient || timeShift === "to-ancient") && !isDrifting;
  const copy = fossilCopy[locale];
  const trackingLabel = focusLife ? localizeLife(focusLife, locale).name : null;

  return (
    <div className="fossil-globe-stage">
      <div ref={containerRef} className="earth-globe fossil-globe" aria-label={copy.globeLabel} />
      <div className="fossil-globe-overlay">
        {presentTraceRecords.map((trace) => (
          <PresentTraceMarker
            key={trace.id}
            ref={(element) => {
              if (element) traceMarkerRefs.current.set(trace.id, element);
              else traceMarkerRefs.current.delete(trace.id);
            }}
            record={trace}
            locale={locale}
            isVisible={showPresentMarkers}
            isEntering={timeShift === "to-present"}
            isSelected={focusTrace?.id === trace.id}
            selectedTaxonName={focusLife?.recordType === "taxon" && focusLife.regionId === trace.regionId ? localizeLife(focusLife, locale).name : undefined}
            onClick={() => onSelectTrace(trace)}
          />
        ))}
        {ancientLifeRecords.map((life: AncientLifeRecord) => {
          const trace = taxonTraces[life.id];
          if (!trace) return null;
          return (
            <PresentSpeciesMarker
              key={`present-${life.id}`}
              ref={(element) => {
                if (element) speciesMarkerRefs.current.set(life.id, element);
                else speciesMarkerRefs.current.delete(life.id);
              }}
              record={life}
              trace={trace}
              locale={locale}
              isVisible={showPresentMarkers && zoomLevel >= 2}
              isSelected={focusLife?.id === life.id}
              showLabel={zoomLevel >= 2}
              spread={speciesSpread(life, taxonTraces)}
              onClick={() => onSelectLife(life)}
            />
          );
        })}
        {ancientLifeRecords.map((life: AncientLifeRecord) => (
          <AncientLifeMarker
            key={life.id}
            ref={(element) => {
              if (element) lifeMarkerRefs.current.set(life.id, element);
              else lifeMarkerRefs.current.delete(life.id);
            }}
            record={life}
            locale={locale}
            isVisible={showAncientMarkers && zoomLevel >= life.minZoomLevel && (life.maxZoomLevel === undefined || zoomLevel <= life.maxZoomLevel)}
            showLabel={isAncient && (life.recordType === "ecosystem" || zoomLevel === 3)}
            isSelected={focusLife?.id === life.id}
            isEntering={timeShift === "to-ancient" && focusLife?.id === life.id}
            onClick={() => onSelectLife(life)}
          />
        ))}
        {drift && (
          <>
            <DriftGhost ref={driftGhostRef} icon={drift.fromIcon} label={drift.fromAgeLabel} tone={drift.direction === "to-present" ? "living" : "trace"} />
            <DriftTarget ref={driftTargetRef} label={drift.toAgeLabel} />
            <DriftMarker
              ref={driftMarkerRef}
              direction={drift.direction}
              fromIcon={drift.fromIcon}
              toIcon={drift.toIcon}
              fromLabel={drift.fromLabel}
              toLabel={drift.toLabel}
            />
          </>
        )}
      </div>
      {drift && (
        <div className="drift-readout" role="status" aria-live="polite">
          <div className="drift-readout__ages">
          <span>{drift.fromAgeLabel}</span>
          <i aria-hidden="true">→</i>
          <strong>{drift.toAgeLabel}</strong>
        </div>
        <dl className="drift-readout__rows">
          <dt>{copy.driftLatitude}</dt>
          <dd>
            <span ref={driftLatRef}>{formatLatitude(drift.from.lat, locale)}</span>
            <i aria-hidden="true">→</i>
            <b>{formatLatitude(drift.to.lat, locale)}</b>
          </dd>
          <dt>{copy.driftDistance}</dt>
          <dd>
            <span ref={driftDistanceRef}>0</span>
            <i aria-hidden="true">→</i>
            <b>{Math.round(drift.distanceKm).toLocaleString()} km</b>
          </dd>
        </dl>
        </div>
      )}
      {timeShift && !drift && (
        <div className={`fossil-time-shift fossil-time-shift--${timeShift}`} role="status" aria-live="polite">
          <div>
            <span>{timeShift === "to-present" ? copy.livingWorlds : copy.presentFossilTraces}</span>
            <i aria-hidden="true">→</i>
            <strong>{timeShift === "to-present" ? copy.presentFossilTraces : copy.livingWorlds}</strong>
          </div>
          {trackingLabel && <small>{copy.tracking} · {trackingLabel}</small>}
        </div>
      )}
    </div>
  );
}

/**
 * Species from one region land within a degree or two of each other, so their
 * markers stack. This pushes them apart on screen only — around a small circle
 * in a fixed order, so the same creature always sits in the same place rather
 * than jumping about between renders.
 */
const SPREAD_STEP = 32;
function speciesSpread(life: AncientLifeRecord, traces: Record<string, TaxonTrace>): readonly [number, number] {
  const region = traces[life.id]?.region;
  const siblings = ancientLifeRecords.filter((other) => traces[other.id]?.region === region);
  if (siblings.length < 2) return [0, 0];
  const index = siblings.findIndex((other) => other.id === life.id);
  // Stacked, not scattered: these labels are wide, so pushing them around a
  // circle still leaves them overlapping. A ladder with a slight zigzag keeps
  // every name readable.
  return [index % 2 === 0 ? -20 : 20, (index - (siblings.length - 1) / 2) * SPREAD_STEP];
}

function getAncientZoomLevel(cameraHeight: number): AncientZoomLevel {
  if (cameraHeight <= 4_000_000) return 3;
  if (cameraHeight <= 8_000_000) return 2;
  return 1;
}

async function loadPaleoImageryProvider(): Promise<SingleTileImageryProvider> {
  return SingleTileImageryProvider.fromUrl(`${import.meta.env.BASE_URL}geo/paleodem-95.webp`, {
    credit: new Credit("Deep Lens / Scotese & Wright (2018) PALEOMAP PaleoDEM · 95 Ma · 1° grid · CC BY 4.0"),
  });
}

function projectPoint(viewer: Viewer, occluder: EllipsoidalOccluderLike, point: PointLike, windowPosition: Cartesian2): ProjectedPoint {
  const worldPosition = Cartesian3.fromDegrees(point.longitude, point.latitude, 18_000);
  const projected = SceneTransforms.worldToWindowCoordinates(viewer.scene, worldPosition, windowPosition);
  if (!projected) return { x: 0, y: 0, visible: false };
  occluder.cameraPosition = viewer.camera.positionWC;
  return { x: projected.x, y: projected.y, visible: occluder.isPointVisible(worldPosition) };
}
