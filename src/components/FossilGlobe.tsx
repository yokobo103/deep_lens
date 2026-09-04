import { useEffect, useRef, useState } from "react";
import * as CesiumRuntime from "cesium";
import { Cartesian2, Cartesian3, Cartographic, Color, Credit, Math as CesiumMath, PointPrimitiveCollection, SceneTransforms, ScreenSpaceEventHandler, ScreenSpaceEventType, SingleTileImageryProvider, type ImageryLayer, type Viewer } from "cesium";
import { ancientLifeRecords, type AncientLifeRecord, type AncientZoomLevel } from "../data/ancientLife";
import { ENV_COLOR, loadStageSites } from "../data/pbdb";
import type { FossilRecord } from "../data/fossils";
import { presentTraceRecords, type PresentTraceRecord } from "../data/presentTraces";
import type { FossilTimeMode } from "./TimeModeToggle";
import { AncientLifeMarker } from "./AncientLifeMarker";
import { PresentTraceMarker } from "./PresentTraceMarker";
import { createEarthViewer } from "../globe/cesium/createViewer";
import { fossilCopy, localizeLife, type Locale } from "../fossil/localization";

interface FossilGlobeProps {
  record: FossilRecord;
  mode: FossilTimeMode;
  locale: Locale;
  showEvidence: boolean;
  onSelectTrace: (trace: PresentTraceRecord) => void;
  onSelectLife: (life: AncientLifeRecord) => void;
  focusLife?: AncientLifeRecord | null;
  focusTrace?: PresentTraceRecord | null;
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

export function FossilGlobe({ record, mode, locale, showEvidence, onSelectTrace, onSelectLife, focusLife, focusTrace, onZoomLevelChange, onPickLocation, onSitesLoaded, focusRequest = 0 }: FossilGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const traceMarkerRefs = useRef(new Map<string, HTMLButtonElement>());
  const lifeMarkerRefs = useRef(new Map<string, HTMLButtonElement>());
  const viewerRef = useRef<Viewer | null>(null);
  const sitePointsRef = useRef<PointPrimitiveCollection | null>(null);
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

  const isAncient = mode === "ancient";
  const showAncientMarkers = isAncient || timeShift === "to-present";
  const showPresentMarkers = !isAncient || timeShift === "to-ancient";
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
      </div>
      {timeShift && (
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

function getAncientZoomLevel(cameraHeight: number): AncientZoomLevel {
  if (cameraHeight <= 4_000_000) return 3;
  if (cameraHeight <= 8_000_000) return 2;
  return 1;
}

async function loadPaleoImageryProvider(): Promise<SingleTileImageryProvider> {
  return SingleTileImageryProvider.fromUrl(`${import.meta.env.BASE_URL}geo/paleodem-95.png`, {
    credit: new Credit("Deep Lens / Scotese & Wright (2018) PALEOMAP PaleoDEM · 95 Ma · CC BY 4.0"),
  });
}

function projectPoint(viewer: Viewer, occluder: EllipsoidalOccluderLike, point: PointLike, windowPosition: Cartesian2): ProjectedPoint {
  const worldPosition = Cartesian3.fromDegrees(point.longitude, point.latitude, 18_000);
  const projected = SceneTransforms.worldToWindowCoordinates(viewer.scene, worldPosition, windowPosition);
  if (!projected) return { x: 0, y: 0, visible: false };
  occluder.cameraPosition = viewer.camera.positionWC;
  return { x: projected.x, y: projected.y, visible: occluder.isPointVisible(worldPosition) };
}
