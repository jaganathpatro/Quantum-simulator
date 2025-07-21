import React, { useRef, useEffect } from 'react';

interface BlochSphereProps {
  state: [Complex, Complex];
  isDark: boolean;
  className?: string;
}

class Complex {
  constructor(public re: number, public im: number = 0) {}
  
  magnitude(): number {
    return Math.sqrt(this.re * this.re + this.im * this.im);
  }
  
  phase(): number {
    return Math.atan2(this.im, this.re);
  }
}

const BlochSphere: React.FC<BlochSphereProps> = ({ state, isDark, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set colors based on theme
    const sphereColor = isDark ? '#374151' : '#e5e7eb';
    const axisColor = isDark ? '#9ca3af' : '#6b7280';
    const stateColor = '#3b82f6';
    const textColor = isDark ? '#f3f4f6' : '#1f2937';

    // Draw sphere outline
    ctx.strokeStyle = sphereColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw axes
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1;
    
    // X axis
    ctx.beginPath();
    ctx.moveTo(centerX - radius, centerY);
    ctx.lineTo(centerX + radius, centerY);
    ctx.stroke();
    
    // Y axis (ellipse for 3D effect)
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radius, radius * 0.3, 0, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Z axis
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius);
    ctx.lineTo(centerX, centerY + radius);
    ctx.stroke();

    // Calculate Bloch vector coordinates
    const alpha = state[0];
    const beta = state[1];
    
    // Convert quantum state to Bloch sphere coordinates
    const theta = 2 * Math.acos(Math.min(1, alpha.magnitude()));
    const phi = beta.magnitude() > 1e-10 ? beta.phase() - alpha.phase() : 0;
    
    const x = Math.sin(theta) * Math.cos(phi);
    const y = Math.sin(theta) * Math.sin(phi);
    const z = Math.cos(theta);

    // Convert to canvas coordinates
    const canvasX = centerX + x * radius;
    const canvasY = centerY - z * radius; // Flip Z for screen coordinates
    const canvasYProjected = centerY + y * radius * 0.3; // Y projection

    // Draw state vector
    ctx.strokeStyle = stateColor;
    ctx.fillStyle = stateColor;
    ctx.lineWidth = 3;
    
    // Vector line
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(canvasX, canvasY);
    ctx.stroke();
    
    // Vector endpoint
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 6, 0, 2 * Math.PI);
    ctx.fill();

    // Draw labels
    ctx.fillStyle = textColor;
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    
    ctx.fillText('|0⟩', centerX, centerY - radius - 10);
    ctx.fillText('|1⟩', centerX, centerY + radius + 20);
    ctx.fillText('|+⟩', centerX + radius + 15, centerY + 5);
    ctx.fillText('|-⟩', centerX - radius - 15, centerY + 5);

    // Display coordinates
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`θ: ${(theta * 180 / Math.PI).toFixed(1)}°`, 10, 20);
    ctx.fillText(`φ: ${(phi * 180 / Math.PI).toFixed(1)}°`, 10, 35);
    
  }, [state, isDark]);

  return (
    <div className={`${className} ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 border ${
      isDark ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <h3 className="text-lg font-semibold mb-3 text-center">Bloch Sphere</h3>
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={200}
          height={200}
          className="border rounded"
          style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}
        />
      </div>
      <div className="text-xs text-center mt-2 opacity-70">
        Quantum state visualization on Bloch sphere
      </div>
    </div>
  );
};

export default BlochSphere;