'use strict';
window.onload = function () {
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
  let coefWidth = 1;

  const nodeState = {
      startPosition: 0,
      currScale: 1.0,
      scaleFactor: 1.0,
      maxZoom: 4.0,
      minZoom: 1,
      curentBright: 0.5
  };

  scaleTextCont.textContent = nodeState.currScale;
  brightnessTextCont.textContent = nodeState.curentBright * 100;

  let indicatorWidthElement = createWidthIndicator();
  changeWidthIndicator();
  changePositionIndicator(0);


  let gestureArray = [];
  let angleStart = 0;
  let distanceStart = 0;
  let prev = {};

  screenInner.addEventListener('pointerdown', (event) => {
      screen.style.transition = 'none';
      screen.setPointerCapture(event.pointerId);

      gestureArray = [ ...gestureArray, {
        id: event.pointerId,
        startX: event.x,
        prevX: event.x,
        startY: event.y,
        prevY: event.y
      }];

      if (gestureArray.length === 2) {
        let t1 = {
          x: gestureArray[0].startX,
          y: gestureArray[0].startY
        }

        let t2 = {
          x: gestureArray[1].startX,
          y: gestureArray[1].startY
        }

        // Расстояние и угол при первом касании

        distanceStart = distance(gestureArray[0], gestureArray[1]);
        angleStart = angle(t1, t2);

        // Информация о предыдущем событии перемещения

        prev = {
          distance: distanceStart,
          angle: angleStart,
          isGest: false, // удалось ли определить жест (false или String)
          delay: 10 // пропускаем первые события
        }
      }
  });

  screen.addEventListener('pointermove', (event) => {
      if (gestureArray.lenght) {
          return
      }

      if (gestureArray.length === 1) {
        // Жест влево-вправо
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
          // Обновляем информацию о прикосновении
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

          // Поворот или пинч

          let tempAngle = Math.abs(angle(newCoord, newCoord2) - angleStart);
          let tempDistance = Math.abs(distance(gestureArray[0], gestureArray[1]) - distanceStart);

          if (!prev.isGest && !prev.delay) {
            if (((Math.abs(tempAngle) > 0.2) && (Math.abs(tempDistance) < 20) || (Math.abs(tempAngle) > 0.35))) {
              prev.isGest = 'rotate';
              return
            }

            if (((tempAngle < 0.1) && (Math.abs(tempDistance) > 15) || (Math.abs(tempDistance) > 60))) {
              prev.isGest = 'pinch';
              return
            }
          }

          // pinch
          if (prev.isGest === 'pinch') {
            let temp = nodeState.currScale = distance(gestureArray[0], gestureArray[1]) / distanceStart * nodeState.scaleFactor;

            if (gestureArray.length === 2) {
              if (temp > nodeState.maxZoom) {
                temp = nodeState.maxZoom;
              }
              else if (temp < nodeState.minZoom) {
                temp = nodeState.minZoom;
              }
            }

            screenInner.style.WebkitTransform = `scale( ${temp}, ${temp})`;
            nodeState.currScale = temp;
            scaleTextCont.textContent = Math.round(temp * 100) / 100;
            return;
          }

          //Rotate
          if (prev.isGest === 'rotate') {
            let curAngle = angle(newCoord, newCoord2) - angleStart;

            let brightless = (curAngle > 0)?((nodeState.curentBright >= 1)?1:(nodeState.curentBright * 100 + 2)/100):(nodeState.curentBright <= 0)?0:((nodeState.curentBright * 100 - 2)/100);

            nodeState.curentBright = brightless;
            screenInner.style.webkitFilter = `brightness(${brightless})`;
            brightnessTextCont.textContent = Math.round(nodeState.curentBright * 100);
            return;
          }
          prev.distance = tempDistance;
          prev.angle = tempAngle;
          prev.delay = (prev.delay > 0)?(prev.delay - 1) : 0;
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

      nodeState.scaleFactor = nodeState.currScale;
      gestureArray.length = 0;
  }

  screen.addEventListener('pointerup', cancelEvent);
  screen.addEventListener('pointercancel', cancelEvent);

  // Создание индикатора ширины
  function createWidthIndicator() {
    let indicatorWidthElement = document.createElement('div');
    indicatorWidthElement.className = 'monitor__screen-indicator';
    screen.appendChild(indicatorWidthElement);
    return indicatorWidthElement;
  }

  // Изменение ширины индикатора
  function changeWidthIndicator() {
    var widthScreen = screen.offsetWidth;
    var widthPicture = screenInner.scrollWidth;
    coefWidth = widthScreen/(widthPicture * nodeState.currScale);
    var widthIndicator = widthScreen * coefWidth;
    indicatorWidthElement.style.width = `${widthIndicator}px`;
  }

  // Изменение позиции индикатора
  function changePositionIndicator(value) {
    indicatorWidthElement.style.transform = `translateX(${-value * coefWidth * nodeState.currScale}px)`;
  }

  // Расстояние между двумя точками
  function distance(p1, p2) {
    return (Math.sqrt(Math.pow((p1.prevX - p2.prevY), 2) + Math.pow((p1.prevY - p2.prevY), 2)));
  }

  // Угол между двумя векторами
  function angle(p1, p2) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  }
}
