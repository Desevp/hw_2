'use strict';
window.onload = function () {
  console.log('camera');

  let monitorEl = document.querySelector('.js-monitor');
  if (monitorEl) {
    initMonitor(monitorEl);
  }
};

function initMonitor(el) {
  let screen = el;
  let screenInner = el.querySelector('.monitor__screen-inner');
  let scaleTextCont = document.querySelector('.monitor__scale');

  const nodeState = {
      startPosition: 0,
      dist: 0,
      scaleFactor: 1.0,
      currScale: 1.0,
      maxZoom: 4.0,
      minZoom: 1
  };

  scaleTextCont.textContent = nodeState.scaleFactor;

  let indicatorWidth = document.createElement('div');
  indicatorWidth.className = 'monitor__screen-indicator';
  screen.appendChild(indicatorWidth);
  let coefWidth = 1;

  changeWidthIndicator();

  function changeWidthIndicator() {
    var widthScreen = screen.offsetWidth;
    var widthPicture = screenInner.scrollWidth;
    coefWidth = widthScreen/(widthPicture * nodeState.currScale);
    var widthIndicator = widthScreen * coefWidth;
    indicatorWidth.style.width = `${widthIndicator}px`;
  }

  changePositionIndicator(0);

  function changePositionIndicator(value) {
    indicatorWidth.style.transform = `translateX(${-value * coefWidth * nodeState.currScale}px)`;
  }

  let gestureArray = [];

  screenInner.addEventListener('pointerdown', (event) => {
      screen.style.transition = 'none';
      screen.setPointerCapture(event.pointerId);
      gestureArray = [ ...gestureArray, {
        id: event.pointerId,
        startX: event.x,
        prevX: event.x,
        startY: event.y,
        prevY: event.y,
        prevTs: Date.now(),
        startPosition: nodeState.startPosition
      }];

      if (gestureArray.length === 2) {
        nodeState.dist = distance(gestureArray[0], gestureArray[1]);
        console.log('два пальца');
      }
  });

  function distance(p1, p2) {
    return (Math.sqrt(Math.pow((p1.prevX - p2.prevY), 2) + Math.pow((p1.prevY - p2.prevY), 2)));
  }

  screen.addEventListener('pointermove', (event) => {
      if (gestureArray.lenght) {
          return
      }

      if (gestureArray.length === 1) {
        const {startX} = gestureArray[0];
        const {x} = event;


        const dx = x - startX;
        let dif = dx + nodeState.startPosition;


        if (dif + screenInner.scrollWidth - screen.offsetWidth < 0) {
          screenInner.style.transform = `translateX(${screen.offsetWidth - screenInner.scrollWidth}) scale( ${nodeState.currScale}, ${nodeState.currScale})`

          changePositionIndicator(screen.offsetWidth - screenInner.scrollWidth);
          return;
        }

        if (dif > 0) {
          screenInner.style.transform = 'translateX(0) scale( ${nodeState.currScale}, ${nodeState.currScale})';
          changePositionIndicator(0);
          return;
        }
        changePositionIndicator(dif);
        screenInner.style.transform = `translateX(${dif}px) scale( ${nodeState.currScale}, ${nodeState.currScale})`;
        gestureArray[0].prevX = x;
      }
      else {
        if (gestureArray.length === 2) {
          gestureArray.forEach(function(currentGesture){
            if (event.pointerId === currentGesture.id) {
              const {x, y} = event;
              currentGesture.prevX = x;
              currentGesture.prevY = y;
            }
          });

          let currScale = distance(gestureArray[0], gestureArray[1]) / nodeState.dist * nodeState.scaleFactor;

          nodeState.currScale = (currScale < nodeState.minZoom)?nodeState.minZoom:(currScale > nodeState.maxZoom)?nodeState.maxZoom:currScale;
          changeWidthIndicator();
          changePositionIndicator(nodeState.startPosition - indicatorWidth.offsetWidth);
          nodeState.currFact = currScale;
          screenInner.style.WebkitTransform = `translateX(${nodeState.startPosition}) scale( ${nodeState.currScale}, ${nodeState.currScale})`;
          scaleTextCont.textContent = Math.round(nodeState.currScale);
        }
      }
  });

  const cancelEvent = () => {
      if (gestureArray.lenght) {
          return;
      }

      if (gestureArray.length === 1) {
        nodeState.startPosition = nodeState.startPosition - gestureArray[0].startX +
        gestureArray[0].prevX;
      }

      if (gestureArray.length === 2) {

        if (nodeState.currScale > nodeState.maxZoom) {
          nodeState.scaleFactor = maxZoom;
        }
        else if (nodeState.currScale < nodeState.minZoom) {
          nodeState.scaleFactor = minZoom;
        }
        else {
          nodeState.scaleFactor = nodeState.currScale;
        }
      }

      gestureArray.length = 0;
  }

  screen.addEventListener('pointerup', cancelEvent);
  screen.addEventListener('pointercancel', cancelEvent);
}
