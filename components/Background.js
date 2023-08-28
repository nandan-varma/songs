'use client'
import { Center } from '@chakra-ui/react';
import React, { useRef, useEffect, memo } from 'react';


const Circle = memo(({ radius, colors }) => {

  // no animations in safari bcuz i dont know how to use filters in webkit :)
  const isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));
  if (isSafari) {
    return <></>
  }

  const canvasRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth / 1.01;
    canvas.height = window.innerHeight / 1.01;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    let angle = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      angle += 0.01;

      colors.forEach((color, i) => {
        ctx.beginPath();
        ctx.fillStyle = color;
        const x = cx + radius * Math.cos(angle + i * 2 * Math.PI / colors.length);
        const y = cy + radius * Math.sin(angle + i * 2 * Math.PI / colors.length);
        const ballRadius = 120 + 25 * Math.sin(angle + i * 2 * Math.PI / colors.length);
        ctx.arc(x, y, ballRadius, 0, 2 * Math.PI);
        ctx.fill();
      });
      ctx.filter = "blur(16px)";

      requestAnimationFrame(draw);
    };

    draw();
  }, [radius, colors]);

  return (
    <canvas ref={canvasRef} />
  );
});

const Background = () => {
  return (
    <Center position={'fixed'} zIndex={'-100'} w={'100vw'} h={'50vh'} justifyContent={'space-between'} textAlign={'center'}>
      <Circle className='background' radius={typeof window !== 'undefined' ? Math.max(window.innerWidth, window.innerHeight) / 16 : 0} colors={['#96B6C5', '#ADC4CE', '#E3F4F4']} />
    </Center>
  );
};

export default Background;
