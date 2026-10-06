if (typeof window !== 'undefined' && import.meta.env?.DEV) {
	const originalWarn = console.warn;
	console.warn = function warn(...args) {
		if (
			args.length === 1 &&
			typeof args[0] === 'string' &&
			/<(Layout|Page|Error)(_[\w$]+)?> was created (with unknown|without expected) prop '(data|form|params)'/.test(
				args[0]
			)
		) {
			return;
		}
		originalWarn.apply(console, args);
	};
}

export const handle = async ({ event, resolve }) => {
    const response = await resolve(event, {
      ssr: false,
    });
    return response;
};