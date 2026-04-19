import { useEffect, useRef } from "react";

export default function SpriteCanvas({ sprites, width, height, bg = "transparent", hoverIndex, onHover }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width || 1;
    canvas.height = height || 1;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (bg !== "transparent") {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    sprites.forEach((sprite, index) => {
      if (sprite.image) ctx.drawImage(sprite.image, sprite.x, sprite.y, sprite.width, sprite.height);
      ctx.strokeStyle = "rgba(59,130,246,0.35)";
      ctx.strokeRect(sprite.x + 0.5, sprite.y + 0.5, sprite.width - 1, sprite.height - 1);
      if (hoverIndex === index) {
        ctx.fillStyle = "rgba(59,130,246,0.2)";
        ctx.fillRect(sprite.x, sprite.y, sprite.width, sprite.height);
      }
    });
  }, [sprites, width, height, bg, hoverIndex]);

  return (
    <canvas
      ref={canvasRef}
      className="h-auto w-full rounded-lg border border-outline-variant/30"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * (width || 1);
        const y = ((e.clientY - rect.top) / rect.height) * (height || 1);
        const found = sprites.findIndex((sprite) => x >= sprite.x && x <= sprite.x + sprite.width && y >= sprite.y && y <= sprite.y + sprite.height);
        onHover(found);
      }}
      onMouseLeave={() => onHover(-1)}
    />
  );
}
