import { Renderer } from '@darkforest_eth/renderer';
import { CursorState, ModalManagerEvent, Setting } from '@darkforest_eth/types';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useUIManager } from '../Utils/AppHooks';
import UIEmitter, { UIEmitterEvent } from '../Utils/UIEmitter';
import Viewport from './Viewport';

const CanvasWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  touch-action: none;

  canvas {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;

    &#buffer {
      width: auto;
      height: auto;
      display: none;
    }
  }
  // TODO put this into a global style
  canvas,
  img {
    image-rendering: -moz-crisp-edges;
    image-rendering: -webkit-crisp-edges;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
  }
`;

export default function ControllableCanvas() {
  // html canvas element width and height. viewport dimensions are tracked by viewport obj
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<HTMLCanvasElement | null>(null);
  const bufferRef = useRef<HTMLCanvasElement | null>(null);
  const lastTouchDistanceRef = useRef<number | null>(null);
  const lastTouchCenterRef = useRef<{ x: number; y: number } | null>(null);

  const evtRef = canvasRef;

  const gameUIManager = useUIManager();

  const modalManager = gameUIManager.getModalManager();
  const [targeting, setTargeting] = useState<boolean>(false);

  useEffect(() => {
    const updateTargeting = (newstate: CursorState) => {
      setTargeting(newstate === CursorState.TargetingExplorer);
    };
    modalManager.on(ModalManagerEvent.StateChanged, updateTargeting);
    return () => {
      modalManager.removeListener(ModalManagerEvent.StateChanged, updateTargeting);
    };
  }, [modalManager]);

  const doResize = useCallback(() => {
    const uiEmitter: UIEmitter = UIEmitter.getInstance();
    if (canvasRef.current) {
      setWidth(canvasRef.current.clientWidth);
      setHeight(canvasRef.current.clientHeight);
      uiEmitter.emit(UIEmitterEvent.WindowResize);
    }
  }, [canvasRef]);

  // TODO fix this
  useLayoutEffect(() => {
    if (canvasRef.current) doResize();
  }, [
    // dep array gives eslint issues, but it's fine i tested it i swear - Alan
    canvasRef,
    doResize,
    /* eslint-disable react-hooks/exhaustive-deps */
    canvasRef.current?.offsetWidth,
    canvasRef.current?.offsetHeight,
    /* eslint-enable react-hooks/exhaustive-deps */
  ]);

  useEffect(() => {
    if (!gameUIManager) return;

    const uiEmitter: UIEmitter = UIEmitter.getInstance();

    // Disable iOS bounce effect
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    function onResize() {
      doResize();
      uiEmitter.emit(UIEmitterEvent.WindowResize);
    }

    const onWheel = (e: WheelEvent): void => {
      e.preventDefault();
      const { deltaY } = e;
      uiEmitter.emit(UIEmitterEvent.CanvasScroll, deltaY);
    };

    // Calculate distance between two touch points
    const getTouchDistance = (touches: TouchList): number => {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    // Calculate center point between two touches
    const getTouchCenter = (touches: TouchList): { x: number; y: number } => {
      if (touches.length < 2) {
        return { x: touches[0]?.clientX || 0, y: touches[0]?.clientY || 0 };
      }
      const x = (touches[0].clientX + touches[1].clientX) / 2;
      const y = (touches[0].clientY + touches[1].clientY) / 2;
      return { x, y };
    };

    // Handle pinch gesture for zooming
    const onTouchStart = (e: TouchEvent): void => {
      e.preventDefault(); // Prevent any default touch behavior
      if (e.touches.length === 2) {
        lastTouchDistanceRef.current = getTouchDistance(e.touches);
        lastTouchCenterRef.current = getTouchCenter(e.touches);
      }
    };

    const onTouchMove = (e: TouchEvent): void => {
      e.preventDefault(); // Prevent default scrolling behavior
      if (e.touches.length === 2) {
        // Handle pinch zoom
        if (lastTouchDistanceRef.current !== null) {
          const currentDistance = getTouchDistance(e.touches);
          const deltaDistance = currentDistance - lastTouchDistanceRef.current;
          
          // Convert pinch delta to something similar to mousewheel delta
          // Negative value = zoom in (pinch out), positive value = zoom out (pinch in)
          // Increased scale factor for more powerful zoom
          const scaleFactor = 20; // 10x more powerful
          const deltaY = -deltaDistance * scaleFactor;
          
          uiEmitter.emit(UIEmitterEvent.CanvasScroll, deltaY);
          lastTouchDistanceRef.current = currentDistance;
        }

        // Handle two-finger drag (pan)
        if (lastTouchCenterRef.current !== null) {
          const currentCenter = getTouchCenter(e.touches);
          const deltaX = currentCenter.x - lastTouchCenterRef.current.x;
          const deltaY = currentCenter.y - lastTouchCenterRef.current.y;
          
          if (deltaX !== 0 || deltaY !== 0) {
            // Emit the same event that mouse dragging uses for consistent behavior
            uiEmitter.emit(UIEmitterEvent.CanvasMouseDown, { x: lastTouchCenterRef.current.x, y: lastTouchCenterRef.current.y });
            uiEmitter.emit(UIEmitterEvent.CanvasMouseMove, { x: currentCenter.x, y: currentCenter.y });
            uiEmitter.emit(UIEmitterEvent.CanvasMouseUp, { x: currentCenter.x, y: currentCenter.y });
          }
          
          lastTouchCenterRef.current = currentCenter;
        }
      }
    };

    const onTouchEnd = (e: TouchEvent): void => {
      e.preventDefault(); // Prevent default behavior
      lastTouchDistanceRef.current = null;
      lastTouchCenterRef.current = null;
    };

    const canvas = evtRef.current;
    if (!canvas || !canvasRef.current || !glRef.current || !bufferRef.current) return;

    // This zooms your home world in really close to show the awesome details
    // TODO: Store this as it changes and re-initialize to that if stored
    const homePlanet = gameUIManager.getHomePlanet();
    let defaultWorldUnits = Math.min(gameUIManager.getWorldRadius(), 1000);
    if (homePlanet) {
      const radius = gameUIManager.getRadiusOfPlanetLevel(homePlanet.planetLevel);
      defaultWorldUnits = radius * 10;
    }
    Viewport.initialize(gameUIManager, defaultWorldUnits, canvas);
    Renderer.initialize(
      canvasRef.current,
      glRef.current,
      bufferRef.current,
      Viewport.getInstance(),
      gameUIManager,
      {
        spaceColors: {
          innerNebulaColor: gameUIManager.getStringSetting(Setting.RendererColorInnerNebula),
          nebulaColor: gameUIManager.getStringSetting(Setting.RendererColorNebula),
          spaceColor: gameUIManager.getStringSetting(Setting.RendererColorSpace),
          deepSpaceColor: gameUIManager.getStringSetting(Setting.RendererColorDeepSpace),
          deadSpaceColor: gameUIManager.getStringSetting(Setting.RendererColorDeadSpace),
        },
      }
    );
    // We can't attach the wheel event onto the canvas due to:
    // https://www.chromestatus.com/features/6662647093133312
    canvas.addEventListener('wheel', onWheel);
    window.addEventListener('resize', onResize);
    
    // Add touch event listeners for pinch-to-zoom
    canvas.addEventListener('touchstart', onTouchStart);
    canvas.addEventListener('touchmove', onTouchMove);
    canvas.addEventListener('touchend', onTouchEnd);
    canvas.addEventListener('touchcancel', onTouchEnd);

    uiEmitter.on(UIEmitterEvent.UIChange, doResize);

    return () => {
      Viewport.destroyInstance();
      Renderer.destroy();
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      
      // Remove touch event listeners
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
      
      uiEmitter.removeListener(UIEmitterEvent.UIChange, doResize);
    };
  }, [gameUIManager, doResize, canvasRef, glRef, bufferRef, evtRef]);

  // attach event listeners
  useEffect(() => {
    if (!evtRef.current) return;
    const canvas = evtRef.current;

    const uiEmitter: UIEmitter = UIEmitter.getInstance();

    function onMouseEvent(emitEventName: UIEmitterEvent, mouseEvent: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      const canvasX = mouseEvent.clientX - rect.left;
      const canvasY = mouseEvent.clientY - rect.top;
      uiEmitter.emit(emitEventName, { x: canvasX, y: canvasY });
    }

    const onMouseDown = (e: MouseEvent) => {
      onMouseEvent(UIEmitterEvent.CanvasMouseDown, e);
    };
    // this is the root of the mousemove event
    const onMouseMove = (e: MouseEvent) => {
      onMouseEvent(UIEmitterEvent.CanvasMouseMove, e);
    };
    const onMouseUp = (e: MouseEvent) => {
      onMouseEvent(UIEmitterEvent.CanvasMouseUp, e);
    };
    // TODO convert this to mouseleave
    const onMouseOut = () => {
      uiEmitter.emit(UIEmitterEvent.CanvasMouseOut);
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseout', onMouseOut);
    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseout', onMouseOut);
    };
  }, [evtRef]);

  return (
    <CanvasWrapper style={{ cursor: targeting ? 'crosshair' : undefined }}>
      <canvas ref={glRef} width={width} height={height} />
      <canvas ref={canvasRef} width={width} height={height} />
      <canvas ref={bufferRef} id='buffer' />
    </CanvasWrapper>
  );
}
