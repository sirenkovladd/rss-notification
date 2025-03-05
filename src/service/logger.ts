class Logger {
	log(
		level: string,
		obj: Record<string, unknown>,
		msg?: string,
		log: (data: unknown) => void = console.log,
	) {
		const objV = {
			...obj,
			level,
			date: new Date().toISOString().replace(/Z/g, ""),
			...(msg ? { msg } : {}),
		};
		log(JSON.stringify(objV));
	}

	wrap(
		level: string,
		v: Record<string, unknown> | string,
		msg?: string,
		log?: (data: unknown) => void,
	) {
		if (typeof v === "string") {
			this.log(level, {}, v, console.log);
		} else {
			this.log(level, v, msg, console.log);
		}
	}

	debug(v: Record<string, unknown>): void;
	debug(v: string): void;
	debug(v: Record<string, unknown>, msg?: string): void;
	debug(v: Record<string, unknown> | string, msg?: string): void {
		this.wrap("debug", v, msg, console.log);
	}

	info(v: Record<string, unknown>): void;
	info(v: string): void;
	info(v: Record<string, unknown>, msg?: string): void;
	info(v: Record<string, unknown> | string, msg?: string): void {
		this.wrap("info", v, msg, console.log);
	}

	warn(v: Record<string, unknown>): void;
	warn(v: string): void;
	warn(v: Record<string, unknown>, msg?: string): void;
	warn(v: Record<string, unknown> | string, msg?: string): void {
		this.wrap("warn", v, msg, console.log);
	}

	error(v: Record<string, unknown>): void;
	error(v: string): void;
	error(v: Record<string, unknown>, msg?: string): void;
	error(v: Record<string, unknown> | string, msg?: string): void {
		this.wrap("error", v, msg, console.error);
	}
}
export const logger = new Logger();
