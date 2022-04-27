export async function fetchWithTimeout(fetch, resource, options: any = {}) {
    const { timeout, headers } = options;
    const abortController = new AbortController();
    const reqID = Math.random().toString().substring(2, 8)
    const id = setTimeout(() => {
        console.log(`[TIMEOUT:${reqID}] ${resource}`);
        abortController.abort();
    }, timeout || 3000);

    const response = await fetch(resource, {
        ...options,
        headers: {
            ...headers,
            "SBR-TIMEOUT": timeout || 3000,
            "SBR-REQ-ID": reqID,
        },
        signal: abortController.signal,
        timeout,
    });

    clearTimeout(id);
    return response;
}
