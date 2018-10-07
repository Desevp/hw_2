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
  let brightnessTextCont = document.querySelector('.monitor__brightness');

  const nodeState = {
      startPosition: 0,
      dist: 0,
      isScale: false,
      scaleFactor: 1.0,
      currScale: 1.0,
      maxZoom: 4.0,
      minZoom: 1,
      isRotate: false,
      curentBright: 0.5
  };

  scaleTextCont.textContent = nodeState.scaleFactor;
  brightnessTextCont.textContent = nodeState.curentBright * 100;

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
  let angleStart = 0;
  let distanceStart = 0;

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

        let t1 = {
          x: gestureArray[0].startX,
          y: gestureArray[0].startY
        }

        let t2 = {
          x: gestureArray[1].startX,
          y: gestureArray[1].startY
        }

        angleStart = angle(t1, t2);
        distanceStart = distance(gestureArray[0], gestureArray[1]);
      }
  });

  function distance(p1, p2) {
    return (Math.sqrt(Math.pow((p1.prevX - p2.prevY), 2) + Math.pow((p1.prevY - p2.prevY), 2)));
  }

  function angle(p1, p2) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
    // return Math.atan2(p2.y - p1.y, p2.x - p1.x)*180/Math.PI;

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

          let newCoord = {
            x: gestureArray[0].prevX,
            y: gestureArray[0].prevY
          }

          let newCoord2 = {
            x: gestureArray[1].prevX,
            y: gestureArray[1].prevY
          }


          let tempAngle = Math.abs(angle(newCoord, newCoord2) - angleStart);
          let tempDistance = Math.abs(distance(gestureArray[0], gestureArray[1]) - distanceStart);


          if (!nodeState.isScale && ((tempAngle > 0.1) && (tempDistance < 10))) {
            console.log('rotate');
            let curAngle = angle(newCoord, newCoord2) - angleStart;
            nodeState.curentBright = (curAngle > 0)?((nodeState.curentBright >= 1)?1:(nodeState.curentBright * 100 + 2)/100):(nodeState.curentBright <= 0)?0:((nodeState.curentBright * 100 - 2)/100);

            let brightless = nodeState.curentBright;

            screenInner.style.webkitFilter = `brightness(${brightless})`;
            brightnessTextCont.textContent = nodeState.curentBright * 100;
          }

          if (!nodeState.isRotate && ((tempAngle <= 0.1) && (tempDistance > 20))) {
            console.log('pranch');
            let currScale = distance(gestureArray[0], gestureArray[1]) / nodeState.dist * nodeState.scaleFactor;
            nodeState.currScale = (currScale < nodeState.minZoom)?nodeState.minZoom:(currScale > nodeState.maxZoom)?nodeState.maxZoom:currScale;
            changeWidthIndicator();
            changePositionIndicator(nodeState.startPosition - indicatorWidth.offsetWidth);
            nodeState.currFact = currScale;
            screenInner.style.WebkitTransform = `translateX(${nodeState.startPosition}) scale( ${nodeState.currScale}, ${nodeState.currScale})`;
            scaleTextCont.textContent = Math.round(nodeState.currScale);
            nodeState.isScale = true;
          }
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
        nodeState.isScale = false;
        nodeState.isRotate = false;

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
