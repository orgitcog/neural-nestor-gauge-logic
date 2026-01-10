/**
 * HYPERCOMPLEX NUMBER SYSTEMS
 * 
 * Implementation of the Cayley-Dickson construction sequence:
 * Real (ℝ) → Complex (ℂ) → Quaternion (ℍ) → Octonion (𝕆) → Sedenion (𝕊) → ...
 * 
 * Each algebra doubles in dimension and loses algebraic structure:
 * - ℝ: Ordered, commutative, associative, division
 * - ℂ: Commutative, associative, division (loses ordering)
 * - ℍ: Associative, division (loses commutativity)
 * - 𝕆: Division/alternative (loses associativity)
 * - 𝕊: None (loses division, has zero divisors)
 * 
 * These correspond to different AI paradigms:
 * - Boolean: Symbolic logic
 * - Real: Neural networks
 * - Complex: Quantum-inspired AI
 * - Quaternion: 3D spatial reasoning
 * - Octonion: Non-associative reasoning
 * - Sedenion: Over-parameterized systems
 * - Higher: Hyper-dimensional computing
 */

/**
 * Base interface for all hypercomplex numbers
 */
export interface HypercomplexNumber {
  /** Dimension of the algebra (1, 2, 4, 8, 16, ...) */
  readonly dimension: number;
  
  /** Components as an array */
  readonly components: Float64Array;
  
  /** Name of the algebra type */
  readonly algebraType: AlgebraType;
}

/**
 * Types of hypercomplex algebras
 */
export enum AlgebraType {
  Real = 'Real',
  Complex = 'Complex',
  Quaternion = 'Quaternion',
  Octonion = 'Octonion',
  Sedenion = 'Sedenion',
  Trigintaduonion = 'Trigintaduonion',  // 32-dimensional
  Sexagintaquatronion = 'Sexagintaquatronion',  // 64-dimensional
}

/**
 * Get dimension for an algebra type
 */
export function algebraDimension(type: AlgebraType): number {
  switch (type) {
    case AlgebraType.Real: return 1;
    case AlgebraType.Complex: return 2;
    case AlgebraType.Quaternion: return 4;
    case AlgebraType.Octonion: return 8;
    case AlgebraType.Sedenion: return 16;
    case AlgebraType.Trigintaduonion: return 32;
    case AlgebraType.Sexagintaquatronion: return 64;
  }
}

/**
 * COMPLEX NUMBERS (ℂ)
 * 
 * Two-dimensional: a + bi
 * Properties: Commutative, associative, division algebra
 * 
 * Multiplication: (a + bi)(c + di) = (ac - bd) + (ad + bc)i
 * 
 * AI Correspondence: Quantum-inspired neural networks, Fourier learning
 */
export class Complex implements HypercomplexNumber {
  readonly dimension = 2;
  readonly algebraType = AlgebraType.Complex;
  readonly components: Float64Array;
  
  constructor(real: number, imag: number) {
    this.components = new Float64Array([real, imag]);
  }
  
  get real(): number { return this.components[0]; }
  get imag(): number { return this.components[1]; }
  
  /** Addition: (a + bi) + (c + di) = (a+c) + (b+d)i */
  add(other: Complex): Complex {
    return new Complex(
      this.real + other.real,
      this.imag + other.imag
    );
  }
  
  /** Multiplication: (a + bi)(c + di) = (ac - bd) + (ad + bc)i */
  multiply(other: Complex): Complex {
    return new Complex(
      this.real * other.real - this.imag * other.imag,
      this.real * other.imag + this.imag * other.real
    );
  }
  
  /** Complex conjugate: (a + bi)* = a - bi */
  conjugate(): Complex {
    return new Complex(this.real, -this.imag);
  }
  
  /** Norm squared: |z|² = zz* = a² + b² */
  normSquared(): number {
    return this.real * this.real + this.imag * this.imag;
  }
  
  /** Norm: |z| = √(a² + b²) */
  norm(): number {
    return Math.sqrt(this.normSquared());
  }
  
  /** Division: z/w = z * w* / |w|² */
  divide(other: Complex): Complex {
    const denom = other.normSquared();
    const conj = other.conjugate();
    const num = this.multiply(conj);
    return new Complex(num.real / denom, num.imag / denom);
  }
  
  /** Scalar multiplication */
  scale(scalar: number): Complex {
    return new Complex(this.real * scalar, this.imag * scalar);
  }
  
  /** String representation */
  toString(): string {
    const sign = this.imag >= 0 ? '+' : '';
    return `${this.real.toFixed(3)} ${sign} ${this.imag.toFixed(3)}i`;
  }
}

/**
 * QUATERNIONS (ℍ)
 * 
 * Four-dimensional: a + bi + cj + dk
 * Properties: Non-commutative, associative, division algebra
 * 
 * Multiplication table:
 *   i² = j² = k² = ijk = -1
 *   ij = k, jk = i, ki = j
 *   ji = -k, kj = -i, ik = -j
 * 
 * AI Correspondence: 3D spatial reasoning, rotation-equivariant networks
 */
export class Quaternion implements HypercomplexNumber {
  readonly dimension = 4;
  readonly algebraType = AlgebraType.Quaternion;
  readonly components: Float64Array;
  
  constructor(w: number, x: number, y: number, z: number) {
    this.components = new Float64Array([w, x, y, z]);
  }
  
  get w(): number { return this.components[0]; }  // Real part
  get x(): number { return this.components[1]; }  // i component
  get y(): number { return this.components[2]; }  // j component
  get z(): number { return this.components[3]; }  // k component
  
  /** Addition */
  add(other: Quaternion): Quaternion {
    return new Quaternion(
      this.w + other.w,
      this.x + other.x,
      this.y + other.y,
      this.z + other.z
    );
  }
  
  /** Multiplication (Hamilton product) - NOTE: Non-commutative! */
  multiply(other: Quaternion): Quaternion {
    return new Quaternion(
      this.w * other.w - this.x * other.x - this.y * other.y - this.z * other.z,
      this.w * other.x + this.x * other.w + this.y * other.z - this.z * other.y,
      this.w * other.y - this.x * other.z + this.y * other.w + this.z * other.x,
      this.w * other.z + this.x * other.y - this.y * other.x + this.z * other.w
    );
  }
  
  /** Conjugate: (w + xi + yj + zk)* = w - xi - yj - zk */
  conjugate(): Quaternion {
    return new Quaternion(this.w, -this.x, -this.y, -this.z);
  }
  
  /** Norm squared */
  normSquared(): number {
    return this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z;
  }
  
  /** Norm */
  norm(): number {
    return Math.sqrt(this.normSquared());
  }
  
  /** Division: q/p = q * p* / |p|² */
  divide(other: Quaternion): Quaternion {
    const denom = other.normSquared();
    const conj = other.conjugate();
    const num = this.multiply(conj);
    return new Quaternion(
      num.w / denom,
      num.x / denom,
      num.y / denom,
      num.z / denom
    );
  }
  
  /** Scalar multiplication */
  scale(scalar: number): Quaternion {
    return new Quaternion(
      this.w * scalar,
      this.x * scalar,
      this.y * scalar,
      this.z * scalar
    );
  }
  
  /** Convert to rotation matrix (3x3) for 3D rotations */
  toRotationMatrix(): number[][] {
    const w = this.w, x = this.x, y = this.y, z = this.z;
    return [
      [1 - 2*(y*y + z*z), 2*(x*y - w*z), 2*(x*z + w*y)],
      [2*(x*y + w*z), 1 - 2*(x*x + z*z), 2*(y*z - w*x)],
      [2*(x*z - w*y), 2*(y*z + w*x), 1 - 2*(x*x + y*y)]
    ];
  }
  
  /** Create from axis-angle representation */
  static fromAxisAngle(axis: [number, number, number], angle: number): Quaternion {
    const halfAngle = angle / 2;
    const s = Math.sin(halfAngle);
    const c = Math.cos(halfAngle);
    const [ax, ay, az] = axis;
    const norm = Math.sqrt(ax*ax + ay*ay + az*az);
    return new Quaternion(c, s*ax/norm, s*ay/norm, s*az/norm);
  }
  
  /** String representation */
  toString(): string {
    return `${this.w.toFixed(3)} + ${this.x.toFixed(3)}i + ${this.y.toFixed(3)}j + ${this.z.toFixed(3)}k`;
  }
}

/**
 * OCTONIONS (𝕆)
 * 
 * Eight-dimensional: e₀ + e₁ + e₂ + ... + e₇
 * Properties: Non-associative, alternative, division algebra
 * 
 * Multiplication: Uses Cayley-Dickson construction from quaternions
 * - (a, b)(c, d) = (ac - d*b, da + bc*)
 * - Non-associative: (xy)z ≠ x(yz) in general
 * - Alternative: x(xy) = (xx)y and x(yx) = (xy)x
 * 
 * AI Correspondence: Non-associative reasoning, context-sensitive learning
 */
export class Octonion implements HypercomplexNumber {
  readonly dimension = 8;
  readonly algebraType = AlgebraType.Octonion;
  readonly components: Float64Array;
  
  constructor(components: number[] | Float64Array) {
    if (components.length !== 8) {
      throw new Error('Octonion requires exactly 8 components');
    }
    this.components = components instanceof Float64Array 
      ? components 
      : new Float64Array(components);
  }
  
  /** Get component by index (0-7) */
  get(i: number): number {
    return this.components[i];
  }
  
  /** Addition */
  add(other: Octonion): Octonion {
    const result = new Float64Array(8);
    for (let i = 0; i < 8; i++) {
      result[i] = this.components[i] + other.components[i];
    }
    return new Octonion(result);
  }
  
  /** Multiplication using Cayley-Dickson construction */
  multiply(other: Octonion): Octonion {
    // Represent as pair of quaternions: (a, b) * (c, d) = (ac - d*b, da + bc*)
    const a = new Quaternion(this.get(0), this.get(1), this.get(2), this.get(3));
    const b = new Quaternion(this.get(4), this.get(5), this.get(6), this.get(7));
    const c = new Quaternion(other.get(0), other.get(1), other.get(2), other.get(3));
    const d = new Quaternion(other.get(4), other.get(5), other.get(6), other.get(7));
    
    // ac - d*b
    const ac = a.multiply(c);
    const dStarB = d.conjugate().multiply(b);
    const first = ac.add(dStarB.scale(-1));
    
    // da + bc*
    const da = d.multiply(a);
    const bcStar = b.multiply(c.conjugate());
    const second = da.add(bcStar);
    
    return new Octonion([
      first.w, first.x, first.y, first.z,
      second.w, second.x, second.y, second.z
    ]);
  }
  
  /** Conjugate: negates all non-scalar components */
  conjugate(): Octonion {
    const result = new Float64Array(8);
    result[0] = this.components[0];
    for (let i = 1; i < 8; i++) {
      result[i] = -this.components[i];
    }
    return new Octonion(result);
  }
  
  /** Norm squared */
  normSquared(): number {
    let sum = 0;
    for (let i = 0; i < 8; i++) {
      sum += this.components[i] * this.components[i];
    }
    return sum;
  }
  
  /** Norm */
  norm(): number {
    return Math.sqrt(this.normSquared());
  }
  
  /** Division (still possible despite non-associativity) */
  divide(other: Octonion): Octonion {
    const denom = other.normSquared();
    const conj = other.conjugate();
    const num = this.multiply(conj);
    return num.scale(1 / denom);
  }
  
  /** Scalar multiplication */
  scale(scalar: number): Octonion {
    const result = new Float64Array(8);
    for (let i = 0; i < 8; i++) {
      result[i] = this.components[i] * scalar;
    }
    return new Octonion(result);
  }
  
  /** String representation */
  toString(): string {
    return `(${Array.from(this.components).map(c => c.toFixed(3)).join(', ')})`;
  }
}

/**
 * SEDENIONS (𝕊)
 * 
 * 16-dimensional Cayley-Dickson algebra
 * Properties: No longer a division algebra (has zero divisors!)
 * 
 * Loses division property - makes it "pathological" but interesting for:
 * - Over-parameterized neural networks
 * - Redundant representations
 * - Understanding degenerate systems
 * 
 * AI Correspondence: Over-parameterized systems, redundant encodings
 */
export class Sedenion implements HypercomplexNumber {
  readonly dimension = 16;
  readonly algebraType = AlgebraType.Sedenion;
  readonly components: Float64Array;
  
  constructor(components: number[] | Float64Array) {
    if (components.length !== 16) {
      throw new Error('Sedenion requires exactly 16 components');
    }
    this.components = components instanceof Float64Array 
      ? components 
      : new Float64Array(components);
  }
  
  /** Get component by index (0-15) */
  get(i: number): number {
    return this.components[i];
  }
  
  /** Addition */
  add(other: Sedenion): Sedenion {
    const result = new Float64Array(16);
    for (let i = 0; i < 16; i++) {
      result[i] = this.components[i] + other.components[i];
    }
    return new Sedenion(result);
  }
  
  /** Multiplication using Cayley-Dickson construction from octonions */
  multiply(other: Sedenion): Sedenion {
    // Represent as pair of octonions: (a, b) * (c, d) = (ac - d*b, da + bc*)
    const a = new Octonion(this.components.slice(0, 8));
    const b = new Octonion(this.components.slice(8, 16));
    const c = new Octonion(other.components.slice(0, 8));
    const d = new Octonion(other.components.slice(8, 16));
    
    // ac - d*b
    const ac = a.multiply(c);
    const dStarB = d.conjugate().multiply(b);
    const first = ac.add(dStarB.scale(-1));
    
    // da + bc*
    const da = d.multiply(a);
    const bcStar = b.multiply(c.conjugate());
    const second = da.add(bcStar);
    
    const result = new Float64Array(16);
    result.set(first.components, 0);
    result.set(second.components, 8);
    return new Sedenion(result);
  }
  
  /** Conjugate */
  conjugate(): Sedenion {
    const result = new Float64Array(16);
    result[0] = this.components[0];
    for (let i = 1; i < 16; i++) {
      result[i] = -this.components[i];
    }
    return new Sedenion(result);
  }
  
  /** Norm squared */
  normSquared(): number {
    let sum = 0;
    for (let i = 0; i < 16; i++) {
      sum += this.components[i] * this.components[i];
    }
    return sum;
  }
  
  /** Norm */
  norm(): number {
    return Math.sqrt(this.normSquared());
  }
  
  /** Scalar multiplication */
  scale(scalar: number): Sedenion {
    const result = new Float64Array(16);
    for (let i = 0; i < 16; i++) {
      result[i] = this.components[i] * scalar;
    }
    return new Sedenion(result);
  }
  
  /** String representation */
  toString(): string {
    return `Sedenion(${this.components[0].toFixed(3)}, ...)`;
  }
}

/**
 * Generic Cayley-Dickson construction for arbitrary dimensions
 * Constructs 2^n-dimensional algebras
 */
export class CayleyDickson implements HypercomplexNumber {
  readonly dimension: number;
  readonly algebraType: AlgebraType;
  readonly components: Float64Array;
  
  constructor(components: number[] | Float64Array, algebraType?: AlgebraType) {
    const dim = components.length;
    // Check that dimension is a power of 2
    if (dim === 0 || (dim & (dim - 1)) !== 0) {
      throw new Error('CayleyDickson dimension must be a power of 2');
    }
    
    this.dimension = dim;
    this.components = components instanceof Float64Array 
      ? components 
      : new Float64Array(components);
    
    // Infer algebra type from dimension if not provided
    if (algebraType) {
      this.algebraType = algebraType;
    } else {
      switch (dim) {
        case 1: this.algebraType = AlgebraType.Real; break;
        case 2: this.algebraType = AlgebraType.Complex; break;
        case 4: this.algebraType = AlgebraType.Quaternion; break;
        case 8: this.algebraType = AlgebraType.Octonion; break;
        case 16: this.algebraType = AlgebraType.Sedenion; break;
        case 32: this.algebraType = AlgebraType.Trigintaduonion; break;
        case 64: this.algebraType = AlgebraType.Sexagintaquatronion; break;
        default: this.algebraType = AlgebraType.Real; break;
      }
    }
  }
  
  /** Addition */
  add(other: CayleyDickson): CayleyDickson {
    if (this.dimension !== other.dimension) {
      throw new Error('Cannot add CayleyDickson numbers of different dimensions');
    }
    const result = new Float64Array(this.dimension);
    for (let i = 0; i < this.dimension; i++) {
      result[i] = this.components[i] + other.components[i];
    }
    return new CayleyDickson(result, this.algebraType);
  }
  
  /** Multiplication via recursive Cayley-Dickson construction */
  multiply(other: CayleyDickson): CayleyDickson {
    if (this.dimension !== other.dimension) {
      throw new Error('Cannot multiply CayleyDickson numbers of different dimensions');
    }
    
    if (this.dimension === 1) {
      // Real multiplication
      return new CayleyDickson([this.components[0] * other.components[0]]);
    }
    
    // Split into two halves: (a, b) * (c, d) = (ac - d*b, da + bc*)
    const half = this.dimension / 2;
    const a = new CayleyDickson(this.components.slice(0, half));
    const b = new CayleyDickson(this.components.slice(half));
    const c = new CayleyDickson(other.components.slice(0, half));
    const d = new CayleyDickson(other.components.slice(half));
    
    const ac = a.multiply(c);
    const dStarB = d.conjugate().multiply(b);
    const first = ac.add(dStarB.scale(-1));
    
    const da = d.multiply(a);
    const bcStar = b.multiply(c.conjugate());
    const second = da.add(bcStar);
    
    const result = new Float64Array(this.dimension);
    result.set(first.components, 0);
    result.set(second.components, half);
    return new CayleyDickson(result, this.algebraType);
  }
  
  /** Conjugate */
  conjugate(): CayleyDickson {
    const result = new Float64Array(this.dimension);
    result[0] = this.components[0];
    for (let i = 1; i < this.dimension; i++) {
      result[i] = -this.components[i];
    }
    return new CayleyDickson(result, this.algebraType);
  }
  
  /** Norm squared */
  normSquared(): number {
    let sum = 0;
    for (let i = 0; i < this.dimension; i++) {
      sum += this.components[i] * this.components[i];
    }
    return sum;
  }
  
  /** Norm */
  norm(): number {
    return Math.sqrt(this.normSquared());
  }
  
  /** Scalar multiplication */
  scale(scalar: number): CayleyDickson {
    const result = new Float64Array(this.dimension);
    for (let i = 0; i < this.dimension; i++) {
      result[i] = this.components[i] * scalar;
    }
    return new CayleyDickson(result, this.algebraType);
  }
  
  /** String representation */
  toString(): string {
    if (this.dimension <= 8) {
      return `${this.algebraType}(${Array.from(this.components).map(c => c.toFixed(3)).join(', ')})`;
    }
    return `${this.algebraType}(${this.components[0].toFixed(3)}, ... [${this.dimension} components])`;
  }
}

/**
 * Utility functions
 */

/** Create a real number (1D) */
export function real(value: number): CayleyDickson {
  return new CayleyDickson([value], AlgebraType.Real);
}

/** Create a complex number from components */
export function complex(real: number, imag: number): Complex {
  return new Complex(real, imag);
}

/** Create a quaternion from components */
export function quaternion(w: number, x: number, y: number, z: number): Quaternion {
  return new Quaternion(w, x, y, z);
}

/** Create an octonion from components */
export function octonion(...components: number[]): Octonion {
  if (components.length !== 8) {
    throw new Error('Octonion requires exactly 8 components');
  }
  return new Octonion(components);
}

/** Create a sedenion from components */
export function sedenion(...components: number[]): Sedenion {
  if (components.length !== 16) {
    throw new Error('Sedenion requires exactly 16 components');
  }
  return new Sedenion(components);
}

/** Check if two hypercomplex numbers are approximately equal */
export function hypercomplexEqual(
  a: HypercomplexNumber,
  b: HypercomplexNumber,
  epsilon = 1e-10
): boolean {
  if (a.dimension !== b.dimension) return false;
  for (let i = 0; i < a.dimension; i++) {
    if (Math.abs(a.components[i] - b.components[i]) > epsilon) {
      return false;
    }
  }
  return true;
}
