import { useEffect, useRef, type ReactNode } from "react";
import * as CesiumRuntime from "cesium";
import { Cartesian2, Cartesian3, Color, Credit, SceneTransforms, SingleTileImageryProvider, type ImageryLayer, type Viewer } from "cesium";
import { createEarthViewer } from "../globe/cesium/createViewer";

export interface GlobePoint {
  id: string;
  lat: number;
  lng: number;
}

interface GateGlobeProps {
  /** What to place on the Earth. Positions are followed every frame. */
  points: readonly GlobePoint[];
  /**
   * Rendered once per point. Whatever it returns must carry
   * `data-globe-point={point.id}` so the globe can find it and keep it over
   * its coordinate.
   */
  renderPoint: (point: GlobePoint) => ReactNode;
  ariaLabel: string;
  /**
   * A reconstructed Earth to lay over the present one, or nothing for today.
   * One texture per band, so entering any world of an age loads the same file.
   */
  terrain?: { url: string; credit: string } | null;
  /** Where to look. Changing this flies the camera. */
  focus?: { lat: number; lng: number; height: number } | null;
}

interface OccluderLike {
  cameraPosition: Cartesian3;
  isPointVisible(point: Cartesian3): boolean;
}

const EllipsoidalOccluder = (CesiumRuntime as unknown as {
  EllipsoidalOccluder: new (ellipsoid: Viewer["scene"]["globe"]["ellipsoid"], cameraPosition?: Cartesian3) => OccluderLike;
}).EllipsoidalOccluder;

/**
 * The Earth, and things standing on it.
 *
 * Deliberately thin. The globe's job in Deep Lens is to be turned until
 * something is found on it, so this knows how to hold a viewer and keep HTML
 * markers over their coordinates, and nothing else. What the markers mean is
 * the caller's business.
 *
 * Markers are found in the DOM by `data-globe-point` rather than through a map
 * of refs. Collecting refs meant handing a setter to the caller and touching
 * that map while rendering; a query inside the effect keeps all of it on one
 * side of the render, and the caller only has to label its own markup.
 */
export function GateGlobe({ points, renderPoint, ariaLabel, terrain = null, focus = null }: GateGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const terrainLayerRef = useRef<ImageryLayer | null>(null);
  const pointsRef = useRef(points);
  useEffect(() => { pointsRef.current = points; }, [points]);

  useEffect(() => {
    if (!containerRef.current) return;
    const viewer = createEarthViewer(containerRef.current);
    viewerRef.current = viewer;
    viewer.scene.globe.baseColor = Color.fromCssColorString("#08191b");
    viewer.camera.setView({ destination: Cartesian3.fromDegrees(10, 22, 14_500_000) });
    const windowPosition = new Cartesian2();
    const occluder = new EllipsoidalOccluder(viewer.scene.globe.ellipsoid, viewer.camera.positionWC);

    const place = () => {
      const overlay = overlayRef.current;
      if (!overlay) return;
      occluder.cameraPosition = viewer.camera.positionWC;
      const byId = new Map(pointsRef.current.map((point) => [point.id, point]));
      for (const element of overlay.querySelectorAll<HTMLElement>("[data-globe-point]")) {
        const point = byId.get(element.dataset.globePoint ?? "");
        if (!point) continue;
        const world = Cartesian3.fromDegrees(point.lng, point.lat, 18_000);
        const projected = SceneTransforms.worldToWindowCoordinates(viewer.scene, world, windowPosition);
        // Behind the horizon is hidden rather than moved: a marker that slides
        // to the rim as the Earth turns reads as a thing on the screen, not a
        // thing on the planet.
        element.style.visibility = projected && occluder.isPointVisible(world) ? "visible" : "hidden";
        if (projected) {
          element.style.left = `${projected.x}px`;
          element.style.top = `${projected.y}px`;
        }
      }
    };

    viewer.scene.postRender.addEventListener(place);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("resize", place);
      viewer.scene.postRender.removeEventListener(place);
      terrainLayerRef.current = null;
      viewerRef.current = null;
      viewer.destroy();
    };
  }, []);

  // The reconstructed Earth is a layer over the present one rather than a
  // replacement for it, so the present is always underneath and coming back
  // costs nothing.
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    let cancelled = false;
    const existing = terrainLayerRef.current;
    if (existing) {
      viewer.imageryLayers.remove(existing, true);
      terrainLayerRef.current = null;
    }
    if (!terrain) return;
    void SingleTileImageryProvider.fromUrl(terrain.url, { credit: new Credit(terrain.credit) })
      .then((provider) => {
        if (cancelled || viewer.isDestroyed()) return;
        terrainLayerRef.current = viewer.imageryLayers.addImageryProvider(provider);
      })
      .catch((error: unknown) => console.warn("Reconstructed Earth could not be loaded", error));
    return () => { cancelled = true; };
  }, [terrain]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !focus) return;
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(focus.lng, focus.lat, focus.height),
      duration: 1.4,
    });
  }, [focus]);

  return (
    <div className="gate-globe-stage">
      <div ref={containerRef} className="earth-globe" aria-label={ariaLabel} />
      <div ref={overlayRef} className="gate-globe-overlay">
        {points.map(renderPoint)}
      </div>
    </div>
  );
}
