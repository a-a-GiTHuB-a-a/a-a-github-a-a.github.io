import paper from "paper";
export class Point3 implements Iterable<number, undefined, undefined> {
	x:number;
	y:number;
	z:number;

	static origin = new Point3(0, 0, 0);

	constructor(x:number, y:number, z:number) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	static fromPointLike(arg:PointLike):Point3 {
		if (arg instanceof Point3) {
			return arg;
		} else {
			return new Point3(arg[0], arg[1], arg[2]);
		}
	}

	norm():number {
		return Math.sqrt(this.x**2+this.y**2+this.z**2);
	}

	toArray():[number, number, number] {
		return [this.x, this.y, this.z];
	}

	project(plane:OriginPlane3):paper.Point {

	};

	scale(sx:number,sy:number,sz:number):Point3;
	scale(s:number):Point3;
	scale(...args:number[]):Point3 {
		if (args.length === 1) {
			return Matrix3.scale(args[0]).transform(this);
		} else if (args.length === 3) {
			return Matrix3.scale(args[0], args[1], args[2]).transform(this);
		} else {
			throw new Error("how");
		}
	}

	*[Symbol.iterator]():Iterator<number, undefined, undefined> {
		yield this.x;
		yield this.y;
		yield this.z;
	}
};
export class OriginPlane3 {
	bx:Point3;
	by:Point3;

	/**
	 * Define a plane through the origin in terms of two basis vectors. Orthonormalizes automatically.
	 * @param kx x vector
	 * @param ky combination of x and y vectors
	 */
	constructor(kx:Point3, ky:Point3) {
		this.bx = kx.scale(1/kx.norm());
		this.by = kx.scale(1/kx.norm());
	}
};
export type PointLike = Point3|[number, number, number];
export class Matrix3 {
	a:number;
	b:number;
	c:number;
	d:number;
	e:number;
	f:number;
	g:number;
	h:number;
	i:number;
	tx:number;
	ty:number;
	tz:number;

	constructor(a:number, b:number, c:number, d:number, e:number, f:number, g:number, h:number, i:number, tx:number, ty:number, tz:number) {
		this.a = a;
		this.b = b;
		this.c = c;
		this.d = d;
		this.e = e;
		this.f = f;
		this.g = g;
		this.h = h;
		this.i = i;
		this.tx = tx;
		this.ty = ty;
		this.tz = tz;
	}

	static fromColumns(cx:PointLike, cy:PointLike, cz:PointLike, ct:PointLike):Matrix3 {
		let px = Point3.fromPointLike(cx).toArray();
		let py = Point3.fromPointLike(cy).toArray();
		let pz = Point3.fromPointLike(cz).toArray();
		let pt = Point3.fromPointLike(ct).toArray();
		return new Matrix3(...px, ...py, ...pz, ...pt);
	}

	static scale(s:number):Matrix3;
	static scale(sx:number, sy:number, sz:number):Matrix3;
	static scale(...args:number[]):Matrix3 {
		if (args.length === 1) {
			return this.scale(args[0], args[0], args[0]);
		} else if (args.length === 3) {
			return Matrix3.fromColumns([args[0], 0, 0], [0, args[1], 0], [0, 0, args[2]], Point3.origin);
		} else {
			throw new Error("how");
		}
	}

	transform(p:Point3):Point3 {
		return new Point3(
			this.a*p.x + this.b*p.y + this.c*p.z + this.tx,
			this.d*p.x + this.e*p.y + this.f*p.z + this.ty,
			this.g*p.x + this.h*p.y + this.i*p.z + this.tz,
		);
	}
};
export class Hypercube {
	
};