import { getEnv } from './env.js';

let cachedOrigins;

function parseOrigins() {
	if (cachedOrigins) return cachedOrigins;
	const env = getEnv();
	const raw = env.corsAllowOrigins || '*';
	const list = raw
		.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean);
	cachedOrigins = list.length ? list : ['*'];
	return cachedOrigins;
}

function resolveOrigin(requestOrigin) {
	const origins = parseOrigins();
	if (origins.includes('*')) return '*';
	if (requestOrigin && origins.includes(requestOrigin)) return requestOrigin;
	return origins[0] || '*';
}

function buildAllowList(defaults = [], extra = []) {
	return Array.from(new Set([...defaults, ...extra])).join(', ');
}

export function applyCors(req, res, { methods = ['GET'], headers = [] } = {}) {
	const origin = resolveOrigin(req.headers.origin);
	res.setHeader('Access-Control-Allow-Origin', origin);
	if (origin !== '*') {
		res.setHeader('Vary', 'Origin');
	}

	const allowMethods = buildAllowList(['OPTIONS'], methods);
	res.setHeader('Access-Control-Allow-Methods', allowMethods);

	const allowHeaders = buildAllowList(['Content-Type'], headers);
	res.setHeader('Access-Control-Allow-Headers', allowHeaders);
	res.setHeader('Access-Control-Max-Age', '86400');
}

export function handleCors(req, res, options) {
	if (req.method === 'OPTIONS') {
		applyCors(req, res, options);
		res.status(200).end();
		return true;
	}

	applyCors(req, res, options);
	return false;
}
