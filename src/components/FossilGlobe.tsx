import { useEffect, useRef, useState } from "react";
import * as CesiumRuntime from "cesium";
import { Cartesian2, Cartesian3, Color, Credit, SceneTransforms, SingleTileImageryProvider, type ImageryLayer, type Viewer } from "cesium";
import { ancientLifeRecords, type AncientLifeRecord, type AncientZoomLevel } from "../data/ancientLife";
import type { FossilRecord } from "../data/fossils";
import type { FossilTimeMode } from "./TimeModeToggle";
import { AncientLifeMarker } from "./AncientLifeMarker";
import { FossilMarker } from "./FossilMarker";
import { createEarthViewer } from "../globe/cesium/createViewer";

interface FossilGlobeProps {
  record: FossilRecord;
  mode: FossilTimeMode;
  onSelect: () => void;
  onZoomLevelChange?: (level: AncientZoomLevel) => void;
  focusRequest?: number;
}

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

export function FossilGlobe({ record, mode, onSelect, onZoomLevelChange, focusRequest = 0 }: FossilGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fossilMarkerRef = useRef<HTMLButtonElement>(null);
  const lifeMarkerRefs = useRef(new Map<string, HTMLButtonElement>());
  const viewerRef = useRef<Viewer | null>(null);
  const modeRef = useRef(mode);
  const recordRef = useRef(record);
  const syncSurfaceRef = useRef<((nextMode: FossilTimeMode) => void) | null>(null);
  const onZoomLevelChangeRef = useRef(onZoomLevelChange);
  const zoomLevelRef = useRef<AncientZoomLevel>(1);
  const [zoomLevel, setZoomLevel] = useState<AncientZoomLevel>(1);

  useEffect(() => {
    modeRef.current = mode;
    syncSurfaceRef.current?.(mode);
  }, [mode]);
  useEffect(() => { recordRef.current = record; }, [record]);
  useEffect(() => { onZoomLevelChangeRef.current = onZoomLevelChange; }, [onZoomLevelChange]);

  useEffect(() => {
    if (!containerRef.current) return;
    const viewer = createEarthViewer(containerRef.current);
    viewerRef.current = viewer;
    viewer.scene.globe.baseColor = Color.fromCssColorString("#08191b");
    viewer.camera.setView({ destination: Cartesian3.fromDegrees(-8, 20, 10_500_000) });
    const windowPosition = new Cartesian2();
    const occluder = new EllipsoidalOccluder(viewer.scene.globe.ellipsoid, viewer.camera.positionWC);
    let ancientLayer: ImageryLayer | null = null;
    let paleoObjectUrl: string | null = null;
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
    const syncSurface = (nextMode: FossilTimeMode) => {
      stopAnimation();
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
      const duration = 360;
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
    void loadPaleoImageryProvider().then(({ provider, objectUrl }) => {
      if (viewer.isDestroyed()) {
        URL.revokeObjectURL(objectUrl);
        return;
      }
      paleoObjectUrl = objectUrl;
      ancientLayer = viewer.imageryLayers.addImageryProvider(provider);
      showSurfaceImmediately(modeRef.current);
    }).catch((error: unknown) => {
      console.warn("Paleo Earth texture could not be loaded", error);
    });

    const setProjectedPosition = (element: HTMLElement, point: PointLike, shouldShow: boolean) => {
      const projected = projectPoint(viewer, occluder, point, windowPosition);
      element.style.left = `${projected.x}px`;
      element.style.top = `${projected.y}px`;
      element.style.visibility = projected.visible ? "visible" : "hidden";
      element.style.opacity = shouldShow && projected.visible ? "1" : "0";
      element.style.pointerEvents = shouldShow && projected.visible ? "auto" : "none";
    };
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
      setZoomLevel(nextLevel);
      onZoomLevelChangeRef.current?.(nextLevel);
    };

    const updatePositions = () => {
      const currentRecord = recordRef.current;
      const present = { latitude: currentRecord.presentLat, longitude: currentRecord.presentLng };
      if (fossilMarkerRef.current) setProjectedPosition(fossilMarkerRef.current, present, modeRef.current === "present");
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
      syncSurfaceRef.current = null;
      stopAnimation();
      if (paleoObjectUrl) URL.revokeObjectURL(paleoObjectUrl);
      viewerRef.current = null;
      viewer.destroy();
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || focusRequest === 0) return;
    const point = mode === "present"
      ? { latitude: record.presentLat, longitude: record.presentLng }
      : { latitude: record.paleoLat, longitude: record.paleoLng };
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(point.longitude, point.latitude, mode === "present" ? 4_200_000 : 6_500_000),
      duration: 1.1,
    });
  }, [focusRequest, mode, record]);

  const isAncient = mode === "ancient";

  return (
    <div className="fossil-globe-stage">
      <div ref={containerRef} className="earth-globe fossil-globe" aria-label="Interactive Earth globe" />
      <div className="fossil-globe-overlay">
        <FossilMarker ref={fossilMarkerRef} label={record.taxon} placeLabel={record.presentPlaceLabel} onClick={onSelect} />
        {ancientLifeRecords.map((life: AncientLifeRecord) => (
          <AncientLifeMarker
            key={life.id}
            ref={(element) => {
              if (element) lifeMarkerRefs.current.set(life.id, element);
              else lifeMarkerRefs.current.delete(life.id);
            }}
            record={life}
            isVisible={isAncient && zoomLevel >= life.minZoomLevel}
            showLabel={isAncient && zoomLevel === 3}
            onClick={life.featured ? onSelect : undefined}
          />
        ))}
      </div>
    </div>
  );
}

function getAncientZoomLevel(cameraHeight: number): AncientZoomLevel {
  if (cameraHeight <= 4_000_000) return 3;
  if (cameraHeight <= 8_000_000) return 2;
  return 1;
}

interface PaleoGeoJson {
  type: "FeatureCollection";
  features: Array<{
    geometry?: { type?: string; coordinates?: number[][][] };
  }>;
}

async function loadPaleoImageryProvider(): Promise<{ provider: SingleTileImageryProvider; objectUrl: string }> {
  const response = await fetch(`${import.meta.env.BASE_URL}geo/paleo-coastlines-100.json`);
  if (!response.ok) throw new Error(`Paleo texture source unavailable (${response.status})`);
  const data = await response.json() as PaleoGeoJson;
  const canvas = createPaleoTextureCanvas(data);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Could not encode paleo texture")), "image/png");
  });
  const objectUrl = URL.createObjectURL(blob);
  try {
    const provider = await SingleTileImageryProvider.fromUrl(objectUrl, { credit: new Credit("Deep Lens / EarthByte reconstructed coastlines · ~100 Ma proxy for 95 Ma") });
    return { provider, objectUrl };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

function createPaleoTextureCanvas(data: PaleoGeoJson): HTMLCanvasElement {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create paleo texture canvas");
  context.fillStyle = "#102c31";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "rgb(110 141 136 / 14%)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(0, height / 2);
  context.lineTo(width, height / 2);
  context.moveTo(width / 2, 0);
  context.lineTo(width / 2, height);
  context.stroke();
  context.fillStyle = "#9a734c";
  context.strokeStyle = "rgb(227 182 109 / 90%)";
  context.lineWidth = 2;
  for (const feature of data.features) {
    const ring = feature.geometry?.type === "Polygon" ? feature.geometry.coordinates?.[0] : undefined;
    if (!ring || ring.length < 4) continue;
    context.beginPath();
    ring.forEach((point, index) => {
      const longitude = point[0];
      const latitude = point[1];
      if (longitude === undefined || latitude === undefined || !Number.isFinite(longitude) || !Number.isFinite(latitude)) return;
      const x = ((longitude + 180) / 360) * width;
      const y = ((90 - latitude) / 180) * height;
      if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
    });
    context.closePath();
    context.fill();
    context.stroke();
  }
  context.strokeStyle = "rgb(255 214 144 / 18%)";
  context.strokeRect(2, 2, width - 4, height - 4);
  return canvas;
}

function projectPoint(viewer: Viewer, occluder: EllipsoidalOccluderLike, point: PointLike, windowPosition: Cartesian2): ProjectedPoint {
  const worldPosition = Cartesian3.fromDegrees(point.longitude, point.latitude, 18_000);
  const projected = SceneTransforms.worldToWindowCoordinates(viewer.scene, worldPosition, windowPosition);
  if (!projected) return { x: 0, y: 0, visible: false };
  occluder.cameraPosition = viewer.camera.positionWC;
  return { x: projected.x, y: projected.y, visible: occluder.isPointVisible(worldPosition) };
}
