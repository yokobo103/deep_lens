import { useEffect, useRef, type ReactNode } from "react";
import * as CesiumRuntime from "cesium";
import { Cartesian2, Cartesian3, Color, Credit, SceneTransforms, SingleTileImageryProvider, type ImageryLayer, type Viewer } from "cesium";
import { createEarthViewer } from "../globe/cesium/createViewer";

export interface GlobePoint {
  id: string;
  lat: number;
  lng: number;
  /** Which label survives a collision. Higher wins; default 0. */
  weight?: number;
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

    /**
     * Where a marker's label would land if it were drawn.
     *
     * Computed rather than measured: the label is centred under a 34px marker
     * with a 6px gap, and only its own width and height have to be read. That
     * keeps every DOM read in one pass and every write in another, so a frame
     * costs one layout instead of one per marker.
     */
    const labelBox = (x: number, y: number, width: number, height: number) => ({
      left: x - width / 2, right: x + width / 2, top: y + 23, bottom: y + 23 + height,
    });

    const overlaps = (a: ReturnType<typeof labelBox>, b: ReturnType<typeof labelBox>) =>
      a.left < b.right + 4 && a.right + 4 > b.left && a.top < b.bottom + 3 && a.bottom + 3 > b.top;

    const place = () => {
      const overlay = overlayRef.current;
      if (!overlay) return;
      occluder.cameraPosition = viewer.camera.positionWC;
      const byId = new Map(pointsRef.current.map((point) => [point.id, point]));
      const centreX = overlay.clientWidth / 2;
      const centreY = overlay.clientHeight / 2;

      // Read everything first, write everything after.
      const found: {
        element: HTMLElement; x: number; y: number; visible: boolean;
        box: ReturnType<typeof labelBox> | null; weight: number; pinned: boolean; fromCentre: number;
      }[] = [];

      for (const element of overlay.querySelectorAll<HTMLElement>("[data-globe-point]")) {
        const point = byId.get(element.dataset.globePoint ?? "");
        if (!point) continue;
        const world = Cartesian3.fromDegrees(point.lng, point.lat, 18_000);
        const projected = SceneTransforms.worldToWindowCoordinates(viewer.scene, world, windowPosition);
        // Behind the horizon is hidden rather than moved: a marker that slides
        // to the rim as the Earth turns reads as a thing on the screen, not a
        // thing on the planet.
        const visible = Boolean(projected) && occluder.isPointVisible(world);
        const label = element.querySelector<HTMLElement>(".gate-marker__label");
        const labelCanShow = !element.classList.contains("is-undiscovered")
          || element.classList.contains("is-selected")
          || element.classList.contains("is-here");
        const x = projected ? projected.x : 0;
        const y = projected ? projected.y : 0;
        found.push({
          element, x, y, visible,
          box: label && visible && labelCanShow ? labelBox(x, y, label.offsetWidth, label.offsetHeight) : null,
          weight: point.weight ?? 0,
          // A place being looked at keeps its name whatever is next to it.
          pinned: element.classList.contains("is-selected") || element.classList.contains("is-here"),
          fromCentre: Math.hypot(x - centreX, y - centreY),
        });
      }

      /**
       * Thirty gates put four names on top of each other over North America.
       * So labels are placed in order of importance and any that would land on
       * one already placed is simply not drawn — its marker stays, and pressing
       * it still says what it is. Turning the Earth or moving closer spreads
       * them out and the names come back on their own.
       *
       * Order is what keeps this from flickering: a place being looked at, then
       * places holding more ages, then whatever is nearest the middle of the
       * screen. Only the last of those changes as the globe turns, and it
       * changes smoothly.
       */
      const order = [...found].sort((a, b) =>
        Number(b.pinned) - Number(a.pinned) || b.weight - a.weight || a.fromCentre - b.fromCentre);

      const taken: ReturnType<typeof labelBox>[] = [];
      const crowded = new Set<HTMLElement>();
      for (const entry of order) {
        if (!entry.box) continue;
        if (taken.some((box) => overlaps(entry.box!, box))) crowded.add(entry.element);
        else taken.push(entry.box);
      }

      for (const entry of found) {
        entry.element.style.visibility = entry.visible ? "visible" : "hidden";
        if (entry.visible) {
          entry.element.style.left = `${entry.x}px`;
          entry.element.style.top = `${entry.y}px`;
        }
        entry.element.classList.toggle("is-crowded", crowded.has(entry.element));
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
  //
  // Watched by url rather than by the object holding it. A caller building
  // `{ url, credit }` while rendering hands over a new object every time, and
  // an effect keyed on the object would tear the layer down and fetch the same
  // file again on every move — which showed as the present Earth flashing
  // through whenever a gate was tapped from inside a world of its own age.
  //
  // One Earth is laid over the other before the old one is taken away. Moving
  // between two ages at the same place is the thing this app is for, and
  // dropping the layer first put the present-day Earth on screen for as long
  // as the next texture took to arrive — half a megabyte of modern coastlines
  // in the middle of a 380-million-year step.
  const terrainUrl = terrain?.url ?? null;
  const terrainCredit = terrain?.credit ?? "";
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    let cancelled = false;

    const dropExisting = () => {
      const existing = terrainLayerRef.current;
      if (!existing) return;
      viewer.imageryLayers.remove(existing, true);
      terrainLayerRef.current = null;
    };

    if (!terrainUrl) {
      dropExisting();
      return;
    }

    void SingleTileImageryProvider.fromUrl(terrainUrl, { credit: new Credit(terrainCredit) })
      .then((provider) => {
        if (cancelled || viewer.isDestroyed()) return;
        const arriving = viewer.imageryLayers.addImageryProvider(provider);
        dropExisting();
        terrainLayerRef.current = arriving;
      })
      .catch((error: unknown) => {
        console.warn("Reconstructed Earth could not be loaded", error);
        if (!cancelled && !viewer.isDestroyed()) dropExisting();
      });
    return () => { cancelled = true; };
  }, [terrainUrl, terrainCredit]);

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
