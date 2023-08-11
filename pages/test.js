import { Box, Flex } from '@chakra-ui/react';
import React, { useRef, useEffect } from 'react';

const Circle = ({ radius, colors }) => {
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
      angle += 0.03;

      colors.forEach((color, i) => {
        ctx.beginPath();
        ctx.fillStyle = color;
        const x = cx + radius * Math.cos(angle + i * 2 * Math.PI / colors.length);
        const y = cy + radius * Math.sin(angle + i * 2 * Math.PI / colors.length);
        const ballRadius = 50 + 25 * Math.sin(angle + i * 2 * Math.PI / colors.length);
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
};

const App = () => {
  return (
    <Flex position={'absolute'} zIndex={'-100'} w={'100vw'} justifyContent={'space-between'} textAlign={'center'}>
        <Circle className='background' radius={typeof window !== 'undefined' ? Math.max(window.innerWidth, window.innerHeight) / 25 : 0} colors={['#525FE1', '#F86F03', '#FFA41B']} />
    </Flex>
  );
};

export default App;
