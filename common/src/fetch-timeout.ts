export async function fetchWithTimeout(fetch, resource, options: any = {}) {
    const { timeout = 2000 } = options;
    const abortController = new AbortController();
    const id = setTimeout(() => {
        console.log(`[TIMEOUT] ${resource}`);
        abortController.abort();
    }, timeout);
    const response = await fetch(resource, {
        ...options,
        signal: abortController.signal,
        timeout,
    });
    clearTimeout(id);
    return response;
}
