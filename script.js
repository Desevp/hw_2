'use strict';
document.addEventListener('DOMContentLoaded', function () {
  console.log('camera');

  let monitorEl = document.querySelector('.js-monitor');
  if (monitorEl) {
    initMonitor(monitorEl);
  }
});

function initMonitor(el) {
  let screen = el;
  let screenInner = el.querySelector('.monitor__screen-inner');

  const nodeState = {
      startPosition: 0
  };

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
  });

  screen.addEventListener('pointermove', (event) => {
      if (gestureArray.lenght) {
          return
      }

      if (gestureArray.length === 1) {
        const {startX} = gestureArray[0];
        const {x} = event;

        const dx = x - startX;
        let dif = dx + nodeState.startPosition;
        if ((dif > 0) || ((dif + screenInner.scrollWidth - screen.offsetWidth) < 0)) {
          return;
        }

        screenInner.style.left = dif +'px';
        gestureArray[0].prevX = x;
      }

      if (gestureArray.length === 2) {
        console.log(gestureArray);

        gestureArray.forEach(function(currentGesture){
          const {x, y} = event;
          currentGesture.prevX = x;
          currentGesture.prevY = y;
        });

        console.log(distance(gestureArray[0], gestureArray[1]));

      }

      function distance(p1, p2) {
        return (Math.sqrt(Math.pow((p1.prevX - p2.prevY), 2) + Math.pow((p1.prevY - p2.prevY), 2)));
      }
  });

  const cancelEvent = () => {
      if (gestureArray.lenght) {
          return
      }

      // console.log(gestureArray.length);

      if (gestureArray.length === 1) {
        nodeState.startPosition = nodeState.startPosition - gestureArray[0].startX +
        gestureArray[0].prevX;
      }

      // currentGesture = null;
      gestureArray.length = 0;
  }

  screen.addEventListener('pointerup', cancelEvent);
  screen.addEventListener('pointercancel', cancelEvent);
}
