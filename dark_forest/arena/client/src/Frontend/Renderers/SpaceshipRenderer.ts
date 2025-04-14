import { EngineUtils, glsl } from '@darkforest_eth/renderer';
import { WorldCoords } from '@darkforest_eth/types';
import Viewport from '../Game/Viewport';
import autoBind from 'auto-bind';

// Define a simpler SpaceshipRenderer class
export class SpaceshipRenderer {
  private gl: WebGL2RenderingContext;
  private viewport: Viewport;
  private spaceshipCoords: WorldCoords;
  private size: number;
  private startTime: number;
  private frameRequestId: number | null = null;
  private program: WebGLProgram | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private projectionUniformLocation: WebGLUniformLocation | null = null;
  private timeUniformLocation: WebGLUniformLocation | null = null;
  
  constructor(gl: WebGL2RenderingContext, viewport: Viewport, spaceshipCoords: WorldCoords) {
    this.gl = gl;
    this.viewport = viewport;
    this.spaceshipCoords = spaceshipCoords;
    this.size = 0.1; // Reduced from 2 to 0.1 (20x smaller)
    this.startTime = Date.now();
    
    autoBind(this);
    
    // Initialize the WebGL program
    this.initWebGL();
    
    // Start animation loop
    this.frameRequestId = requestAnimationFrame(this.animate);
  }
  
  private initWebGL() {
    const gl = this.gl;
    
    // Create vertex shader
    const vertexShaderSource = `
      attribute vec4 a_position;
      uniform mat4 u_matrix;
      
      varying vec2 v_texcoord;
      
      void main() {
        gl_Position = u_matrix * vec4(a_position.xy, 0.0, 1.0);
        v_texcoord = a_position.zw;
      }
    `;
    
    // Create fragment shader
    const fragmentShaderSource = `
      precision highp float;
      
      varying vec2 v_texcoord;
      uniform float u_time;
      
      // Function to create a step-based circular gradient for pixel art look
      float circlePixelArt(vec2 coord, float radius, int steps) {
        float dist = length(coord);
        float stepSize = radius / float(steps);
        return floor(dist / stepSize) * stepSize;
      }
      
      void main() {
        // Distance from center
        float dist = length(v_texcoord);
        
        // Discard pixels outside the circle
        if (dist > 1.0) discard;
        
        // Create pixelated look by stepping the distance
        float pixelDist = circlePixelArt(v_texcoord, 1.0, 8);
        
        // Color palette for Sputnik
        vec3 silver = vec3(0.8, 0.8, 0.85);
        vec3 darkSilver = vec3(0.6, 0.6, 0.65);
        vec3 antenna = vec3(0.4, 0.4, 0.45);
        vec3 highlight = vec3(0.9, 0.9, 0.95);
        
        // Calculate a slow rotation for subtle animation
        float rotationSpeed = 0.2;
        float angle = u_time * rotationSpeed;
        vec2 rotatedCoord = vec2(
          v_texcoord.x * cos(angle) - v_texcoord.y * sin(angle),
          v_texcoord.x * sin(angle) + v_texcoord.y * cos(angle)
        );
        
        // Main satellite body
        if (pixelDist < 0.65) {
          // Create a 3D look with simple lighting
          float shade = 0.6 + 0.4 * dot(normalize(rotatedCoord), vec2(0.707, 0.707));
          
          // Add some pixel variation
          if (mod(floor(rotatedCoord.x * 10.0) + floor(rotatedCoord.y * 10.0), 2.0) < 0.5) {
            gl_FragColor = vec4(silver * shade, 1.0);
          } else {
            gl_FragColor = vec4(darkSilver * shade, 1.0);
          }
          
          // Add a highlight on one side
          if (rotatedCoord.x > 0.3 && rotatedCoord.y > 0.3 && length(rotatedCoord - vec2(0.4, 0.4)) < 0.15) {
            gl_FragColor = vec4(highlight, 1.0);
          }
        } 
        // Antenna elements
        else if (abs(rotatedCoord.x) < 0.12 && rotatedCoord.y > 0.65) {
          // Vertical antenna
          gl_FragColor = vec4(antenna, 1.0);
        }
        else if (abs(rotatedCoord.y) < 0.12 && rotatedCoord.x > 0.65) {
          // Horizontal antenna
          gl_FragColor = vec4(antenna, 1.0);
        }
        // Outer shell
        else {
          float shade = 0.5 + 0.5 * dot(normalize(rotatedCoord), vec2(0.707, 0.707));
          gl_FragColor = vec4(darkSilver * shade, 1.0);
          
          // Create some panel seams
          if (abs(mod(atan(rotatedCoord.y, rotatedCoord.x) * 3.0, 1.0) - 0.5) < 0.05) {
            gl_FragColor.rgb *= 0.7;
          }
        }
      }
    `;
    
    // Create shader program
    const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) {
      console.error('Could not create shaders');
      return;
    }
    
    this.program = this.createProgram(vertexShader, fragmentShader);
    
    if (!this.program) {
      console.error('Could not create program');
      return;
    }
    
    // Look up uniform locations
    this.projectionUniformLocation = gl.getUniformLocation(this.program, 'u_matrix');
    this.timeUniformLocation = gl.getUniformLocation(this.program, 'u_time');
    
    // Create and set up buffers
    this.positionBuffer = gl.createBuffer();
  }
  
  private createShader(type: number, source: string): WebGLShader | null {
    const gl = this.gl;
    const shader = gl.createShader(type);
    
    if (!shader) {
      console.error('Could not create shader');
      return null;
    }
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
      console.error('Could not compile shader:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }
  
  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null {
    const gl = this.gl;
    const program = gl.createProgram();
    
    if (!program) {
      console.error('Could not create program');
      return null;
    }
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
      console.error('Could not link program:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    
    return program;
  }
  
  public animate() {
    this.frameRequestId = requestAnimationFrame(this.animate);
    
    // Request a redraw
    this.flush();
  }
  
  // Call this to update Sputnik's position
  public updatePosition(newCoords: WorldCoords) {
    this.spaceshipCoords = newCoords;
  }
  
  // Called each frame to draw the spaceship
  public flush() {
    const gl = this.gl;
    
    if (!this.program || !this.positionBuffer) {
      return;
    }
    
    // Calculate time for animation
    const time = (Date.now() - this.startTime) / 1000.0;
    
    // Convert world coordinates to canvas coordinates
    const centerCanvas = this.viewport.worldToCanvasCoords(this.spaceshipCoords);
    const radius = this.viewport.worldToCanvasDist(this.size);
    
    // Set up a square for the spaceship
    const x = centerCanvas.x;
    const y = centerCanvas.y;
    const x1 = x - radius;
    const y1 = y - radius;
    const x2 = x + radius;
    const y2 = y + radius;
    
    // Create vertices for a quad (two triangles)
    // Each vertex has position (x,y) and texture coordinates for fragment shader
    const positions = [
      // First triangle
      x1, y1, -1, -1,  // top-left corner
      x2, y1, 1, -1,   // top-right corner
      x1, y2, -1, 1,   // bottom-left corner
      
      // Second triangle
      x1, y2, -1, 1,   // bottom-left corner
      x2, y1, 1, -1,   // top-right corner
      x2, y2, 1, 1,    // bottom-right corner
    ];
    
    // Use the program
    gl.useProgram(this.program);
    
    // Set the projection matrix
    if (this.projectionUniformLocation) {
      // Get projection matrix from the viewport or renderer
      // This is a simplification - you would need the actual projection matrix
      const projectionMatrix = (gl as any).projectionMatrix || [
        2 / gl.canvas.width, 0, 0, 0,
        0, -2 / gl.canvas.height, 0, 0,
        0, 0, 1, 0,
        -1, 1, 0, 1
      ];
      
      gl.uniformMatrix4fv(this.projectionUniformLocation, false, projectionMatrix);
    }
    
    // Set the time uniform
    if (this.timeUniformLocation) {
      gl.uniform1f(this.timeUniformLocation, time);
    }
    
    // Set up position attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    const positionAttributeLocation = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 4, gl.FLOAT, false, 0, 0);
    
    // Draw the triangles
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  
  // Cleanup
  public destroy() {
    if (this.frameRequestId !== null) {
      cancelAnimationFrame(this.frameRequestId);
      this.frameRequestId = null;
    }
    
    // Clean up WebGL resources
    const gl = this.gl;
    if (this.program) {
      gl.deleteProgram(this.program);
      this.program = null;
    }
    
    if (this.positionBuffer) {
      gl.deleteBuffer(this.positionBuffer);
      this.positionBuffer = null;
    }
  }
}

// Helper function to initialize the renderer
export function createSpaceshipRenderer(
  gl: WebGL2RenderingContext | null,
  viewport: Viewport,
  coords: WorldCoords
): SpaceshipRenderer | null {
  if (!gl) return null;
  
  return new SpaceshipRenderer(gl, viewport, coords);
} 